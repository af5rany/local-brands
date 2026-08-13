import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

// IMPORTANT: Expo push notification service is NOT called in these tests.
// All tests cover DB-level operations only (storing tokens, reading notifications,
// marking read). No Expo SDK mocking needed — push sending is async fire-and-forget.

describe('NotificationsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;
  let productId: number;

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

    const prodRes = await request(app.getHttpServer())
      .post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Notify Me Product', price: 50, brandId, status: 'published', isFeatured: false,
        variants: [{ color: 'Green', size: 'S', stock: 0, variantImages: ['https://example.com/img.jpg'] }] });
    productId = prodRes.body.id;
  });

  describe('GET /notifications', () => {
    it('returns object with items array (initially empty)', () => {
      return request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.items).toBeDefined();
          expect(Array.isArray(response.body.items)).toBe(true);
          expect(response.body.items.length).toEqual(0);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/notifications')
        .expect(401);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('returns { count: 0 } when no notifications exist', () => {
      return request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.count).toBeDefined();
          expect(response.body.count).toEqual(0);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/notifications/unread-count')
        .expect(401);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('marks all notifications as read → { success: true }', () => {
      return request(app.getHttpServer())
        .patch('/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .patch('/notifications/read-all')
        .expect(401);
    });
  });

  describe('POST /notifications/push-token', () => {
    it('registers a push token → 200 or 201', () => {
      return request(app.getHttpServer())
        .post('/notifications/push-token')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ token: 'ExponentPushToken[test123]', platform: 'ios' })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
        });
    });

    it('registering the same token again is idempotent', async () => {
      await request(app.getHttpServer())
        .post('/notifications/push-token')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ token: 'ExponentPushToken[test123]', platform: 'ios' });

      return request(app.getHttpServer())
        .post('/notifications/push-token')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ token: 'ExponentPushToken[test123]', platform: 'ios' })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/notifications/push-token')
        .send({ token: 'ExponentPushToken[test123]', platform: 'ios' })
        .expect(401);
    });
  });

  describe('DELETE /notifications/push-token', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/notifications/push-token')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ token: 'ExponentPushToken[test123]', platform: 'ios' });
    });

    it('unregisters a push token → 200', () => {
      return request(app.getHttpServer())
        .delete('/notifications/push-token')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ token: 'ExponentPushToken[test123]' })
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/notifications/push-token')
        .send({ token: 'ExponentPushToken[test123]' })
        .expect(401);
    });
  });

  describe('POST /notifications/notify-me/:productId', () => {
    it('subscribes to stock alert → 200 or 201 with productId', () => {
      return request(app.getHttpServer())
        .post(`/notifications/notify-me/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.productId).toEqual(productId);
        });
    });

    it('subscribing again is idempotent (returns existing subscription)', async () => {
      await request(app.getHttpServer())
        .post(`/notifications/notify-me/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      return request(app.getHttpServer())
        .post(`/notifications/notify-me/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.productId).toEqual(productId);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .post(`/notifications/notify-me/${productId}`)
        .expect(401);
    });
  });

  describe('GET /notifications/notify-me/check/:productId', () => {
    it('returns { subscribed: false } when not subscribed', () => {
      return request(app.getHttpServer())
        .get(`/notifications/notify-me/check/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.subscribed).toBe(false);
        });
    });

    it('returns { subscribed: true } after subscribing', async () => {
      await request(app.getHttpServer())
        .post(`/notifications/notify-me/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      return request(app.getHttpServer())
        .get(`/notifications/notify-me/check/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.subscribed).toBe(true);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .get(`/notifications/notify-me/check/${productId}`)
        .expect(401);
    });
  });

  describe('DELETE /notifications/notify-me/:productId', () => {
    it('unsubscribes from stock alert → check returns subscribed: false', async () => {
      await request(app.getHttpServer())
        .post(`/notifications/notify-me/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      await request(app.getHttpServer())
        .delete(`/notifications/notify-me/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/notifications/notify-me/check/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.subscribed).toBe(false);
        });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/notify-me/${productId}`)
        .expect(401);
    });
  });
});
