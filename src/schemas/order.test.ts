import { describe, it, expect } from 'vitest';
import { OrderRequestSchema } from './order';

const validItem = { name: 'Classic T-Shirt', quantity: 2, price: 29.99 };

describe('OrderRequestSchema', () => {
  it('accepts a valid order', () => {
    const result = OrderRequestSchema.safeParse({ items: [validItem] });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from item name', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, name: '  T-Shirt  ' }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items[0].name).toBe('T-Shirt');
  });

  it('rejects empty items array', () => {
    const result = OrderRequestSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects missing items field', () => {
    const result = OrderRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects item with empty name', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, name: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with whitespace-only name', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, name: '   ' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with negative price', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, price: -5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with zero price', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, price: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with negative quantity', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, quantity: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with zero quantity', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with non-integer quantity', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, quantity: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with missing name', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ quantity: 1, price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with price as string', () => {
    const result = OrderRequestSchema.safeParse({
      items: [{ ...validItem, price: 'ten' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts multiple valid items', () => {
    const result = OrderRequestSchema.safeParse({
      items: [
        { name: 'Hat', quantity: 1, price: 15.0 },
        { name: 'Shirt', quantity: 3, price: 25.0 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
