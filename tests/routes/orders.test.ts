import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/config', () => ({
  config: {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'orders@shop.test',
    EMAIL_RECIPIENT: 'recipient@shop.test',
    ORDER_API_KEY: 'a'.repeat(32),
    ALLOWED_ORIGIN: 'http://localhost:5173',
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost/test',
  },
}));

vi.mock('../../src/services/email', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/database', () => ({
  createOrder: vi.fn().mockResolvedValue({
    id: 'test-order-id',
    items: [{ name: 'Test Item', quantity: 1, price: 9.99 }],
    total: '9.99',
    status: 'confirmed',
    createdAt: new Date(),
  }),
}));

import { createApp } from '../../src/app';
import { sendOrderConfirmation } from '../../src/services/email';
import { createOrder } from '../../src/services/database';

const API_KEY = 'a'.repeat(32);
const validPayload = {
  items: [{ name: 'Test Item', quantity: 1, price: 9.99 }],
};

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /orders', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
    vi.mocked(createOrder).mockResolvedValue({
      id: 'test-order-id',
      items: [{ name: 'Test Item', quantity: 1, price: 9.99 }],
      total: '9.99',
      status: 'confirmed',
      createdAt: new Date(),
    });
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

  it('calls createOrder once on valid request', async () => {
    await request(app).post('/orders').set('x-api-key', API_KEY).send(validPayload);
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it('calls createOrder with correct items and total', async () => {
    await request(app).post('/orders').set('x-api-key', API_KEY).send(validPayload);
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        items: validPayload.items,
        total: 9.99,
      })
    );
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

  it('returns 503 when database write fails', async () => {
    vi.mocked(createOrder).mockRejectedValue(new Error('connection error'));

    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send(validPayload);

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });

  it('does not call sendOrderConfirmation when database write fails', async () => {
    vi.mocked(createOrder).mockRejectedValue(new Error('connection error'));

    await request(app).post('/orders').set('x-api-key', API_KEY).send(validPayload);

    expect(sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it('returns 201 when email fails after DB write succeeds', async () => {
    vi.mocked(sendOrderConfirmation).mockRejectedValue(new Error('Resend API error'));

    const res = await request(app)
      .post('/orders')
      .set('x-api-key', API_KEY)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown').set('x-api-key', API_KEY);
    expect(res.status).toBe(404);
  });
});
