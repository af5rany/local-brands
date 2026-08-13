import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

// NOTE: The send/schedule endpoints enqueue Bull jobs. Those jobs do NOT execute
// during tests (no Bull worker running). Tests only verify HTTP response codes,
// not actual email delivery.

describe('EmailCampaignsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;
  let campaignId: number;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
    const userRepo = dataSource.getRepository('User');

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin', email: 'admin@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    await userRepo.update({ email: 'admin@example.com' }, { role: UserRole.ADMIN });
    const adminLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Owner', email: 'owner@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    await userRepo.update({ email: 'owner@example.com' }, { role: UserRole.BRAND_OWNER });
    const ownerLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'owner@example.com', password: 'password123' });
    brandOwnerToken = ownerLogin.body.token;

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer', email: 'customer@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;

    const brandRes = await request(app.getHttpServer())
      .post('/brands').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Brand', status: BrandStatus.ACTIVE });
    brandId = brandRes.body.id;

    const ownerUser = await userRepo.findOneBy({ email: 'owner@example.com' });
    await request(app.getHttpServer())
      .post(`/brands/${brandId}/assign-user`).set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: ownerUser!.id, role: 'owner' });

    // Seed a draft campaign for use in nested describes
    const campaignRes = await request(app.getHttpServer())
      .post(`/brands/${brandId}/email-campaigns`)
      .set('Authorization', `Bearer ${brandOwnerToken}`)
      .send({ subject: 'Seed Campaign', body: '<p>Hello</p>' });
    campaignId = campaignRes.body.id;
  });

  describe('GET /brands/:id/email-campaigns', () => {
    it('should return campaign list for brand owner', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/email-campaigns`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          const items = response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBeGreaterThan(0);
        });
    });

    it('should return 403 for a plain customer', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/email-campaigns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('POST /brands/:id/email-campaigns', () => {
    it('should allow brand owner to create a draft campaign', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ subject: 'New Arrivals', body: '<h1>Check out our latest!</h1>' })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.subject).toBe('New Arrivals');
          expect(response.body.id).toBeDefined();
        });
    });

    it('should return 403 when customer tries to create a campaign', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ subject: 'Unauthorized', body: '<p>Nope</p>' })
        .expect(403);
    });
  });

  describe('PUT /brands/:id/email-campaigns/:campaignId', () => {
    it('should allow brand owner to update a campaign', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/email-campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ subject: 'Updated Subject', body: '<p>Updated body</p>' })
        .expect(200)
        .then((response) => {
          expect(response.body.subject).toBe('Updated Subject');
        });
    });

    it('should return 403 when customer tries to update a campaign', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/email-campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ subject: 'Hacked', body: '<p>Nope</p>' })
        .expect(403);
    });
  });

  describe('POST /brands/:id/email-campaigns/:campaignId/schedule', () => {
    it('should schedule a campaign for a future date', () => {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString();

      return request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns/${campaignId}/schedule`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ scheduledAt })
        .then((response) => {
          expect([200, 201, 202]).toContain(response.status);
        });
    });

    it('should return 403 for customer', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns/${campaignId}/schedule`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ scheduledAt: new Date(Date.now() + 86400000).toISOString() })
        .expect(403);
    });
  });

  describe('POST /brands/:id/email-campaigns/:campaignId/send', () => {
    it('should queue a send job and return success', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns/${campaignId}/send`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 201, 202]).toContain(response.status);
        });
    });

    it('should return 403 for customer', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns/${campaignId}/send`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('DELETE /brands/:id/email-campaigns/:campaignId', () => {
    it('should allow brand owner to delete a campaign', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/email-campaigns`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ subject: 'To Delete', body: '<p>Bye</p>' });
      const deleteCampaignId = createRes.body.id;

      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/email-campaigns/${deleteCampaignId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 204]).toContain(response.status);
        });
    });

    it('should return 403 when customer tries to delete a campaign', () => {
      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/email-campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
