import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum'; // Added import for BrandStatus

describe('BrandsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;

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

    const userRepository = dataSource.getRepository('User');

    // Seed Admin
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'password123',
      role: UserRole.CUSTOMER, // Register as customer first
      status: UserStatus.APPROVED,
    });
    await userRepository.update(
      { email: 'admin@gmail.com' },
      { role: UserRole.ADMIN },
    );
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@gmail.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    // Seed Brand Owner
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Owner User',
      email: 'owner_test@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    await userRepository.update(
      { email: 'owner_test@example.com' },
      { role: UserRole.BRAND_OWNER },
    );
    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner_test@example.com', password: 'password123' });
    brandOwnerToken = ownerLogin.body.token;

    // Seed Customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer User',
      email: 'customer_test@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer_test@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;
  });

  describe('/brands (POST)', () => {
    it('should create a brand as Admin', () => {
      return request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Brand',
          description: 'A test brand',
          location: 'Saudi Arabia',
          status: BrandStatus.ACTIVE, // Ensure it's active for public view test
        })
        .expect(201)
        .then((response) => {
          expect(response.body.name).toEqual('Test Brand');
        });
    });

    it('should fail to create a brand as Customer', () => {
      return request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Fail Brand',
        })
        .expect(403);
    });
  });

  describe('/brands (GET)', () => {
    it('should get all brands (publicly accessible)', async () => {
      // Create an active brand first
      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Active Brand', status: BrandStatus.ACTIVE });

      return request(app.getHttpServer())
        .get('/brands')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.items)).toBe(true);
          expect(response.body.items.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/brands/:id (GET)', () => {
    let brandId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Find Me Brand' });
      brandId = res.body.id;
    });

    it('should get a brand by ID', () => {
      return request(app.getHttpServer())
        .get(`/brands/${brandId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Find Me Brand');
        });
    });
  });

  describe('/brands/:id (PUT)', () => {
    let brandId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Update Me Brand' });
      brandId = res.body.id;
    });

    it('should update a brand as Admin', () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name Admin' })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Updated Name Admin');
        });
    });

    it('should fail to update if not assigned to brand (for Brand Owner)', async () => {
      return request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ name: 'Should Fail' })
        .expect(403);
    });
  });
});
