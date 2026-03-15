import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';

describe('AuthModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean tables before each test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
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
