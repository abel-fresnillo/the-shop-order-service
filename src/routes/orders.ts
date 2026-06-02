import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OrderRequestSchema } from '../schemas/order';
import { calculateTotal } from '../utils/calculateTotal';
import { createOrder } from '../services/database';
import { sendOrderConfirmation } from '../services/email';
import { ordersFailed } from '../observability/metrics';
import { logger } from '../observability/logger';

export const ordersRouter = Router();

ordersRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

ordersRouter.post('/orders', async (req, res) => {
  const result = OrderRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error.issues[0]?.message ?? 'Invalid request',
    });
    return;
  }

  const { items } = result.data;
  const orderId = uuidv4();
  const total = calculateTotal(items);

  try {
    await createOrder({ id: orderId, items, total });
  } catch {
    res.status(503).json({
      success: false,
      error: 'Failed to save order. Please try again.',
    });
    return;
  }

  try {
    await sendOrderConfirmation({ orderId, items, total });
  } catch (err) {
    ordersFailed.add(1, { reason: 'email' });
    logger.error('Order confirmation email failed', { orderId, err: (err as Error).message });
  }

  res.status(201).json({ success: true, orderId });
});
