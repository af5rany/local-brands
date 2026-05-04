import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Guest Login (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
  });

  describe('POST /auth/guest-login', () => {
    it('returns 201 with token and isGuest=true user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/guest-login')
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.isGuest).toBe(true);
      expect(res.body.user.role).toBe('guest');
      expect(res.body.user.password).toBe('');
    });
  });

  describe('Guest access rules', () => {
    let guestToken: string;
    let guestId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/guest-login')
        .expect(201);
      guestToken = res.body.token;
      guestId = res.body.user.id;
    });

    it('GET /users/:id with guest token → 200', () => {
      return request(app.getHttpServer())
        .get(`/users/${guestId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
    });

    it('POST /wishlist with guest token → 403', () => {
      return request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ userId: guestId, productId: 999 })
        .expect(403);
    });

    it('POST /reviews with guest token → 403', () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ productId: 1, rating: 5 })
        .expect(403);
    });

    it('GET /reviews/can-review/:productId with guest token → 403', () => {
      return request(app.getHttpServer())
        .get('/reviews/can-review/1')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  describe('POST /auth/convert-guest/:id', () => {
    let guestToken: string;
    let guestId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/guest-login')
        .expect(201);
      guestToken = res.body.token;
      guestId = res.body.user.id;
    });

    it('converts guest to registered user', async () => {
      const res = await request(app.getHttpServer())
        .post(`/auth/convert-guest/${guestId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Real User',
          email: 'real@example.com',
          password: 'password123',
          role: 'customer',
        })
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.isGuest).toBe(false);
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.email).toBe('real@example.com');
      expect(res.body.user.password).toBe('');
    });

    it('returns 403 when calling convert on already converted account', async () => {
      await request(app.getHttpServer())
        .post(`/auth/convert-guest/${guestId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Real User',
          email: 'real@example.com',
          password: 'password123',
          role: 'customer',
        })
        .expect(201);

      // Second call with original guest token → 403 (isGuest now false)
      await request(app.getHttpServer())
        .post(`/auth/convert-guest/${guestId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Real User',
          email: 'real2@example.com',
          password: 'password123',
          role: 'customer',
        })
        .expect(403);
    });

    it('returns 409 when email already registered', async () => {
      // Register a real user first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Existing User',
          email: 'taken@example.com',
          password: 'password123',
          role: 'customer',
        })
        .expect(201);

      // Try to convert guest with same email
      await request(app.getHttpServer())
        .post(`/auth/convert-guest/${guestId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Real User',
          email: 'taken@example.com',
          password: 'password123',
          role: 'customer',
        })
        .expect(409);
    });

    it('returns 403 when trying to convert another user\'s guest account', async () => {
      const res2 = await request(app.getHttpServer())
        .post('/auth/guest-login')
        .expect(201);
      const otherGuestId = res2.body.user.id;

      await request(app.getHttpServer())
        .post(`/auth/convert-guest/${otherGuestId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Hacker',
          email: 'hacker@example.com',
          password: 'password123',
          role: 'customer',
        })
        .expect(403);
    });
  });
});
