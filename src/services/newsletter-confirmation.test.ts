import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockInvoke = vi.fn();
vi.mock('./supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    }
  }
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://sunjaisize.com'
  },
  writable: true
});

// Import after mocking
const { sendSubscriptionConfirmation } = await import('./newsletter');

describe('Newsletter Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendSubscriptionConfirmation', () => {
    it('should send confirmation email successfully', async () => {
      mockInvoke.mockResolvedValue({
        data: { message: 'Confirmation email sent successfully', messageId: 'test-123' },
        error: null
      });

      await expect(sendSubscriptionConfirmation('test@example.com')).resolves.not.toThrow();

      expect(mockInvoke).toHaveBeenCalledWith('send-subscription-confirmation', {
        body: {
          email: 'test@example.com',
          siteTitle: 'Šunja i Siže',
          siteUrl: 'https://sunjaisize.com'
        }
      });
    });

    it('should handle supabase function error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' }
      });

      await expect(sendSubscriptionConfirmation('test@example.com'))
        .rejects.toThrow('Failed to send confirmation email: Function error');
    });

    it('should handle data error from function', async () => {
      mockInvoke.mockResolvedValue({
        data: { error: 'Email sending failed' },
        error: null
      });

      await expect(sendSubscriptionConfirmation('test@example.com'))
        .rejects.toThrow('Confirmation email sending failed: Email sending failed');
    });

    it('should handle unknown errors', async () => {
      mockInvoke.mockRejectedValue('Unknown error');

      await expect(sendSubscriptionConfirmation('test@example.com'))
        .rejects.toThrow('Unknown error occurred while sending confirmation email');
    });
  });
});