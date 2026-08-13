import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('AuthModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: UserRole.CUSTOMER,
          status: UserStatus.APPROVED,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.user.email).toEqual('test@example.com');
          expect(response.body.user.password).toEqual('');
        });
    });

    it('should fail if email is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
        status: UserStatus.APPROVED,
      });
    });

    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.token).toBeDefined();
        });
    });

    it('should fail with wrong credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/guest-login (POST)', () => {
    it('should login as a guest', () => {
      return request(app.getHttpServer())
        .post('/auth/guest-login')
        .expect(201)
        .then((response) => {
          expect(response.body.token).toBeDefined();
        });
    });
  });

  describe('/auth/protected (POST)', () => {
    let token: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Protected User',
        email: 'protected@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
        status: UserStatus.APPROVED,
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'protected@example.com',
          password: 'password123',
        });
      token = loginRes.body.token;
    });

    it('should access protected route with token', () => {
      return request(app.getHttpServer())
        .post('/auth/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .then((response) => {
          expect(response.body.message).toEqual('This is protected!');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).post('/auth/protected').expect(401);
    });
  });
});
