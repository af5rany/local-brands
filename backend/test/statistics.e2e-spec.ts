import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';

describe('StatisticsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;

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

    // 1. Seed Customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Stats Customer',
      email: 'customer@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;

    // 2. Seed Brand Owner
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Stats Brand Owner',
      email: 'owner@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const userRepository = dataSource.getRepository('User');
    await userRepository.update(
      { email: 'owner@example.com' },
      { role: UserRole.BRAND_OWNER },
    );
    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' });
    brandOwnerToken = ownerLogin.body.token;

    // 3. Seed Admin
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Stats Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER, // register as customer then manually update
      status: UserStatus.APPROVED,
    });
    await userRepository.update(
      { email: 'admin@example.com' },
      { role: UserRole.ADMIN },
    );
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    const owner = await userRepository.findOneBy({
      email: 'owner@example.com',
    });
    if (!owner) throw new Error('Owner not seeded');
    const ownerId = owner.id;

    // 4. Seed a Brand for the Brand Owner
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Stats Brand',
        status: BrandStatus.ACTIVE,
        ownerId: ownerId,
      });

    brandId = brandRes.body.id;
  });

  describe('/statistics (GET)', () => {
    it('should return 401 if unauthenticated', () => {
      return request(app.getHttpServer()).get('/statistics').expect(401);
    });

    it('should return admin statistics', () => {
      return request(app.getHttpServer())
        .get('/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toBeDefined();
          // The structure depends on getAdminStats() output, which typically returns something.
          // Since it's an object containing stats summary, we verify it's not null.
        });
    });

    it('should return brand owner statistics without passing brandId explicitly', () => {
      return request(app.getHttpServer())
        .get('/statistics')
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toBeDefined();
        });
    });

    it('should return brand owner statistics with passing brandId explicitly', () => {
      return request(app.getHttpServer())
        .get(`/statistics?brandId=${brandId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toBeDefined();
        });
    });

    it('should return customer statistics', () => {
      return request(app.getHttpServer())
        .get('/statistics')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toBeDefined();
        });
    });
  });
});
