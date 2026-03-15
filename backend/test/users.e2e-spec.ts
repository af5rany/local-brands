import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';

describe('UsersModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let customer1Token: string;
  let customer2Token: string;

  let adminId: number;
  let customer1Id: number;
  let customer2Id: number;

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
    // Clean tables
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
    }

    const userRepository = dataSource.getRepository('User');

    // 1. Seed Admin
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER, // Register as customer then update manually
      status: UserStatus.APPROVED,
    });
    let adminUser = await userRepository.findOneBy({
      email: 'admin@example.com',
    });
    if (!adminUser) throw new Error('Admin not seeded');
    await userRepository.update({ id: adminUser.id }, { role: UserRole.ADMIN });
    adminId = adminUser.id;
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    // 2. Seed Customer 1
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer One',
      email: 'cust1@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const cust1 = await userRepository.findOneBy({
      email: 'cust1@example.com',
    });
    customer1Id = cust1!.id;
    const cust1Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cust1@example.com', password: 'password123' });
    customer1Token = cust1Login.body.token;

    // 3. Seed Customer 2
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer Two',
      email: 'cust2@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const cust2 = await userRepository.findOneBy({
      email: 'cust2@example.com',
    });
    customer2Id = cust2!.id;
    const cust2Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cust2@example.com', password: 'password123' });
    customer2Token = cust2Login.body.token;
  });

  describe('/users (GET) - Find All', () => {
    it('should return all users for Admin', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(3); // Admin, Cust1, Cust2
        });
    });

    it('should forbid non-Admin from viewing all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${customer1Token}`)
        .expect(403);
    });
  });

  describe('/users/:id (GET) - Find One', () => {
    it('should allow Admin to view any user', () => {
      return request(app.getHttpServer())
        .get(`/users/${customer1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.email).toEqual('cust1@example.com');
        });
    });

    it('should allow User to view their own profile', () => {
      return request(app.getHttpServer())
        .get(`/users/${customer1Id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .expect(200)
        .then((response) => {
          expect(response.body.email).toEqual('cust1@example.com');
        });
    });

    it('should forbid User from viewing other user profiles', () => {
      return request(app.getHttpServer())
        .get(`/users/${customer2Id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .expect(403);
    });

    it('should throw BadRequestException if id is invalid', () => {
      return request(app.getHttpServer())
        .get('/users/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('/users (POST) - Create User', () => {
    it('should allow Admin to create user directly', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Manual User',
          email: 'manual@example.com',
          password: 'password123',
          role: UserRole.CUSTOMER,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.email).toEqual('manual@example.com');
        });
    });

    it('should forbid Customer from creating a user directly', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          name: 'Manual User 2',
          email: 'manual2@example.com',
          password: 'password123',
        })
        .expect(403);
    });
  });

  describe('/users/:id (PUT) - Update User', () => {
    it('should allow Admin to update any user', () => {
      return request(app.getHttpServer())
        .put(`/users/${customer1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cust1 Updated By Admin' })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Cust1 Updated By Admin');
        });
    });

    it('should allow User to update their own profile', () => {
      return request(app.getHttpServer())
        .put(`/users/${customer1Id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ name: 'Cust1 Self Update' })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Cust1 Self Update');
        });
    });

    it('should forbid User from updating another user', () => {
      return request(app.getHttpServer())
        .put(`/users/${customer2Id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ name: 'Hacked name' })
        .expect(403);
    });
  });

  describe('/users/:id (DELETE) - Delete User', () => {
    it('should forbid User from deleting another user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${customer2Id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .expect(403);
    });

    it('should forbid User from deleting themselves through this endpoint', () => {
      // Because DELETE /users/:id enforces Admin Only
      return request(app.getHttpServer())
        .delete(`/users/${customer1Id}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .expect(403);
    });

    it('should allow Admin to delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${customer1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
