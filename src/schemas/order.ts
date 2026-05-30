import { z } from 'zod';

export const OrderItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(200),
  quantity: z.number().int().positive().max(1000),
  price: z.number().positive().max(100_000),
});

export const OrderRequestSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(100, 'Order cannot contain more than 100 items'),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderRequest = z.infer<typeof OrderRequestSchema>;
