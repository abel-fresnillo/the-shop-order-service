import { pgTable, uuid, jsonb, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import type { OrderItem } from '../schemas/order';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  items: jsonb('items').$type<OrderItem[]>().notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('confirmed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
