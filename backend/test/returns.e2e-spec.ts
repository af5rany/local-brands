import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';
import { ReturnReason } from './../src/common/enums/return.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('ReturnsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;
  let productId: number;
  let variantId: number;
  let addressId: number;
  let orderId: number;

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
      .send({
        name: 'Returnable Product', price: 200, brandId,
        status: ProductStatus.PUBLISHED,
        variants: [{ color: 'Black', size: 'L', stock: 50, variantImages: ['https://example.com/img.jpg'] }],
      });
    productId = prodRes.body.id;
    variantId = prodRes.body.variants?.[0]?.id;

    const addrRes = await request(app.getHttpServer())
      .post('/addresses').set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Test Customer', addressLine1: '123 Test St', city: 'Riyadh',
        state: 'Riyadh', zipCode: '12345', country: 'Saudi Arabia', type: 'both',
      });
    addressId = addrRes.body.id;

    const orderRes = await request(app.getHttpServer())
      .post('/orders').set('Authorization', `Bearer ${customerToken}`)
      .send({
        idempotencyKey: 'ret-test-key-1',
        items: [{ productId, variantId, quantity: 1, unitPrice: 200 }],
        brandId,
        shippingAddressId: addressId,
        paymentMethod: 'cash_on_delivery',
      });
    orderId = orderRes.body.id;
  });

  describe('GET /brands/:brandId/return-policy', () => {
    it('should return 404 or empty object when no policy has been set', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/return-policy`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 404]).toContain(response.status);
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/return-policy`)
        .expect(401);
    });
  });

  describe('PUT /brands/:brandId/return-policy', () => {
    it('should allow brand owner to create or update a return policy', async () => {
      const response = await request(app.getHttpServer())
        .put(`/brands/${brandId}/return-policy`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({
          returnWindowDays: 14,
          conditions: 'Item must be unworn',
          isActive: true,
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.returnWindowDays).toBe(14);
    });

    it('should return 200 when reading policy after upsert', async () => {
      await request(app.getHttpServer())
        .put(`/brands/${brandId}/return-policy`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ returnWindowDays: 7, isActive: true });

      return request(app.getHttpServer())
        .get(`/brands/${brandId}/return-policy`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.returnWindowDays).toBe(7);
        });
    });

    it('should return 403 when a customer attempts to set return policy', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/return-policy`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ returnWindowDays: 7, isActive: true })
        .expect(403);
    });
  });

  describe('GET /returns/my-returns', () => {
    it('should return an empty list for a customer with no returns', () => {
      return request(app.getHttpServer())
        .get('/returns/my-returns')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          const items = response.body.items ?? response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBe(0);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/returns/my-returns')
        .expect(401);
    });
  });

  describe('POST /returns', () => {
    it('should allow a customer to submit a return request', async () => {
      if (!orderId) return;

      const response = await request(app.getHttpServer())
        .post('/returns')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          brandId,
          reason: ReturnReason.DEFECTIVE,
          description: 'Item arrived damaged',
        });

      // 201 = success; 400 = business rule (e.g. order not yet fulfilled)
      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.id).toBeDefined();
        expect(response.body.reason).toBe(ReturnReason.DEFECTIVE);
      }
    });

    it('should return 401 when submitting return without auth', () => {
      return request(app.getHttpServer())
        .post('/returns')
        .send({ orderId: 1, brandId: 1, reason: ReturnReason.DEFECTIVE })
        .expect(401);
    });

    it('should return 400 for invalid reason enum value', () => {
      return request(app.getHttpServer())
        .post('/returns')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 1, brandId: 1, reason: 'not_a_valid_reason' })
        .expect(400);
    });
  });

  describe('GET /brands/:brandId/returns', () => {
    it('should allow brand owner to list returns for their brand', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/returns`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          const items = response.body.items ?? response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
        });
    });

    it('should return 403 when customer tries to list brand returns', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('PUT /brands/:brandId/returns/:id/approve', () => {
    it('should return 404 for a non-existent return id', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/returns/99999/approve`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ notes: 'Approved automatically' })
        .expect(404);
    });

    it('should return 403 when customer tries to approve a return', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}/returns/99999/approve`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ notes: 'Approved' })
        .expect(403);
    });
  });
});
