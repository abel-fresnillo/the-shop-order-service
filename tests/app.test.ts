import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { API_KEY, authedRequest } from './helpers/setup';

vi.mock('../src/config', () => ({
  config: {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'orders@shop.test',
    EMAIL_RECIPIENT: 'recipient@shop.test',
    ORDER_API_KEY: 'a'.repeat(32),
    ALLOWED_ORIGINS: ['http://localhost:5173'],
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost/test',
  },
}));

import { createApp } from '../src/app';

describe('GET /health', () => {
  it('returns 200 bypassing API key check', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('API key middleware', () => {
  it('returns 401 when x-api-key header is missing', async () => {
    const res = await request(createApp()).post('/orders').send({});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns 401 when x-api-key header is wrong', async () => {
    const res = await request(createApp())
      .post('/orders')
      .set('x-api-key', 'wrong-key')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Unauthorized' });
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const app = createApp();
    const res = await authedRequest(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Not found' });
  });
});
