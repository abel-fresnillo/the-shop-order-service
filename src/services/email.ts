import { Resend } from 'resend';
import { config } from '../config';
import type { OrderItem } from '../schemas/order';

const resend = new Resend(config.RESEND_API_KEY);

export interface OrderEmailPayload {
  orderId: string;
  items: OrderItem[];
  total: number;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function buildEmailHtml(payload: OrderEmailPayload): string {
  const rows = payload.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">$${item.price.toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="font-size:24px;margin-bottom:4px">New Order Received</h1>
  <p style="color:#666;margin-top:0">Order #${escapeHtml(payload.orderId)}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px 12px;text-align:left">Product</th>
        <th style="padding:8px 12px;text-align:center">Qty</th>
        <th style="padding:8px 12px;text-align:right">Unit Price</th>
        <th style="padding:8px 12px;text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="padding:12px;text-align:right;font-weight:bold">Total</td>
        <td style="padding:12px;text-align:right;font-weight:bold">$${payload.total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmation(payload: OrderEmailPayload): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.EMAIL_FROM,
    to: config.EMAIL_RECIPIENT,
    subject: `New Order #${payload.orderId}`,
    html: buildEmailHtml(payload),
  });

  if (error) {
    throw new Error(`Failed to send order email: ${error.message}`);
  }
}
