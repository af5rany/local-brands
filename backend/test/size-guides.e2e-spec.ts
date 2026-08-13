import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('SizeGuidesModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let adminToken: string;
  let brandOwnerToken: string;
  let brandOwnerId: number;
  let brandId: number;
  let productId: number;

  const sizeGuidePayload = {
    title: 'Standard Size Guide',
    description: 'Measurements in centimetres',
    headers: ['Size', 'Chest', 'Waist', 'Hips'],
    rows: [
      { label: 'S', values: { Chest: '86', Waist: '71', Hips: '91' } },
      { label: 'M', values: { Chest: '91', Waist: '76', Hips: '96' } },
      { label: 'L', values: { Chest: '96', Waist: '81', Hips: '101' } },
    ],
    unit: 'cm',
  };

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);

    const userRepository = dataSource.getRepository('User');

    // 1. Seed Admin
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    await userRepository.update({ email: 'admin@gmail.com' }, { role: UserRole.ADMIN });
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@gmail.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    // 2. Seed Brand Owner
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Brand Owner',
      email: 'owner@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    await userRepository.update({ email: 'owner@example.com' }, { role: UserRole.BRAND_OWNER });
    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' });
    brandOwnerToken = ownerLogin.body.token;
    const brandOwner = await userRepository.findOneBy({ email: 'owner@example.com' });
    if (!brandOwner) throw new Error('Brand owner not seeded');
    brandOwnerId = brandOwner.id;

    // 3. Create brand and assign brand owner
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Size Guide Brand', status: BrandStatus.ACTIVE });
    brandId = brandRes.body.id;

    await request(app.getHttpServer())
      .post(`/brands/${brandId}/assign-user`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: brandOwnerId, role: 'owner' });

    // 4. Create published product
    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sized Product',
        price: 80,
        brandId,
        isFeatured: false,
        status: ProductStatus.PUBLISHED,
        variants: [
          {
            color: 'White',
            size: 'M',
            stock: 20,
            variantImages: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
          },
        ],
      });
    productId = productRes.body.id;
  });

  // ── Create guide ─────────────────────────────────────────────────────────────

  describe('POST /brands/:id/size-guides — create size guide', () => {
    it('should allow brand owner to create a size guide', async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);

      expect(res.status).toBe(201);
      expect(res.body.title).toEqual(sizeGuidePayload.title);
      expect(res.body.headers).toEqual(
        expect.arrayContaining(sizeGuidePayload.headers),
      );
    });

    it('should allow admin to create a size guide', async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sizeGuidePayload);

      expect(res.status).toBe(201);
      expect(res.body.title).toEqual(sizeGuidePayload.title);
    });

    it('should allow creating a product-specific size guide', async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ ...sizeGuidePayload, productId, title: 'Product Specific Guide' });

      expect(res.status).toBe(201);
      expect(res.body.title).toEqual('Product Specific Guide');
    });

    it('should reject a guide missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ title: 'Incomplete Guide' }); // missing headers and rows

      expect(res.status).toBe(400);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .send(sizeGuidePayload);

      expect(res.status).toBe(401);
    });
  });

  // ── List guides ──────────────────────────────────────────────────────────────

  describe('GET /brands/:id/size-guides — list size guides', () => {
    it('should return an empty list when no guides exist', async () => {
      const res = await request(app.getHttpServer())
        .get(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(0);
    });

    it('should list all guides for the brand', async () => {
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);

      const res = await request(app.getHttpServer())
        .get(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toEqual(sizeGuidePayload.title);
    });
  });

  // ── Get guide for product ────────────────────────────────────────────────────

  describe('GET /size-guides/product/:productId — get size guide for product', () => {
    it('should return 404 when no guide exists for product or brand', async () => {
      const res = await request(app.getHttpServer())
        .get(`/size-guides/product/${productId}?brandId=${brandId}`);

      expect(res.status).toBe(404);
    });

    it('should fall back to brand-level guide when no product-specific guide exists', async () => {
      // Create brand-level guide (no productId)
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);

      const res = await request(app.getHttpServer())
        .get(`/size-guides/product/${productId}?brandId=${brandId}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toEqual(sizeGuidePayload.title);
    });

    it('should return product-specific guide when it exists', async () => {
      // Create both brand-level and product-level guides
      await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);

      await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ ...sizeGuidePayload, productId, title: 'Product Override Guide' });

      const res = await request(app.getHttpServer())
        .get(`/size-guides/product/${productId}?brandId=${brandId}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toEqual('Product Override Guide');
    });
  });

  // ── Update guide ─────────────────────────────────────────────────────────────

  describe('PUT /brands/:id/size-guides/:guideId — update size guide', () => {
    it('should update a size guide title', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);
      const guideId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .put(`/brands/${brandId}/size-guides/${guideId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ title: 'Updated Guide Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toEqual('Updated Guide Title');
    });

    it('should update unit to inches', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);
      const guideId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .put(`/brands/${brandId}/size-guides/${guideId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ unit: 'in' });

      expect(res.status).toBe(200);
      expect(res.body.unit).toEqual('in');
    });
  });

  // ── Delete guide ─────────────────────────────────────────────────────────────

  describe('DELETE /brands/:id/size-guides/:guideId — delete size guide', () => {
    it('should delete a size guide', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);
      const guideId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .delete(`/brands/${brandId}/size-guides/${guideId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      expect(res.status).toBe(200);

      // Verify it no longer appears in the list
      const listRes = await request(app.getHttpServer())
        .get(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      const remaining = listRes.body.filter((g: any) => g.id === guideId);
      expect(remaining.length).toEqual(0);
    });

    it('should return 404 for a non-existent guide', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/brands/${brandId}/size-guides/99999`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      expect(res.status).toBe(404);
    });

    it('should forbid an unauthenticated user from deleting a guide', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/brands/${brandId}/size-guides`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send(sizeGuidePayload);
      const guideId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .delete(`/brands/${brandId}/size-guides/${guideId}`);

      expect(res.status).toBe(401);
    });
  });
});
