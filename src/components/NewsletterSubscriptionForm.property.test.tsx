import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { NewsletterSubscriptionForm } from './NewsletterSubscriptionForm';

// Mock the newsletter service
vi.mock('../services/newsletter');

// Arbitrary generators for property-based testing
const arbitraryValidEmail = (): fc.Arbitrary<string> => {
  return fc.tuple(
    // Local part: alphanumeric, dots, underscores, hyphens (but not starting/ending with dots or hyphens)
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
      /^[a-zA-Z0-9._-]+$/.test(s) && 
      !s.startsWith('.') && 
      !s.endsWith('.') && 
      !s.includes('..') &&
      !s.startsWith('-') &&
      !s.endsWith('-')
    ),
    // Domain part: alphanumeric and hyphens (but not starting/ending with hyphens)
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
      /^[a-zA-Z0-9-]+$/.test(s) && 
      !s.startsWith('-') && 
      !s.endsWith('-') && 
      !s.includes('--') &&
      s.length >= 1
    ),
    fc.constantFrom('com', 'org', 'net', 'edu', 'gov')
  ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
};

describe('NewsletterSubscriptionForm Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // Feature: newsletter-subscription, Property 4: Subscription Success Feedback
  // Validates: Requirements 1.5
  test('Property 4: Subscription Success Feedback', async () => {
    const { subscribeToNewsletter } = await import('../services/newsletter');
    
    await fc.assert(
      fc.asyncProperty(
        arbitraryValidEmail(),
        async (email) => {
          // Mock successful subscription
          vi.mocked(subscribeToNewsletter).mockResolvedValueOnce(undefined);

          // Render the component
          const { unmount, container } = render(<NewsletterSubscriptionForm />);

          // Find form elements using container to avoid conflicts
          const emailInput = container.querySelector('[data-testid="email-input"]') as HTMLInputElement;
          const subscribeButton = container.querySelector('[data-testid="subscribe-button"]') as HTMLButtonElement;

          expect(emailInput).toBeTruthy();
          expect(subscribeButton).toBeTruthy();

          // Enter email and submit
          fireEvent.change(emailInput, { target: { value: email } });
          
          // Wait a bit for state to update
          await waitFor(() => {
            expect(emailInput.value).toBe(email);
          });
          
          fireEvent.click(subscribeButton);

          // Wait for success message to appear
          await waitFor(() => {
            const message = container.querySelector('[data-testid="message"]');
            expect(message).toBeTruthy();
            
            // Verify success message content
            const messageText = message?.textContent;
            expect(messageText).toContain('Successfully subscribed');
            
            // Verify success styling (green background/border)
            const messageStyle = window.getComputedStyle(message as Element);
            expect(messageStyle.backgroundColor).toContain('rgba(106, 160, 116, 0.1)');
          }, { timeout: 3000 });

          // Verify email input is cleared after successful subscription
          expect(emailInput.value).toBe('');

          // Verify success icon is present
          const message = container.querySelector('[data-testid="message"]');
          const successIcon = message?.querySelector('svg');
          expect(successIcon).toBeTruthy();
          
          // Check for checkmark path (success icon)
          const checkmarkPath = successIcon?.querySelector('path[d*="M5 13l4 4L19 7"]');
          expect(checkmarkPath).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  // Feature: newsletter-subscription, Property 10: UI Feedback Consistency
  // Validates: Requirements 5.3
  test('Property 10: UI Feedback Consistency', async () => {
    const { subscribeToNewsletter } = await import('../services/newsletter');
    
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Test success case
          fc.record({
            email: arbitraryValidEmail(),
            shouldSucceed: fc.constant(true),
            expectedError: fc.constant(null)
          }),
          // Test "Email already subscribed" error case
          fc.record({
            email: arbitraryValidEmail(),
            shouldSucceed: fc.constant(false),
            expectedError: fc.constant('Email already subscribed')
          }),
          // Test empty email case specifically (client-side validation)
          fc.record({
            email: fc.constant(''),
            shouldSucceed: fc.constant(false),
            expectedError: fc.constant('Please enter your email address')
          }),
          // Test whitespace-only email case (client-side validation)
          fc.record({
            email: fc.constant('   '),
            shouldSucceed: fc.constant(false),
            expectedError: fc.constant('Please enter your email address')
          })
        ),
        async (testCase) => {
          // Clear all mocks before each test
          vi.clearAllMocks();
          
          // Mock the service based on test case
          if (testCase.shouldSucceed) {
            vi.mocked(subscribeToNewsletter).mockResolvedValueOnce(undefined);
          } else if (testCase.expectedError && testCase.expectedError !== 'Please enter your email address') {
            // For server-side validation errors, mock the service
            vi.mocked(subscribeToNewsletter).mockRejectedValueOnce(new Error(testCase.expectedError));
          }

          // Render the component
          const { unmount, container } = render(<NewsletterSubscriptionForm />);

          // Find form elements using container to avoid conflicts
          const emailInput = container.querySelector('[data-testid="email-input"]') as HTMLInputElement;
          const subscribeButton = container.querySelector('[data-testid="subscribe-button"]') as HTMLButtonElement;

          expect(emailInput).toBeTruthy();
          expect(subscribeButton).toBeTruthy();

          // Enter email and submit
          fireEvent.change(emailInput, { target: { value: testCase.email } });
          fireEvent.click(subscribeButton);

          // Wait for message to appear
          await waitFor(() => {
            const message = container.querySelector('[data-testid="message"]');
            expect(message).toBeTruthy();
            
            const messageText = message?.textContent || '';
            
            if (testCase.shouldSucceed) {
              // Success case: verify success message and styling
              expect(messageText).toContain('Successfully subscribed');
              
              // Verify success styling
              const messageStyle = window.getComputedStyle(message as Element);
              expect(messageStyle.backgroundColor).toContain('rgba(106, 160, 116, 0.1)');
              
              // Verify success icon (checkmark)
              const successIcon = message?.querySelector('path[d*="M5 13l4 4L19 7"]');
              expect(successIcon).toBeTruthy();
              
            } else {
              // Error case: verify error message and styling
              if (testCase.expectedError) {
                expect(messageText).toContain(testCase.expectedError);
              }
              
              // Verify error styling (red background/border)
              const messageStyle = window.getComputedStyle(message as Element);
              expect(messageStyle.backgroundColor).toContain('rgba(220, 38, 127, 0.1)');
              
              // Verify error icon (warning/exclamation)
              const errorIcon = message?.querySelector('path[d*="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"]');
              expect(errorIcon).toBeTruthy();
            }
            
            // Verify message has proper structure
            expect(message?.querySelector('svg')).toBeTruthy(); // Icon present
            expect(message?.querySelector('p')).toBeTruthy(); // Text present
            
            // Verify consistent animation class
            expect((message as Element).classList.contains('animate-scale-in')).toBe(true);
            
          }, { timeout: 5000 }); // Increased timeout

          unmount();
        }
      ),
      { numRuns: 20 } // Reduced runs to focus on core cases
    );
  }, 120000);
});