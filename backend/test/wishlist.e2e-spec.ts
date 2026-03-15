import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';

describe('WishlistModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerToken: string;
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
      name: 'Wishlist User',
      email: 'wishlist@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wishlist@example.com', password: 'password123' });
    customerToken = loginRes.body.token;

    const customer = await userRepository.findOneBy({
      email: 'wishlist@example.com',
    });
    if (!customer) throw new Error('Customer not seeded');
    customerId = customer.id;

    // 2. Seed Admin for Product creation
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
    const adminToken = adminLogin.body.token;

    // 3. Seed Brand & Product
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Wishlist Brand', status: BrandStatus.ACTIVE });

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Wishlist Product',
        price: 50,
        brandId: brandRes.body.id,
        isFeatured: false,
        status: ProductStatus.PUBLISHED,
        variants: [
          {
            color: 'Red',
            size: 'L',
            stock: 50,
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

  describe('/wishlist (POST)', () => {
    it('should add an item to the wishlist', () => {
      return request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: customerId,
          productId: productId,
          notes: 'Test note',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.userId).toEqual(customerId);
          expect(response.body.productId).toEqual(productId);
          expect(response.body.notes).toEqual('Test note');
        });
    });

    it('should fail to add an item for another user', () => {
      return request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: 9999, // Another user ID
          productId: productId,
        })
        .expect(403);
    });

    it('should fail if item is already in wishlist', async () => {
      await request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ userId: customerId, productId });

      return request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ userId: customerId, productId })
        .expect(409);
    });
  });

  describe('/wishlist (GET endpoints)', () => {
    let wishlistId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ userId: customerId, productId });
      wishlistId = res.body.id;
    });

    it('should get all wishlist items (findAll)', () => {
      return request(app.getHttpServer())
        .get('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should get wishlist item by id', () => {
      return request(app.getHttpServer())
        .get(`/wishlist/${wishlistId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toEqual(wishlistId);
        });
    });

    it('should get wishlist items by user id', () => {
      return request(app.getHttpServer())
        .get(`/wishlist/user/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toEqual(1);
          expect(response.body[0].product.id).toEqual(productId);
        });
    });

    it('should fail to get items for another user', () => {
      return request(app.getHttpServer())
        .get(`/wishlist/user/9999`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should get wishlist items by product id', () => {
      return request(app.getHttpServer())
        .get(`/wishlist/product/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toEqual(1);
          expect(response.body[0].user.id).toEqual(customerId);
        });
    });

    it('should check if product is in user wishlist', () => {
      return request(app.getHttpServer())
        .get(`/wishlist/check/${customerId}/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.inWishlist).toBe(true);
        });
    });

    it('should get wishlist count for user', () => {
      return request(app.getHttpServer())
        .get(`/wishlist/count/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.count).toEqual(1);
        });
    });
  });

  describe('/wishlist (PATCH and DELETE endpoints)', () => {
    let wishlistId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ userId: customerId, productId });
      wishlistId = res.body.id;
    });

    it('should update wishlist item notes', () => {
      return request(app.getHttpServer())
        .patch(`/wishlist/${wishlistId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ notes: 'Updated notes' })
        .expect(200)
        .then((response) => {
          expect(response.body.notes).toEqual('Updated notes');
        });
    });

    it('should toggle product out of wishlist', () => {
      return request(app.getHttpServer())
        .post(`/wishlist/toggle/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.added).toBe(false);
        });
    });

    it('should toggle product back into wishlist', async () => {
      // First toggle out
      await request(app.getHttpServer())
        .post(`/wishlist/toggle/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      // Now toggle in
      return request(app.getHttpServer())
        .post(`/wishlist/toggle/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.added).toBe(true);
        });
    });

    it('should remove item by user and product id', () => {
      return request(app.getHttpServer())
        .delete(`/wishlist/user/${customerId}/product/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(204);
    });

    it('should remove item by id', () => {
      return request(app.getHttpServer())
        .delete(`/wishlist/${wishlistId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(204);
    });
  });
});
