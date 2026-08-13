import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('BundlesModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;
  let productIds: number[];

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

    const p1 = await request(app.getHttpServer())
      .post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bundle Product 1', price: 100, brandId, status: 'published', isFeatured: false,
        variants: [{ color: 'Blue', size: 'M', stock: 20, variantImages: ['https://example.com/img.jpg'] }] });
    const p2 = await request(app.getHttpServer())
      .post('/products').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bundle Product 2', price: 150, brandId, status: 'published', isFeatured: false,
        variants: [{ color: 'Red', size: 'L', stock: 10, variantImages: ['https://example.com/img.jpg'] }] });
    productIds = [p1.body.id, p2.body.id];
  });

  const bundlePayload = (pIds: number[]) => ({
    name: 'Summer Bundle',
    discountType: 'percentage',
    discountValue: 15,
    productIds: pIds,
    isActive: true,
  });

  describe('POST /brands/:id/bundles', () => {
    it('brand owner creates a bundle → 201 with correct fields', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(bundlePayload(productIds))
        .expect(201)
        .then((response) => {
          expect(response.body.id).toBeDefined();
          expect(response.body.name).toEqual('Summer Bundle');
          expect(response.body.discountType).toEqual('percentage');
          expect(response.body.discountValue).toEqual(15);
        });
    });

    it('customer cannot create a bundle → 403', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bundlePayload(productIds))
        .expect(403);
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .send(bundlePayload(productIds))
        .expect(401);
    });

    it('invalid discountType → 400', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Bad Bundle', discountType: 'invalid', discountValue: 10, productIds })
        .expect(400);
    });
  });

  describe('GET /brands/:id/bundles', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(bundlePayload(productIds));
    });

    it('brand owner lists bundles → 200 with array', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0].name).toEqual('Summer Bundle');
        });
    });

    it('customer cannot list bundles → 403', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/bundles`)
        .expect(401);
    });
  });

  describe('PUT /brands/:id/bundles/:bundleId', () => {
    let bundleId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(bundlePayload(productIds));
      bundleId = res.body.id;
    });

    it('brand owner updates bundle name and discount → returns updated fields', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/bundles/${bundleId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Winter Bundle', discountType: 'fixed', discountValue: 30, productIds })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Winter Bundle');
          expect(response.body.discountValue).toEqual(30);
        });
    });

    it('customer cannot update a bundle → 403', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/bundles/${bundleId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Hack Bundle', discountType: 'fixed', discountValue: 5, productIds })
        .expect(403);
    });
  });

  describe('PUT /brands/:id/bundles/:bundleId/toggle', () => {
    let bundleId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(bundlePayload(productIds));
      bundleId = res.body.id;
    });

    it('brand owner toggles bundle active state → boolean flips', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/bundles/${bundleId}/toggle`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(typeof response.body.isActive).toBe('boolean');
          expect(response.body.isActive).toBe(false);
        });
    });

    it('unauthenticated request → 401', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/bundles/${bundleId}/toggle`)
        .expect(401);
    });
  });

  describe('DELETE /brands/:id/bundles/:bundleId', () => {
    let bundleId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(bundlePayload(productIds));
      bundleId = res.body.id;
    });

    it('brand owner deletes a bundle → gone from list', async () => {
      await request(app.getHttpServer())
        .delete(`/brands/${brandId}/bundles/${bundleId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          const found = (response.body as any[]).find((b) => b.id === bundleId);
          expect(found).toBeUndefined();
        });
    });

    it('customer cannot delete a bundle → 403', () => {
      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/bundles/${bundleId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('POST /bundles/check', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/bundles`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ ...bundlePayload(productIds), discountValue: 25 });
    });

    it('public check with matching product IDs returns bundle discount info', () => {
      return request(app.getHttpServer())
        .post('/bundles/check')
        .send({ productIds, brandId })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body).toBeDefined();
        });
    });

    it('check with non-matching product IDs returns null or empty', () => {
      return request(app.getHttpServer())
        .post('/bundles/check')
        .send({ productIds: [999998, 999999], brandId })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(
            response.body === null ||
            response.body?.bundle === null ||
            (Array.isArray(response.body) && response.body.length === 0) ||
            Object.keys(response.body ?? {}).length === 0,
          ).toBe(true);
        });
    });
  });
});
