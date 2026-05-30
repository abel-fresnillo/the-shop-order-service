import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../config', () => ({
  config: {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'orders@shop.test',
    EMAIL_RECIPIENT: 'recipient@shop.test',
    ORDER_API_KEY: 'a'.repeat(32),
    ALLOWED_ORIGIN: 'http://localhost:5173',
    NODE_ENV: 'test',
  },
}));

vi.mock('../services/email', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
}));

import { createApp } from '../app';
import { sendOrderConfirmation } from '../services/email';

const app = createApp();
const API_KEY = 'a'.repeat(32);
const validPayload = {
  items: [{ name: 'Test Item', quantity: 1, price: 9.99 }],
};

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendOrderConfirmation).mockResolvedValue(undefined);
  });

  it('returns 201 with orderId on valid request', async () => {
    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBeDefined();
    expect(typeof res.body.orderId).toBe('string');
  });

  it('calls sendOrderConfirmation once on success', async () => {
    await request(app).post('/orders').set('x-api-key', API_KEY).send(validPayload);
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for empty items array', async () => {
    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for missing items field', async () => {
    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for item with negative price', async () => {
    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send({ items: [{ name: 'Item', quantity: 1, price: -5 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when API key is missing', async () => {
    const res = await request(app).post('/orders').send(validPayload);
    expect(res.status).toBe(401);
  });

  it('returns 401 when API key is wrong', async () => {
    const res = await request(app)
      .post('/orders')
      .set('x-api-key', 'wrong-key')
      .send(validPayload);

    expect(res.status).toBe(401);
  });

  it('returns 502 when email service fails', async () => {
    vi.mocked(sendOrderConfirmation).mockRejectedValue(new Error('Resend API error'));

    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send(validPayload);

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Failed to send order confirmation');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown').set('x-api-key', API_KEY);
    expect(res.status).toBe(404);
  });
});
