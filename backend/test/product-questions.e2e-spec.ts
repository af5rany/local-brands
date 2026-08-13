import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('ProductQuestionsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandOwnerId: number;
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

    // 3. Seed Customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer User',
      email: 'customer@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;

    // 4. Create brand and assign brand owner
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Q&A Brand', status: BrandStatus.ACTIVE });
    brandId = brandRes.body.id;

    await request(app.getHttpServer())
      .post(`/brands/${brandId}/assign-user`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: brandOwnerId, role: 'owner' });

    // 5. Create published product
    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Q&A Product',
        price: 90,
        brandId,
        isFeatured: false,
        status: ProductStatus.PUBLISHED,
        variants: [
          {
            color: 'Red',
            size: 'S',
            stock: 30,
            variantImages: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
          },
        ],
      });
    productId = productRes.body.id;
  });

  // ── Ask question ─────────────────────────────────────────────────────────────

  describe('POST /products/:productId/questions — ask a question', () => {
    it('should allow a customer to ask a question', async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'Does this product run true to size?' });

      expect(res.status).toBe(201);
      expect(res.body.question).toEqual('Does this product run true to size?');
      expect(res.body.answer ?? undefined).toBeUndefined();
    });

    it('should reject a question that is too short', async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'Hi' }); // less than MinLength(3)

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated question submission', async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .send({ question: 'Is this available in blue?' });

      expect(res.status).toBe(401);
    });

    it('should return 4xx for a non-existent product', async () => {
      const res = await request(app.getHttpServer())
        .post('/products/99999/questions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'Will this fit me?' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── Get answered questions (public) ─────────────────────────────────────────

  describe('GET /products/:productId/questions — get answered questions', () => {
    it('should return questions with null answer when none answered', async () => {
      // Ask a question but don't answer it
      await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'Is this machine washable?' });

      const res = await request(app.getHttpServer())
        .get(`/products/${productId}/questions`);

      expect(res.status).toBe(200);
      const questions = Array.isArray(res.body) ? res.body : (res.body.data ?? []);
      expect(Array.isArray(questions)).toBe(true);
      // unanswered questions have null answer
      expect(questions.every((q: any) => q.answer === null || q.answer === undefined)).toBe(true);
    });

    it('should be accessible without authentication (public endpoint)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/${productId}/questions`);

      expect(res.status).toBe(200);
    });
  });

  // ── Brand owner answers question ─────────────────────────────────────────────

  describe('PUT /products/questions/:questionId/answer — answer a question', () => {
    let questionId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'What material is this made of?' });
      questionId = res.body.id;
    });

    it('should allow brand owner to answer a question', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ answer: 'This is made of 100% organic cotton.' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toEqual('This is made of 100% organic cotton.');
    });

    it('should allow admin to answer a question', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answer: 'Admin answer: high-quality polyester blend.' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toEqual('Admin answer: high-quality polyester blend.');
    });

    it('should forbid a regular customer from answering', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ answer: 'I think it is cotton.' });

      expect(res.status).toBe(403);
    });

    it('should reject an empty answer', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ answer: '' }); // MinLength(1) fails

      expect(res.status).toBe(400);
    });
  });

  // ── Answered questions appear publicly after answer ──────────────────────────

  describe('GET /products/:productId/questions — shows answered questions', () => {
    it('should show the question publicly after a brand owner answers it', async () => {
      // Ask
      const askRes = await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'How long does delivery take?' });
      const questionId = askRes.body.id;

      // Answer
      await request(app.getHttpServer())
        .put(`/products/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ answer: 'Usually 3–5 business days.' });

      // Fetch public questions
      const res = await request(app.getHttpServer())
        .get(`/products/${productId}/questions`);

      expect(res.status).toBe(200);
      const questions = Array.isArray(res.body) ? res.body : (res.body.data ?? []);
      expect(questions.length).toBeGreaterThan(0);

      const answered = questions.find((q: any) => q.id === questionId);
      expect(answered).toBeDefined();
      expect(answered.answer).toEqual('Usually 3–5 business days.');
    });
  });

  // ── Pending questions for brand ──────────────────────────────────────────────

  describe('GET /products/brand/:brandId/questions/pending — pending questions', () => {
    it('should return unanswered questions for the brand', async () => {
      await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'Is there a discount for bulk orders?' });

      const res = await request(app.getHttpServer())
        .get(`/products/brand/${brandId}/questions/pending`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      expect(res.status).toBe(200);
      const questions = Array.isArray(res.body) ? res.body : (res.body.data ?? []);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return an empty list once all questions are answered', async () => {
      const askRes = await request(app.getHttpServer())
        .post(`/products/${productId}/questions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ question: 'Do you offer gift wrapping?' });
      const questionId = askRes.body.id;

      await request(app.getHttpServer())
        .put(`/products/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ answer: 'Yes, we do!' });

      const res = await request(app.getHttpServer())
        .get(`/products/brand/${brandId}/questions/pending`)
        .set('Authorization', `Bearer ${brandOwnerToken}`);

      expect(res.status).toBe(200);
      const questions = Array.isArray(res.body) ? res.body : (res.body.data ?? []);
      expect(questions.length).toEqual(0);
    });

    it('should forbid a customer from viewing pending questions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/brand/${brandId}/questions/pending`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 for unauthenticated access', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/brand/${brandId}/questions/pending`);

      expect(res.status).toBe(401);
    });
  });
});
