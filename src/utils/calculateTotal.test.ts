import { describe, it, expect } from 'vitest';
import { calculateTotal } from './calculateTotal';

describe('calculateTotal', () => {
  it('computes total for a single item', () => {
    expect(calculateTotal([{ name: 'Shirt', quantity: 2, price: 29.99 }])).toBe(59.98);
  });

  it('computes total for multiple items', () => {
    const items = [
      { name: 'Hat', quantity: 1, price: 15.0 },
      { name: 'Shirt', quantity: 3, price: 25.0 },
    ];
    expect(calculateTotal(items)).toBe(90.0);
  });

  it('handles floating-point precision correctly', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in naive JS — must be rounded
    const items = [
      { name: 'A', quantity: 1, price: 0.1 },
      { name: 'B', quantity: 1, price: 0.2 },
    ];
    expect(calculateTotal(items)).toBe(0.3);
  });

  it('handles a single item with quantity 1', () => {
    expect(calculateTotal([{ name: 'Mug', quantity: 1, price: 12.5 }])).toBe(12.5);
  });

  it('handles large quantities correctly', () => {
    expect(calculateTotal([{ name: 'Pin', quantity: 100, price: 1.99 }])).toBe(199.0);
  });
});
