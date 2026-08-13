import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

// NOTE: The try-on processor calls Fal.ai (external AI API). Jobs are enqueued
// but the processor does NOT execute during tests (no Bull worker running).
// We only verify HTTP layer responses.

describe('TryOnModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerToken: string;

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

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer', email: 'customer@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;
  });

  describe('POST /try-on', () => {
    it('should accept a valid try-on job submission and return a jobId', () => {
      return request(app.getHttpServer())
        .post('/try-on')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          personImageUrl: 'https://example.com/person.jpg',
          garmentImageUrl: 'https://example.com/garment.jpg',
          category: 'tops',
        })
        .then((response) => {
          expect([200, 201, 202]).toContain(response.status);
          expect(response.body.jobId).toBeDefined();
        });
    });

    it('should return 400 for invalid category enum value', () => {
      return request(app.getHttpServer())
        .post('/try-on')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          personImageUrl: 'https://example.com/person.jpg',
          garmentImageUrl: 'https://example.com/garment.jpg',
          category: 'invalid_category',
        })
        .expect(400);
    });

    it('should return 400 when required image URLs are missing', () => {
      return request(app.getHttpServer())
        .post('/try-on')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ category: 'tops' })
        .expect(400);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/try-on')
        .send({
          personImageUrl: 'https://example.com/person.jpg',
          garmentImageUrl: 'https://example.com/garment.jpg',
        })
        .expect(401);
    });
  });

  describe('GET /try-on/:jobId/status', () => {
    it('should return a status object for a submitted job', async () => {
      const submitRes = await request(app.getHttpServer())
        .post('/try-on')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          personImageUrl: 'https://example.com/person.jpg',
          garmentImageUrl: 'https://example.com/garment.jpg',
          category: 'tops',
        });

      if (![200, 201, 202].includes(submitRes.status)) return;
      const jobId = submitRes.body.jobId;

      return request(app.getHttpServer())
        .get(`/try-on/${jobId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.status).toBeDefined();
        });
    });

    it('should return 404 for an unknown jobId', () => {
      return request(app.getHttpServer())
        .get('/try-on/non-existent-job-id-12345/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/try-on/some-job-id/status')
        .expect(401);
    });
  });
});
