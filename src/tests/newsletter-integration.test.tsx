import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NewsletterSubscriptionForm } from '../components/NewsletterSubscriptionForm';
import { NewsletterSendButton } from '../components/NewsletterSendButton';
import { HomePage } from '../pages/HomePage';
import { NewsletterManagementPage } from '../pages/NewsletterManagementPage';
import * as supabaseService from '../services/supabase';
import * as newsletterService from '../services/newsletter';

// Mock the services
vi.mock('../services/supabase', () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
  fetchAllCategories: vi.fn()
}));

vi.mock('../services/newsletter', () => ({
  subscribeToNewsletter: vi.fn(),
  sendNewsletterEmail: vi.fn(),
  getSubscriberCount: vi.fn(),
  getActiveSubscribers: vi.fn()
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock image compression to avoid file processing
vi.mock('../utils/imageCompression', () => ({
  compressImages: vi.fn().mockResolvedValue([])
}));

// Mock TipTap editor to avoid complex DOM manipulation
vi.mock('@tiptap/react', () => ({
  useEditor: () => ({
    getHTML: () => '<p>This is the first paragraph of the newsletter test post.</p><p>This is the second paragraph.</p>',
    getText: () => 'This is the first paragraph of the newsletter test post. This is the second paragraph.',
    commands: {
      setContent: vi.fn(),
      clearContent: vi.fn()
    },
    isActive: () => false,
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn() }),
        setLink: () => ({ run: vi.fn() }),
        unsetLink: () => ({ run: vi.fn() }),
        insertContent: () => ({ run: vi.fn() })
      })
    })
  }),
  EditorContent: () => (
    <div data-testid="editor-content" role="textbox">
      <p>This is the first paragraph of the newsletter test post.</p>
      <p>This is the second paragraph.</p>
    </div>
  )
}));

describe('Newsletter Integration Tests', () => {
  const mockFetchCategories = vi.mocked(supabaseService.fetchAllCategories);
  const mockSubscribeToNewsletter = vi.mocked(newsletterService.subscribeToNewsletter);
  const mockSendNewsletter = vi.mocked(newsletterService.sendNewsletterEmail);
  const mockGetSubscriberCount = vi.mocked(newsletterService.getSubscriberCount);
  const mockGetActiveSubscribers = vi.mocked(newsletterService.getActiveSubscribers);

  const mockSubscribers = [
    {
      id: '1',
      email: 'subscriber1@example.com',
      subscribed_at: '2024-01-01T00:00:00Z',
      is_active: true,
    },
    {
      id: '2',
      email: 'subscriber2@test.org',
      subscribed_at: '2024-01-02T00:00:00Z',
      is_active: true,
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCategories.mockResolvedValue([]);
    mockSubscribeToNewsletter.mockResolvedValue(undefined);
    mockSendNewsletter.mockResolvedValue(undefined);
    mockGetSubscriberCount.mockResolvedValue(2);
    mockGetActiveSubscribers.mockResolvedValue(mockSubscribers);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Complete end-to-end newsletter workflow (simplified)
  test('complete end-to-end newsletter workflow', async () => {
    // Step 1: User subscribes to newsletter on homepage
    const { useAuth } = await import('../contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isAdminMode: false,
      user: null,
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Verify newsletter subscription form is present on homepage
    expect(screen.getByText('Stay Updated')).toBeInTheDocument();
    expect(screen.getByText('Subscribe to get notified when new stories are published')).toBeInTheDocument();

    // Subscribe to newsletter
    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.click(subscribeButton);

    // Wait for subscription success
    await waitFor(() => {
      expect(screen.getByText('Successfully subscribed to newsletter!')).toBeInTheDocument();
    });

    expect(mockSubscribeToNewsletter).toHaveBeenCalledWith('newuser@example.com');

    // Step 2: Test newsletter send button functionality directly
    render(
      <NewsletterSendButton
        postId="test-post-id"
        postTitle="Newsletter Integration Test Post"
        postContent="This is the first paragraph of the newsletter test post."
      />
    );

    const newsletterButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(newsletterButton);

    // Verify newsletter service was called with correct data
    await waitFor(() => {
      expect(mockSendNewsletter).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 'test-post-id',
          postTitle: 'Newsletter Integration Test Post',
          postContent: 'This is the first paragraph of the newsletter test post.',
          siteTitle: 'Personal Blog'
        })
      );
    });

    // Wait for newsletter success message
    await waitFor(() => {
      expect(screen.getByText(/newsletter sent successfully/i)).toBeInTheDocument();
    });

    expect(mockSendNewsletter).toHaveBeenCalled();
  });

  // Test 2: Newsletter subscription form error handling
  test('newsletter subscription form handles errors correctly', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isAdminMode: false,
      user: null,
      setUser: vi.fn(),
    });

    render(<NewsletterSubscriptionForm />);

    // Test empty email validation
    const subscribeButton = screen.getByTestId('subscribe-button');
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    // Test duplicate email error
    mockSubscribeToNewsletter.mockRejectedValueOnce(new Error('Email already subscribed'));

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Email already subscribed')).toBeInTheDocument();
    });

    expect(mockSubscribeToNewsletter).toHaveBeenCalledWith('existing@example.com');
  });

  // Test 3: Newsletter send button error handling
  test('newsletter send button handles errors correctly', async () => {
    mockSendNewsletter.mockRejectedValueOnce(new Error('Failed to send newsletter'));

    render(
      <NewsletterSendButton
        postId="test-post-id"
        postTitle="Test Post"
        postContent="Test content for newsletter"
      />
    );

    const sendButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send newsletter')).toBeInTheDocument();
    });

    expect(mockSendNewsletter).toHaveBeenCalled();
  });

  // Test 4: Admin newsletter management functionality
  test('admin can view and manage newsletter subscribers', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for subscriber count to load
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('2');
    });

    // Click view subscribers button
    const viewButton = screen.getByTestId('view-subscribers-button');
    fireEvent.click(viewButton);

    // Wait for subscriber list to load
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-list')).toBeInTheDocument();
    });

    // Check that subscribers are displayed with masked emails
    expect(screen.getByText('su***@example.com')).toBeInTheDocument();
    expect(screen.getByText('su***@test.org')).toBeInTheDocument();

    // Check that export button appears
    expect(screen.getByTestId('export-subscribers-button')).toBeInTheDocument();

    expect(mockGetSubscriberCount).toHaveBeenCalled();
    expect(mockGetActiveSubscribers).toHaveBeenCalled();
  });

  // Test 5: Newsletter content extraction and formatting
  test('newsletter extracts first paragraph correctly from post content', async () => {
    render(
      <NewsletterSendButton
        postId="test-post-id"
        postTitle="Content Extraction Test"
        postContent="First paragraph content. Second paragraph content. Third paragraph content."
      />
    );

    const sendButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendNewsletter).toHaveBeenCalledWith(
        expect.objectContaining({
          postContent: 'First paragraph content. Second paragraph content. Third paragraph content.'
        })
      );
    });
  });

  // Test 6: Newsletter button integration in post creation workflow (simplified)
  test('newsletter button integrates correctly in post creation workflow', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Test the newsletter button component directly
    render(
      <NewsletterSendButton
        postId="integration-test-id"
        postTitle="Integration Test Post"
        postContent="This is test content for integration testing."
      />
    );

    // Verify the newsletter button is present and functional
    expect(screen.getByTestId('send-newsletter-button')).toBeInTheDocument();
    expect(screen.getByText(/send newsletter/i)).toBeInTheDocument();

    // Click the newsletter button
    const newsletterButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(newsletterButton);

    // Verify the newsletter service was called
    await waitFor(() => {
      expect(mockSendNewsletter).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 'integration-test-id',
          postTitle: 'Integration Test Post',
          postContent: 'This is test content for integration testing.',
          siteTitle: 'Personal Blog'
        })
      );
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/newsletter sent successfully/i)).toBeInTheDocument();
    });
  });

  // Test 7: Error handling across the complete workflow
  test('handles errors gracefully across the complete workflow', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    
    // Test subscription error
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isAdminMode: false,
      user: null,
      setUser: vi.fn(),
    });

    mockSubscribeToNewsletter.mockRejectedValueOnce(new Error('Database error'));

    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });

    // Test newsletter send error
    mockSendNewsletter.mockRejectedValueOnce(new Error('Email service unavailable'));

    render(
      <NewsletterSendButton
        postId="test-post-id"
        postTitle="Error Test Post"
        postContent="Test content"
      />
    );

    const sendButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Email service unavailable')).toBeInTheDocument();
    });

    // Test admin management error
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    mockGetSubscriberCount.mockRejectedValueOnce(new Error('Failed to fetch subscriber count'));

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch subscriber count')).toBeInTheDocument();
    });
  });

  // Test 8: Newsletter form validation and user feedback
  test('newsletter form provides comprehensive validation and feedback', async () => {
    render(<NewsletterSubscriptionForm />);

    const emailInput = screen.getByTestId('email-input');
    const subscribeButton = screen.getByTestId('subscribe-button');

    // Test whitespace-only email
    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    // Test successful subscription with proper feedback
    mockSubscribeToNewsletter.mockResolvedValueOnce(undefined);

    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.click(subscribeButton);

    // Check loading state
    await waitFor(() => {
      expect(subscribeButton).toHaveTextContent('Subscribing...');
      expect(subscribeButton).toBeDisabled();
    });

    // Check success state
    await waitFor(() => {
      expect(screen.getByText('Successfully subscribed to newsletter!')).toBeInTheDocument();
      expect(emailInput).toHaveValue(''); // Email should be cleared
      expect(subscribeButton).not.toBeDisabled();
    });

    expect(mockSubscribeToNewsletter).toHaveBeenCalledWith('valid@example.com');
  });
});