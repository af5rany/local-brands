import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { Gender } from './../src/common/enums/user.enum';
import { ProductStatus } from './../src/common/enums/product.enum';

describe('ProductsModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
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
      role: UserRole.CUSTOMER,
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

    // Create a brand
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Brand for Products',
        status: BrandStatus.ACTIVE,
      });
    brandId = brandRes.body.id;
  });

  describe('/products (POST)', () => {
    it('should create a product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          description: 'Product description',
          price: 100,
          salePrice: 80,
          brandId: brandId,
          gender: Gender.MEN,
          isFeatured: false,
          variants: [
            {
              color: 'Red',
              size: 'L',
              stock: 10,
              variantImages: [
                'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              ],
            },
          ],
        })
        .expect(201)
        .then((response) => {
          expect(response.body.name).toEqual('Test Product');
          expect(response.body.brand.id).toEqual(brandId);
        });
    });

    it('should fail if price is invalid', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Price Product',
          price: -10,
          brandId: brandId,
          isFeatured: false,
          variants: [
            {
              color: 'Red',
              stock: 10,
              variantImages: [
                'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              ],
            },
          ],
        })
        .expect(400);
    });
  });

  describe('/products (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product 1',
          price: 50,
          brandId: brandId,
          gender: Gender.UNISEX,
          isFeatured: true,
          status: ProductStatus.PUBLISHED,
          variants: [
            {
              color: 'Blue',
              stock: 5,
              variantImages: [
                'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              ],
            },
          ],
        });
    });

    it('should get search products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.items)).toBe(true);
          expect(response.body.items.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/products/:id (GET)', () => {
    let productId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Single Product',
          price: 60,
          brandId: brandId,
          gender: Gender.WOMEN,
          isFeatured: false,
          status: ProductStatus.PUBLISHED,
          variants: [
            {
              color: 'Green',
              stock: 8,
              variantImages: [
                'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              ],
            },
          ],
        });
      productId = res.body.id;
    });

    it('should get a product by ID', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Single Product');
        });
    });
  });

  describe('/products/:id (PUT)', () => {
    let productId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product to Update',
          price: 70,
          brandId: brandId,
          gender: Gender.KIDS,
          isFeatured: false,
          status: ProductStatus.PUBLISHED,
          variants: [
            {
              color: 'Yellow',
              stock: 3,
              variantImages: [
                'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              ],
            },
          ],
        });
      productId = res.body.id;
    });

    it('should update a product', () => {
      return request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Product Name', price: 75 })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toEqual('Updated Product Name');
          expect(Number(response.body.price)).toEqual(75);
        });
    });
  });

  describe('/products/:id (DELETE)', () => {
    let productId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product to Delete',
          price: 80,
          brandId: brandId,
          gender: Gender.MEN,
          isFeatured: false,
          status: ProductStatus.PUBLISHED,
          variants: [
            {
              color: 'Black',
              stock: 12,
              variantImages: [
                'https://res.cloudinary.com/demo/image/upload/sample.jpg',
              ],
            },
          ],
        });
      productId = res.body.id;
    });

    it('should delete a product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
