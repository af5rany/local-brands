import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';
import { ProductVariant } from './../src/products/product-variant.entity';

describe('CartModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerToken: string;
  let productId: number;
  let variantId: number;

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
    const variantRepository = dataSource.getRepository(ProductVariant);

    // 1. Seed Customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Cart User',
      email: 'cart@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cart@example.com', password: 'password123' });
    customerToken = loginRes.body.token;

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
      .send({ name: 'Cart Brand', status: BrandStatus.ACTIVE });

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Cart Product',
        price: 100,
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
    productId = productRes.body.id;

    // 4. Seed ProductVariant
    const variant = variantRepository.create({
      productId: productId,
      stock: 50,
      attributes: { color: 'Red', size: 'L' },
      images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      isAvailable: true,
    });
    const savedVariant = await variantRepository.save(variant);
    variantId = savedVariant.id;
  });

  describe('/cart/add (POST)', () => {
    it('should add an item to the cart', () => {
      return request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: productId,
          variantId: variantId,
          quantity: 2,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.productId).toEqual(productId);
          expect(response.body.quantity).toEqual(2);
          expect(Number(response.body.totalPrice)).toEqual(200);
        });
    });

    it('should fail if stock is insufficient', () => {
      return request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: productId,
          variantId: variantId,
          quantity: 100, // Stock is 50
        })
        .expect(400);
    });
  });

  describe('/cart (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, variantId, quantity: 1 });
    });

    it('should get cart summary', () => {
      return request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.totalItems).toBeDefined();
          expect(Number(response.body.totalAmount)).toBeGreaterThan(0);
        });
    });
  });

  describe('/cart/items/:id (PUT)', () => {
    let cartItemId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, variantId, quantity: 1 });
      cartItemId = res.body.id;
    });

    it('should update cart item quantity', () => {
      return request(app.getHttpServer())
        .put(`/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 5 })
        .expect(200)
        .then((response) => {
          expect(response.body.quantity).toEqual(5);
          expect(Number(response.body.totalPrice)).toEqual(500);
        });
    });

    it('should remove item if quantity set to 0', () => {
      return request(app.getHttpServer())
        .put(`/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 0 })
        .expect(200)
        .then((response) => {
          expect(response.body).toBeNull;
        });
    });
  });

  describe('/cart/items/:id (DELETE)', () => {
    let cartItemId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, variantId, quantity: 1 });
      cartItemId = res.body.id;
    });

    it('should remove item from cart', () => {
      return request(app.getHttpServer())
        .delete(`/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
    });
  });

  describe('/cart/clear (DELETE)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, variantId, quantity: 1 });
    });

    it('should clear the cart', () => {
      return request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.message).toContain('successfully');
        });
    });
  });
});
