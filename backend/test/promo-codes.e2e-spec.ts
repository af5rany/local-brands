import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('PromoCodesModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;

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
  });

  const promoPayload = () => ({
    code: 'SAVE10',
    type: 'percentage',
    value: 10,
    minOrderAmount: 50,
    maxUses: 100,
    maxUsesPerUser: 1,
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    isActive: true,
  });

  describe('POST /brands/:brandId/promo-codes', () => {
    it('brand owner creates a promo code → 201 with correct fields', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(promoPayload())
        .expect(201)
        .then((response) => {
          expect(response.body.id).toBeDefined();
          expect(response.body.code).toEqual('SAVE10');
          expect(response.body.type).toEqual('percentage');
          expect(response.body.value).toEqual(10);
          expect(response.body.isActive).toBe(true);
        });
    });

    it('customer cannot create a promo code → 403', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(promoPayload())
        .expect(403);
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .send(promoPayload())
        .expect(401);
    });
  });

  describe('GET /brands/:brandId/promo-codes', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(promoPayload());
    });

    it('brand owner lists promo codes → 200 with items array', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.items).toBeDefined();
          expect(Array.isArray(response.body.items)).toBe(true);
          expect(response.body.items.length).toBeGreaterThan(0);
          expect(response.body.items[0].code).toEqual('SAVE10');
        });
    });

    it('customer cannot list brand promo codes → 403', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/promo-codes`)
        .expect(401);
    });
  });

  describe('PUT /brands/:brandId/promo-codes/:id', () => {
    let promoCodeId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(promoPayload());
      promoCodeId = res.body.id;
    });

    it('brand owner updates a promo code → returns updated fields', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/promo-codes/${promoCodeId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ value: 20, maxUses: 200 })
        .expect(200)
        .then((response) => {
          expect(response.body.value).toEqual(20);
          expect(response.body.maxUses).toEqual(200);
        });
    });

    it('customer cannot update a promo code → 403', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/promo-codes/${promoCodeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ value: 20 })
        .expect(403);
    });
  });

  describe('PUT /brands/:brandId/promo-codes/:id/toggle', () => {
    let promoCodeId: number;
    let initialActiveState: boolean;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(promoPayload());
      promoCodeId = res.body.id;
      initialActiveState = res.body.isActive;
    });

    it('brand owner toggles promo code active state', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/promo-codes/${promoCodeId}/toggle`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.isActive).toBe(!initialActiveState);
        });
    });

    it('toggling again re-activates the code', async () => {
      await request(app.getHttpServer())
        .put(`/brands/${brandId}/promo-codes/${promoCodeId}/toggle`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .put(`/brands/${brandId}/promo-codes/${promoCodeId}/toggle`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.isActive).toBe(initialActiveState);
        });
    });
  });

  describe('GET /brands/:brandId/promo-codes/:id/usage', () => {
    let promoCodeId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(promoPayload());
      promoCodeId = res.body.id;
    });

    it('brand owner gets usage stats → 200 with totalUses = 0 initially', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/promo-codes/${promoCodeId}/usage`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.totalUses).toBeDefined();
          expect(response.body.totalUses).toEqual(0);
        });
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/promo-codes/${promoCodeId}/usage`)
        .expect(401);
    });
  });

  describe('DELETE /brands/:brandId/promo-codes/:id', () => {
    let promoCodeId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(promoPayload());
      promoCodeId = res.body.id;
    });

    it('brand owner deletes a promo code → 200 or 204', () => {
      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/promo-codes/${promoCodeId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 204]).toContain(response.status);
        });
    });

    it('customer cannot delete a promo code → 403', () => {
      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/promo-codes/${promoCodeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('POST /promo-codes/validate', () => {
    beforeEach(async () => {
      // Use a past startDate so the code is immediately valid
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/promo-codes`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({
          ...promoPayload(),
          minOrderAmount: 0,
          startDate: new Date(Date.now() - 86400000).toISOString(),
        });
    });

    it('customer validates a valid promo code → 200 with discount', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'SAVE10', brandId, cartTotal: 200 })
        .expect((res) => { expect([200, 201]).toContain(res.status); })
        .then((response) => {
          expect(response.body.valid).toBe(true);
          expect(response.body.discountAmount).toBeGreaterThan(0);
          expect(response.body.code).toEqual('SAVE10');
        });
    });

    it('unknown promo code → 400 or 404', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'NONEXISTENT', brandId, cartTotal: 200 })
        .then((response) => {
          expect([400, 404]).toContain(response.status);
        });
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .post('/promo-codes/validate')
        .send({ code: 'SAVE10', brandId, cartTotal: 200 })
        .expect(401);
    });
  });
});
