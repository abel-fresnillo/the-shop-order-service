import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReturning } = vi.hoisted(() => ({
  mockReturning: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockReturning,
      })),
    })),
  },
}));

vi.mock('../config', () => ({
  config: { DATABASE_URL: 'postgresql://test:test@localhost/test' },
}));

import { createOrder } from './database';

const mockRow = {
  id: 'abc-123',
  items: [{ name: 'Hat', quantity: 1, price: 15.0 }],
  total: '15.00',
  status: 'confirmed',
  createdAt: new Date('2026-05-30T00:00:00Z'),
};

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([mockRow]);
  });

  it('returns the inserted row', async () => {
    const result = await createOrder({ id: 'abc-123', items: mockRow.items as any, total: 15.0 });
    expect(result.id).toBe('abc-123');
    expect(result.status).toBe('confirmed');
  });

  it('throws when the INSERT returns no rows', async () => {
    mockReturning.mockResolvedValue([]);
    await expect(
      createOrder({ id: 'abc-123', items: mockRow.items as any, total: 15.0 })
    ).rejects.toThrow('INSERT did not return a row');
  });

  it('propagates DB errors', async () => {
    mockReturning.mockRejectedValue(new Error('connection refused'));
    await expect(
      createOrder({ id: 'abc-123', items: mockRow.items as any, total: 15.0 })
    ).rejects.toThrow('connection refused');
  });
});
