import { SpanStatusCode } from '@opentelemetry/api';
import { db } from '../db';
import { orders } from '../db/schema';
import type { OrderItem } from '../schemas/order';
import { getTracer } from '../observability/tracer';
import { ordersCreated, ordersFailed, orderTotalValue } from '../observability/metrics';

export interface CreateOrderParams {
  id: string;
  items: OrderItem[];
  total: number;
}

export async function createOrder(params: CreateOrderParams) {
  return getTracer().startActiveSpan('db.createOrder', async (span) => {
    try {
      span.setAttributes({
        'db.system': 'postgresql',
        'db.operation': 'INSERT',
        'db.sql.table': 'orders',
        'order.id': params.id,
        'order.item_count': params.items.length,
      });

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

      ordersCreated.add(1);
      orderTotalValue.record(params.total);
      return row;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      span.recordException(err as Error);
      ordersFailed.add(1, { reason: 'db' });
      throw err;
    } finally {
      span.end();
    }
  });
}
