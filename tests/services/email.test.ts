import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

vi.mock('../../src/config', () => ({
  config: {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'orders@shop.test',
    EMAIL_RECIPIENT: 'recipient@shop.test',
  },
}));

import { sendOrderConfirmation } from '../../src/services/email';

const payload = {
  orderId: 'test-order-123',
  items: [
    { name: 'Classic T-Shirt', quantity: 2, price: 29.99 },
    { name: 'Blue Hat', quantity: 1, price: 15.0 },
  ],
  total: 74.98,
};

describe('sendOrderConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'mock-email-id' }, error: null });
  });

  it('calls resend.emails.send exactly once', async () => {
    await sendOrderConfirmation(payload);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('sends to the configured recipient address', async () => {
    await sendOrderConfirmation(payload);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'recipient@shop.test' })
    );
  });

  it('sends from the configured from address', async () => {
    await sendOrderConfirmation(payload);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'orders@shop.test' })
    );
  });

  it('includes the order ID in the subject', async () => {
    await sendOrderConfirmation(payload);
    const call = mockSend.mock.calls[0][0] as { subject: string };
    expect(call.subject).toContain('test-order-123');
  });

  it('includes all item names in the email body', async () => {
    await sendOrderConfirmation(payload);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Classic T-Shirt');
    expect(call.html).toContain('Blue Hat');
  });

  it('includes item quantities in the email body', async () => {
    await sendOrderConfirmation(payload);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('>2<');
    expect(call.html).toContain('>1<');
  });

  it('includes the order total in the email body', async () => {
    await sendOrderConfirmation(payload);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('74.98');
  });

  it('HTML-escapes product names to prevent injection', async () => {
    await sendOrderConfirmation({
      ...payload,
      items: [{ name: '<script>alert("xss")</script>', quantity: 1, price: 10 }],
      total: 10,
    });
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).not.toContain('<script>');
    expect(call.html).toContain('&lt;script&gt;');
  });

  it('throws when Resend returns an error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'API key invalid', name: 'validation_error' },
    });
    await expect(sendOrderConfirmation(payload)).rejects.toThrow('Failed to send order email');
  });
});
