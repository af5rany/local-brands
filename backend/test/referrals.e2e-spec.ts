import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('ReferralsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let referrerToken: string;
  let newUserToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);

    // Seed referrer customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Referrer User',
      email: 'referrer@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const referrerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'referrer@example.com', password: 'password123' });
    referrerToken = referrerLogin.body.token;

    // Seed new customer who will apply the referral code
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const newUserLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'newuser@example.com', password: 'password123' });
    newUserToken = newUserLogin.body.token;
  });

  describe('GET /referrals/my-code', () => {
    it('should create and return a referral code for the user', async () => {
      const res = await request(app.getHttpServer())
        .get('/referrals/my-code')
        .set('Authorization', `Bearer ${referrerToken}`)
        .expect(200);

      expect(res.body.referralCode).toBeDefined();
      expect(typeof res.body.referralCode).toEqual('string');
      expect(res.body.referralCode.length).toBeGreaterThan(0);
    });

    it('should return the same code on subsequent calls (idempotent)', async () => {
      const res1 = await request(app.getHttpServer())
        .get('/referrals/my-code')
        .set('Authorization', `Bearer ${referrerToken}`)
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .get('/referrals/my-code')
        .set('Authorization', `Bearer ${referrerToken}`)
        .expect(200);

      expect(res1.body.referralCode).toEqual(res2.body.referralCode);
    });

    it('should reject unauthenticated request (401)', () => {
      return request(app.getHttpServer())
        .get('/referrals/my-code')
        .expect(401);
    });
  });

  describe('POST /referrals/apply', () => {
    let referralCode: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .get('/referrals/my-code')
        .set('Authorization', `Bearer ${referrerToken}`);
      referralCode = res.body.referralCode;
    });

    it('should allow a new user to apply a valid referral code', async () => {
      const res = await request(app.getHttpServer())
        .post('/referrals/apply')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ code: referralCode })
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('should reject applying own referral code (400 or 403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/referrals/apply')
        .set('Authorization', `Bearer ${referrerToken}`)
        .send({ code: referralCode });

      expect([400, 403]).toContain(res.status);
    });

    it('should return 404 or 400 for an invalid referral code', async () => {
      const res = await request(app.getHttpServer())
        .post('/referrals/apply')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ code: 'INVALID_CODE_XYZ_999' });

      expect([400, 404]).toContain(res.status);
    });

    it('should reject applying a code twice by the same user', async () => {
      // First application succeeds
      await request(app.getHttpServer())
        .post('/referrals/apply')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ code: referralCode })
        .expect(201);

      // Second application fails
      const res = await request(app.getHttpServer())
        .post('/referrals/apply')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ code: referralCode });

      expect([400, 409]).toContain(res.status);
    });
  });

  describe('GET /referrals/my-referrals', () => {
    it('should return stats for the referrer (initially empty)', async () => {
      const res = await request(app.getHttpServer())
        .get('/referrals/my-referrals')
        .set('Authorization', `Bearer ${referrerToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('should reflect a successful referral after code is applied', async () => {
      const codeRes = await request(app.getHttpServer())
        .get('/referrals/my-code')
        .set('Authorization', `Bearer ${referrerToken}`);
      const code = codeRes.body.referralCode;

      await request(app.getHttpServer())
        .post('/referrals/apply')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ code });

      const statsRes = await request(app.getHttpServer())
        .get('/referrals/my-referrals')
        .set('Authorization', `Bearer ${referrerToken}`)
        .expect(200);

      // The referral stats should now contain at least one referral entry
      const referrals = statsRes.body.referrals ?? statsRes.body;
      const count = Array.isArray(referrals)
        ? referrals.length
        : statsRes.body.totalReferrals ?? statsRes.body.count ?? 0;
      expect(count).toBeGreaterThan(0);
    });

    it('should reject unauthenticated request (401)', () => {
      return request(app.getHttpServer())
        .get('/referrals/my-referrals')
        .expect(401);
    });
  });
});
