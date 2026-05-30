import { db } from '../db';
import { orders } from '../db/schema';
import type { OrderItem } from '../schemas/order';

export interface CreateOrderParams {
  id: string;
  items: OrderItem[];
  total: number;
}

export async function createOrder(params: CreateOrderParams) {
  const [row] = await db
    .insert(orders)
    .values({
      id: params.id,
      items: params.items,
      total: String(params.total),
    })
    .returning();

  if (!row) {
    throw new Error('INSERT did not return a row');
  }

  return row;
}
