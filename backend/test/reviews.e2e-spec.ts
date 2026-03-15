import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';

describe('ReviewsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerToken: string;
  let adminToken: string;
  let customerId: number;
  let productId: number;

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

    // 1. Seed Customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Reviewer',
      email: 'reviewer@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'reviewer@example.com', password: 'password123' });
    customerToken = loginRes.body.token;

    const customer = await userRepository.findOneBy({
      email: 'reviewer@example.com',
    });
    if (!customer) throw new Error('Customer not seeded');
    customerId = customer.id;

    // 2. Seed Admin
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
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

    // 3. Seed Brand & Product
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Review Brand', status: BrandStatus.ACTIVE });

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Review Product',
        price: 50,
        brandId: brandRes.body.id,
        isFeatured: false,
        status: ProductStatus.PUBLISHED,
        variants: [
          {
            color: 'Blue',
            size: 'M',
            stock: 10,
            variantImages: [
              'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            ],
          },
        ],
      });

    if (productRes.status !== 201) {
      throw new Error(
        `Product creation failed: ${JSON.stringify(productRes.body)}`,
      );
    }

    productId = productRes.body.id;
  });

  describe('/reviews (POST) - Create a review', () => {
    it('should create a review successfully', () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: productId,
          rating: 5,
          comment: 'Excellent product!',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.rating).toEqual(5);
          expect(response.body.comment).toEqual('Excellent product!');
          expect(response.body.status).toEqual('PENDING'); // Reviews are pending by default
          expect(response.body.userId).toEqual(customerId);
          expect(response.body.productId).toEqual(productId);
        });
    });

    it('should fail if unauthenticated', () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .send({
          productId: productId,
          rating: 4,
          comment: 'Good',
        })
        .expect(401);
    });
  });

  describe('/reviews/:id/approve and /reject (PATCH) - Admin Approval', () => {
    let reviewId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: productId,
          rating: 4,
          comment: 'Will be approved/rejected',
        });
      reviewId = res.body.id;
    });

    it('should allow admin to approve a review', () => {
      return request(app.getHttpServer())
        .patch(`/reviews/${reviewId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.status).toEqual('APPROVED');
        });
    });

    it('should allow admin to reject a review', () => {
      return request(app.getHttpServer())
        .patch(`/reviews/${reviewId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.status).toEqual('REJECTED');
        });
    });

    it('should forbid customer from approving a review', () => {
      return request(app.getHttpServer())
        .patch(`/reviews/${reviewId}/approve`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('/reviews/product/:productId (GET) - Fetch approved reviews', () => {
    let reviewId: number;

    beforeEach(async () => {
      // 1. Create review
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId, rating: 5, comment: 'Love it!' });
      reviewId = res.body.id;
    });

    it('should not return unapproved reviews', () => {
      return request(app.getHttpServer())
        .get(`/reviews/product/${productId}?page=1&limit=10`)
        .expect(200)
        .then((response) => {
          expect(response.body.data).toEqual([]); // No approved reviews yet
          expect(response.body.pagination.total).toEqual(0);
        });
    });

    it('should return approved reviews for a product', async () => {
      // 2. Admin approves review
      await request(app.getHttpServer())
        .patch(`/reviews/${reviewId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 3. Fetch reviews
      return request(app.getHttpServer())
        .get(`/reviews/product/${productId}?page=1&limit=10`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].id).toEqual(reviewId);
          expect(response.body.data[0].comment).toEqual('Love it!');
          expect(response.body.data[0].rating).toEqual(5);
        });
    });
  });
});
