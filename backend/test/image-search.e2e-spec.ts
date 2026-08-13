import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

// NOTE: POST /image-search calls the external clip-service which is NOT running
// during e2e tests. We only test:
//   1. Auth/role enforcement on /image-search/batch-embed
//   2. Validation error (400) on /image-search when no file is provided — this
//      is short-circuited by the controller before any external call is made.

describe('ImageSearchModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
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
    const adminLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer', email: 'customer@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;
  });

  describe('POST /image-search/batch-embed', () => {
    it('should allow admin to queue batch embedding', () => {
      return request(app.getHttpServer())
        .post('/image-search/batch-embed')
        .set('Authorization', `Bearer ${adminToken}`)
        .then((response) => {
          expect([200, 201, 202]).toContain(response.status);
          expect(response.body.queued).toBeDefined();
        });
    });

    it('should return 403 when a customer requests batch embedding', () => {
      return request(app.getHttpServer())
        .post('/image-search/batch-embed')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/image-search/batch-embed')
        .expect(401);
    });
  });

  describe('POST /image-search', () => {
    it('should return 400 when no image file is provided', () => {
      // The controller throws BadRequestException before reaching clip-service
      return request(app.getHttpServer())
        .post('/image-search')
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBeDefined();
        });
    });
  });
});
