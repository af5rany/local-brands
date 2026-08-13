import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('AddressesModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer User',
      email: 'customer@example.com',
      password: 'password123',
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@example.com', password: 'password123' });
    customerToken = loginRes.body.token;
  });

  const baseAddress = {
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'Riyadh',
    state: 'Riyadh Region',
    zipCode: '12345',
    country: 'Saudi Arabia',
    type: 'both',
  };

  describe('/addresses (POST)', () => {
    it('should create an address', async () => {
      const res = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(baseAddress);

      if (res.status !== 201) console.log('Create Address Error:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.fullName).toEqual(baseAddress.fullName);
      expect(res.body.city).toEqual(baseAddress.city);
    });

    it('should return 400 when required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ fullName: 'Incomplete' }) // missing addressLine1, city, state, zipCode, country
        .expect(400);
    });

    it('should return 401 when unauthenticated', () => {
      return request(app.getHttpServer())
        .post('/addresses')
        .send(baseAddress)
        .expect(401);
    });
  });

  describe('/addresses (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(baseAddress);
    });

    it('should return an array containing the created address', async () => {
      const res = await request(app.getHttpServer())
        .get('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].fullName).toEqual(baseAddress.fullName);
    });

    it('should return 401 when unauthenticated', () => {
      return request(app.getHttpServer()).get('/addresses').expect(401);
    });
  });

  describe('/addresses/:id (GET)', () => {
    let addressId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(baseAddress);
      addressId = res.body.id;
    });

    it('should return the address by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/addresses/${addressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.id).toEqual(addressId);
      expect(res.body.fullName).toEqual(baseAddress.fullName);
    });

    it('should return 404 for a non-existent address', () => {
      return request(app.getHttpServer())
        .get('/addresses/99999')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('/addresses/:id (PUT)', () => {
    let addressId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(baseAddress);
      addressId = res.body.id;
    });

    it('should update the fullName of an address', async () => {
      const res = await request(app.getHttpServer())
        .put(`/addresses/${addressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ fullName: 'Jane Doe' })
        .expect(200);

      expect(res.body.fullName).toEqual('Jane Doe');
    });
  });

  describe('/addresses/:id (DELETE)', () => {
    let addressId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(baseAddress);
      addressId = res.body.id;
    });

    it('should delete an address', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete(`/addresses/${addressId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect([200, 204]).toContain(deleteRes.status);

      // Confirm it is gone
      await request(app.getHttpServer())
        .get(`/addresses/${addressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('/addresses/:id/default (PATCH)', () => {
    let addressId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(baseAddress);
      addressId = res.body.id;
    });

    it('should set an address as the default', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/addresses/${addressId}/default`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.isDefault).toBe(true);
    });
  });
});
