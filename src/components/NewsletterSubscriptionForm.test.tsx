import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterSubscriptionForm } from './NewsletterSubscriptionForm';
import * as newsletterService from '../services/newsletter';

// Mock the newsletter service
vi.mock('../services/newsletter', () => ({
  subscribeToNewsletter: vi.fn(),
}));

describe('NewsletterSubscriptionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test form rendering with required elements
  // Requirements: 1.1, 5.1, 5.2
  it('renders form with required elements', () => {
    render(<NewsletterSubscriptionForm />);

    // Check for main heading
    expect(screen.getByText('Ostani Obavešten')).toBeInTheDocument();
    
    // Check for description
    expect(screen.getByText('Prijavite se da biste dobijali obaveštenja putem mail-a kada se objavi nova priča')).toBeInTheDocument();
    
    // Check for email input
    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'Unesite vašu email adresu');
    
    // Check for subscribe button
    const subscribeButton = screen.getByTestId('subscribe-button');
    expect(subscribeButton).toBeInTheDocument();
    expect(subscribeButton).toHaveAttribute('type', 'submit');
    expect(subscribeButton).toHaveTextContent('Prijavi me');
    
    // Check for email icon in button
    const emailIcon = subscribeButton.querySelector('svg');
    expect(emailIcon).toBeInTheDocument();
  });

  // Test successful subscription scenario
  // Requirements: 1.1, 5.1, 5.2
  it('handles successful subscription', async () => {
    vi.mocked(newsletterService.subscribeToNewsletter).mockResolvedValueOnce(undefined);

    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');

    // Submit form
    fireEvent.click(subscribeButton);

    // Check loading state
    await waitFor(() => {
      expect(subscribeButton).toHaveTextContent('Prijavljivanje...');
      expect(subscribeButton).toBeDisabled();
    });

    // Wait for success message
    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Uspešno ste se prijavili na Newsletter! Proverite email za potvrdu.');
    });

    // Verify service was called with correct email
    expect(newsletterService.subscribeToNewsletter).toHaveBeenCalledWith('test@example.com');
    
    // Verify email input is cleared
    expect(emailInput).toHaveValue('');
    
    // Verify button is no longer disabled
    expect(subscribeButton).not.toBeDisabled();
    expect(subscribeButton).toHaveTextContent('Prijavi me');
  });

  // Test error handling scenarios
  // Requirements: 1.1, 5.1, 5.2
  it('handles subscription errors', async () => {
    vi.mocked(newsletterService.subscribeToNewsletter).mockRejectedValueOnce(
      new Error('Email already subscribed')
    );

    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    // Enter email and submit
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.click(subscribeButton);

    // Wait for error message
    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Email already subscribed');
    });

    // Verify service was called
    expect(newsletterService.subscribeToNewsletter).toHaveBeenCalledWith('existing@example.com');
    
    // Verify email input retains value on error
    expect(emailInput).toHaveValue('existing@example.com');
    
    // Verify button is no longer disabled
    expect(subscribeButton).not.toBeDisabled();
  });

  // Test empty email validation
  // Requirements: 1.1, 5.1, 5.2
  it('validates empty email input', async () => {
    render(<NewsletterSubscriptionForm />);

    const subscribeButton = screen.getByTestId('subscribe-button');

    // Submit form without entering email
    fireEvent.click(subscribeButton);

    // Wait for validation message
    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Unesite vašu email adresu');
    });

    // Verify service was not called
    expect(newsletterService.subscribeToNewsletter).not.toHaveBeenCalled();
  });

  // Test whitespace-only email validation
  // Requirements: 1.1, 5.1, 5.2
  it('validates whitespace-only email input', async () => {
    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    // Enter only whitespace
    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.click(subscribeButton);

    // Wait for validation message
    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Unesite vašu email adresu');
    });

    // Verify service was not called
    expect(newsletterService.subscribeToNewsletter).not.toHaveBeenCalled();
  });

  // Test form submission via Enter key
  // Requirements: 1.1, 5.1, 5.2
  it('handles form submission via Enter key', async () => {
    vi.mocked(newsletterService.subscribeToNewsletter).mockResolvedValueOnce(undefined);

    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');

    // Enter email and press Enter
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    // Wait for success message
    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Uspešno ste se prijavili na Newsletter! Proverite email za potvrdu.');
    });

    // Verify service was called
    expect(newsletterService.subscribeToNewsletter).toHaveBeenCalledWith('test@example.com');
  });

  // Test loading state disables form elements
  // Requirements: 5.1, 5.2
  it('disables form elements during loading', async () => {
    // Mock a slow subscription to test loading state
    vi.mocked(newsletterService.subscribeToNewsletter).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    // Enter email and submit
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);

    // Check that elements are disabled during loading
    await waitFor(() => {
      expect(subscribeButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(subscribeButton).toHaveTextContent('Prijavljivanje...');
    });

    // Wait for completion
    await waitFor(() => {
      expect(subscribeButton).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
    }, { timeout: 200 });
  });

  // Test message display styling
  // Requirements: 5.1, 5.2
  it('displays success and error messages with appropriate styling', async () => {
    const { rerender } = render(<NewsletterSubscriptionForm />);

    // Test success message styling
    vi.mocked(newsletterService.subscribeToNewsletter).mockResolvedValueOnce(undefined);
    
    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      
      // Check for success icon (checkmark path)
      const successIcon = message.querySelector('path[d*="M5 13l4 4L19 7"]');
      expect(successIcon).toBeInTheDocument();
    });

    // Test error message styling
    vi.clearAllMocks();
    vi.mocked(newsletterService.subscribeToNewsletter).mockRejectedValueOnce(
      new Error('Test error')
    );

    rerender(<NewsletterSubscriptionForm />);

    const newEmailInput = screen.getByTestId('email-input');
    const newSubscribeButton = screen.getByTestId('subscribe-button');

    fireEvent.change(newEmailInput, { target: { value: 'error@example.com' } });
    fireEvent.click(newSubscribeButton);

    await waitFor(() => {
      const message = screen.getByTestId('message');
      expect(message).toBeInTheDocument();
      
      // Check for error icon (warning path)
      const errorIcon = message.querySelector('path[d*="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"]');
      expect(errorIcon).toBeInTheDocument();
    });
  });
});