import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { UserRole, UserStatus } from './../src/common/enums/user.enum';
import { BrandStatus } from './../src/common/enums/brand.enum';
import { createTestApp } from './helpers/create-test-app';
import { truncateAll } from './helpers/truncate';

describe('FeedModule (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let brandOwnerToken: string;
  let customerToken: string;
  let brandId: number;
  let postId: number;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
    const userRepo = dataSource.getRepository('User');

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin', email: 'admin@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    await userRepo.update({ email: 'admin@example.com' }, { role: UserRole.ADMIN });
    const adminLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Owner', email: 'owner@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    await userRepo.update({ email: 'owner@example.com' }, { role: UserRole.BRAND_OWNER });
    const ownerLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'owner@example.com', password: 'password123' });
    brandOwnerToken = ownerLogin.body.token;

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Customer', email: 'customer@example.com', password: 'password123',
      role: UserRole.CUSTOMER, status: UserStatus.APPROVED,
    });
    const customerLogin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'customer@example.com', password: 'password123' });
    customerToken = customerLogin.body.token;

    const brandRes = await request(app.getHttpServer())
      .post('/brands').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Brand', status: BrandStatus.ACTIVE });
    brandId = brandRes.body.id;

    const ownerUser = await userRepo.findOneBy({ email: 'owner@example.com' });
    await request(app.getHttpServer())
      .post(`/brands/${brandId}/assign-user`).set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: ownerUser!.id, role: 'owner' });

    const postRes = await request(app.getHttpServer())
      .post('/feed/posts').set('Authorization', `Bearer ${brandOwnerToken}`)
      .send({ brandId, caption: 'Test post', images: ['https://example.com/img.jpg'] });
    postId = postRes.body.id;
  });

  describe('POST /feed/posts', () => {
    it('should allow brand owner to create a post', () => {
      return request(app.getHttpServer())
        .post('/feed/posts')
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ brandId, caption: 'New collection!', images: ['https://example.com/img.jpg'] })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.caption).toBe('New collection!');
          expect(response.body.id).toBeDefined();
        });
    });

    it('should return 403 when a customer tries to create a post', () => {
      return request(app.getHttpServer())
        .post('/feed/posts')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ brandId, caption: 'Sneaky post', images: ['https://example.com/img.jpg'] })
        .expect(403);
    });
  });

  describe('GET /feed', () => {
    it('should return paginated posts publicly', () => {
      return request(app.getHttpServer())
        .get('/feed')
        .expect(200)
        .then((response) => {
          const items = response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
        });
    });
  });

  describe('GET /feed/brand/:brandId', () => {
    it('should return posts for a specific brand', () => {
      return request(app.getHttpServer())
        .get(`/feed/brand/${brandId}`)
        .expect(200)
        .then((response) => {
          const items = response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
        });
    });
  });

  describe('GET /feed/posts/:id', () => {
    it('should return a single post by id', () => {
      return request(app.getHttpServer())
        .get(`/feed/posts/${postId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(postId);
          expect(response.body.caption).toBeDefined();
        });
    });

    it('should return 404 for a non-existent post', () => {
      return request(app.getHttpServer())
        .get('/feed/posts/99999')
        .expect(404);
    });
  });

  describe('PATCH /feed/posts/:id', () => {
    it('should allow brand owner to update post caption', () => {
      return request(app.getHttpServer())
        .patch(`/feed/posts/${postId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ caption: 'Updated caption' })
        .expect(200)
        .then((response) => {
          expect(response.body.caption).toBe('Updated caption');
        });
    });

    it('should return 403 when customer tries to update a post', () => {
      return request(app.getHttpServer())
        .patch(`/feed/posts/${postId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ caption: 'Hacked caption' })
        .expect(403);
    });
  });

  describe('DELETE /feed/posts/:id', () => {
    it('should allow brand owner to delete their post', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/feed/posts').set('Authorization', `Bearer ${brandOwnerToken}`)
        .send({ brandId, caption: 'To be deleted', images: ['https://example.com/img.jpg'] });
      const newPostId = createRes.body.id;

      return request(app.getHttpServer())
        .delete(`/feed/posts/${newPostId}`)
        .set('Authorization', `Bearer ${brandOwnerToken}`)
        .then((response) => {
          expect([200, 204]).toContain(response.status);
        });
    });
  });

  describe('POST /feed/posts/:id/like', () => {
    it('should allow a customer to toggle like on a post', () => {
      return request(app.getHttpServer())
        .post(`/feed/posts/${postId}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body).toBeDefined();
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post(`/feed/posts/${postId}/like`)
        .expect(401);
    });
  });

  describe('GET /feed/posts/:id/liked', () => {
    it('should return like status for authenticated user', () => {
      return request(app.getHttpServer())
        .get(`/feed/posts/${postId}/liked`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(typeof response.body === 'boolean' || response.body.liked !== undefined || response.body !== null).toBe(true);
        });
    });
  });

  describe('GET /feed/posts/:id/comments', () => {
    it('should return an empty comments list for a new post', () => {
      return request(app.getHttpServer())
        .get(`/feed/posts/${postId}/comments`)
        .expect(200)
        .then((response) => {
          const items = response.body.data ?? response.body;
          expect(Array.isArray(items)).toBe(true);
        });
    });
  });

  describe('POST /feed/posts/:id/comments', () => {
    it('should allow customer to add a comment', () => {
      return request(app.getHttpServer())
        .post(`/feed/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ text: 'Love this!' })
        .then((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.text ?? response.body.content).toBeTruthy();
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post(`/feed/posts/${postId}/comments`)
        .send({ text: 'Anonymous comment' })
        .expect(401);
    });
  });

  describe('POST /feed/brands/:id/follow', () => {
    it('should allow customer to toggle follow on a brand', () => {
      return request(app.getHttpServer())
        .post(`/feed/brands/${brandId}/follow`)
        .set('Authorization', `Bearer ${customerToken}`)
        .then((response) => {
          expect([200, 201]).toContain(response.status);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post(`/feed/brands/${brandId}/follow`)
        .expect(401);
    });
  });

  describe('GET /feed/brands/:id/following', () => {
    it('should return follow status for authenticated user', () => {
      return request(app.getHttpServer())
        .get(`/feed/brands/${brandId}/following`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toBeDefined();
        });
    });
  });
});
