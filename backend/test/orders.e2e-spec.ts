import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { ProductStatus } from './../src/common/enums/product.enum';
import { OrderStatus, PaymentMethod } from './../src/common/enums/order.enum';
import { Address, AddressType } from './../src/addresses/address.entity';
import { ProductVariant } from './../src/products/product-variant.entity';

describe('OrdersModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerToken: string;
  let adminToken: string;
  let customerId: number;
  let productId: number;
  let variantId: number;
  let addressId: number;

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
    const addressRepository = dataSource.getRepository(Address);
    const variantRepository = dataSource.getRepository(ProductVariant);

    // 1. Seed Customer
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer User',
      email: 'customer@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;
    const customer = await userRepository.findOneBy({
      email: 'customer@example.com',
    });
    if (!customer) throw new Error('Customer not seeded');
    customerId = customer.id;

    // 2. Seed Admin
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

    // 3. Seed Address for Customer
    const address = addressRepository.create({
      user: { id: customerId } as any,
      fullName: 'Customer Name',
      addressLine1: '123 Test St',
      city: 'Riyadh',
      state: 'Riyadh',
      zipCode: '12345',
      country: 'Saudi Arabia',
      type: AddressType.BOTH,
    });
    const savedAddress = await addressRepository.save(address);
    addressId = savedAddress.id;

    // 4. Seed Brand & Product
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Order Brand', status: BrandStatus.ACTIVE });

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Order Product',
        price: 100,
        brandId: brandRes.body.id,
        isFeatured: false,
        status: ProductStatus.PUBLISHED,
        variants: [
          {
            color: 'Blue',
            size: 'M',
            stock: 100,
            variantImages: [
              'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            ],
          },
        ],
      });
    productId = productRes.body.id;

    // 5. Seed ProductVariant entity (as OrdersService expects it)
    const variant = variantRepository.create({
      productId: productId,
      stock: 100,
      attributes: { color: 'Blue', size: 'M' },
      images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      isAvailable: true,
    });
    const savedVariant = await variantRepository.save(variant);
    variantId = savedVariant.id;
  });

  describe('/orders (POST)', () => {
    it('should create an order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: productId,
              variantId: variantId,
              quantity: 2,
            },
          ],
          shippingAddressId: addressId,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        })
        .expect((res) => {
          if (res.status !== 201) console.log('Order Create Error:', res.body);
        })
        .expect(201)
        .then((response) => {
          expect(response.body.totalAmount).toBeDefined();
          expect(response.body.status).toEqual(OrderStatus.PENDING);
        });
    });

    it('should fail if stock is insufficient', async () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: productId,
              variantId: variantId,
              quantity: 200, // Stock is 100
            },
          ],
          shippingAddressId: addressId,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        })
        .expect(400);
    });
  });

  describe('/orders (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId, variantId, quantity: 1 }],
          shippingAddressId: addressId,
        });
    });

    it('should get all orders as Admin', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should get my-orders as Customer', () => {
      return request(app.getHttpServer())
        .get('/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
  });

  describe('/orders/:id (GET)', () => {
    let orderId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId, variantId, quantity: 1 }],
          shippingAddressId: addressId,
        });
      orderId = res.body.id;
    });

    it('should get order by ID', () => {
      return request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toEqual(orderId);
        });
    });
  });

  describe('/orders/:id/status (PUT)', () => {
    let orderId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId, variantId, quantity: 1 }],
          shippingAddressId: addressId,
        });
      orderId = res.body.id;
    });

    it('should update order status as Admin', () => {
      return request(app.getHttpServer())
        .put(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(200)
        .then((response) => {
          expect(response.body.status).toEqual(OrderStatus.CONFIRMED);
        });
    });
  });
});
