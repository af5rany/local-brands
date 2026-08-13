import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
