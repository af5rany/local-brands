import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('ShippingModule (e2e)', () => {
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

  describe('GET /brands/:brandId/shipping/zones', () => {
    it('should return an empty list when no zones exist', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          const items = response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBe(0);
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}/shipping/zones`)
        .expect(401);
    });
  });

  describe('POST /brands/:brandId/shipping/zones', () => {
    it('should allow brand owner to create a shipping zone', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Riyadh Zone', countries: ['SA'], isActive: true })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.name).toBe('Riyadh Zone');
          expect(response.body.id).toBeDefined();
        });
    });

    it('should return 403 when customer tries to create a shipping zone', () => {
      return request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Sneaky Zone', countries: ['SA'], isActive: true })
        .expect(403);
    });
  });

  describe('PUT /brands/:brandId/shipping/zones/:zoneId', () => {
    it('should allow brand owner to update a shipping zone', async () => {
      const zoneRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Original Zone', countries: ['SA'], isActive: true });
      const zoneId = zoneRes.body.id;

      return request(app.getHttpServer())
        .put(`/brands/${brandId}/shipping/zones/${zoneId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Updated Zone', isActive: false })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe('Updated Zone');
          expect(response.body.isActive).toBe(false);
        });
    });
  });

  describe('GET /brands/:brandId/shipping/zones/:zoneId/rates', () => {
    it('should return an empty list of rates for a new zone', async () => {
      const zoneRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Rates Zone', countries: ['SA'], isActive: true });
      const zoneId = zoneRes.body.id;

      return request(app.getHttpServer())
        .get(`/brands/${brandId}/shipping/zones/${zoneId}/rates`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          const items = response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBe(0);
        });
    });
  });

  describe('POST /brands/:brandId/shipping/zones/:zoneId/rates', () => {
    it('should allow brand owner to create a shipping rate', async () => {
      const zoneRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'SA Zone', countries: ['SA'], isActive: true });
      const zoneId = zoneRes.body.id;

      return request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones/${zoneId}/rates`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ methodName: 'Standard Shipping', method: 'standard', price: 25, estimatedDays: 3, isActive: true })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.methodName ?? response.body.name).toBeTruthy();
          expect(Number(response.body.price)).toBe(25);
        });
    });
  });

  describe('PUT /brands/:brandId/shipping/rates/:rateId', () => {
    it('should allow brand owner to update a shipping rate', async () => {
      const zoneRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Update Rate Zone', countries: ['SA'], isActive: true });
      const zoneId = zoneRes.body.id;

      const rateRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones/${zoneId}/rates`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ methodName: 'Express', method: 'express', price: 50, estimatedDays: 1, isActive: true });
      const rateId = rateRes.body.id;

      return request(app.getHttpServer())
        .put(`/brands/${brandId}/shipping/rates/${rateId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ price: 60 })
        .expect(200)
        .then((response) => {
          expect(Number(response.body.price)).toBe(60);
        });
    });
  });

  describe('DELETE /brands/:brandId/shipping/rates/:rateId', () => {
    it('should allow brand owner to delete a rate', async () => {
      const zoneRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Delete Rate Zone', countries: ['SA'], isActive: true });
      const zoneId = zoneRes.body.id;

      const rateRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones/${zoneId}/rates`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ methodName: 'To Delete', method: 'standard', price: 10, estimatedDays: 5, isActive: true });
      const rateId = rateRes.body.id;

      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/shipping/rates/${rateId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 204]).toContain(response.status);
        });
    });
  });

  describe('DELETE /brands/:brandId/shipping/zones/:zoneId', () => {
    it('should allow brand owner to delete a zone', async () => {
      const zoneRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/shipping/zones`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Zone To Delete', countries: ['SA'], isActive: true });
      const zoneId = zoneRes.body.id;

      return request(app.getHttpServer())
        .delete(`/brands/${brandId}/shipping/zones/${zoneId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 204]).toContain(response.status);
        });
    });
  });

  describe('POST /shipping/calculate', () => {
    it('should return a rates array for a valid brandId and countryCode', () => {
      return request(app.getHttpServer())
        .post('/shipping/calculate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ brandId, countryCode: 'SA' })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          const rates = response.body.rates ?? response.body;
          expect(Array.isArray(rates)).toBe(true);
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .post('/shipping/calculate')
        .send({ brandId, countryCode: 'SA' })
        .expect(401);
    });
  });
});
