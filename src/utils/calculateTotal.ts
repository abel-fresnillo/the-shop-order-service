import type { OrderItem } from '../schemas/order';

export function calculateTotal(items: OrderItem[]): number {
  const raw = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return Math.round(raw * 100) / 100;
}
