import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NewsletterManagementPage } from './NewsletterManagementPage';
import type { NewsletterSubscriber } from '../types';

// Mock the services
vi.mock('../services/newsletter');
vi.mock('../contexts/AuthContext');

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NewsletterManagementPage', () => {
  const mockSubscribers: NewsletterSubscriber[] = [
    {
      id: '1',
      email: 'user1@example.com',
      subscribed_at: '2024-01-01T00:00:00Z',
      is_active: true,
    },
    {
      id: '2',
      email: 'user2@test.org',
      subscribed_at: '2024-01-02T00:00:00Z',
      is_active: true,
    },
    {
      id: '3',
      email: 'user3@domain.net',
      subscribed_at: '2024-01-03T00:00:00Z',
      is_active: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test subscriber count display - Requirements: 4.4
  test('displays subscriber count correctly', async () => {
    const { getSubscriberCount } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock subscriber count
    vi.mocked(getSubscriberCount).mockResolvedValue(42);

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete and count to display
    await waitFor(() => {
      const countElement = screen.getByTestId('subscriber-count');
      expect(countElement).toHaveTextContent('42');
    });

    expect(getSubscriberCount).toHaveBeenCalledOnce();
  });

  // Test subscriber count display with zero subscribers - Requirements: 4.4
  test('displays zero subscriber count correctly', async () => {
    const { getSubscriberCount } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock zero subscribers
    vi.mocked(getSubscriberCount).mockResolvedValue(0);

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete and count to display
    await waitFor(() => {
      const countElement = screen.getByTestId('subscriber-count');
      expect(countElement).toHaveTextContent('0');
    });
  });

  // Test subscriber list functionality - Requirements: 4.4
  test('loads and displays subscriber list when view button is clicked', async () => {
    const { getSubscriberCount, getActiveSubscribers } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock services
    vi.mocked(getSubscriberCount).mockResolvedValue(3);
    vi.mocked(getActiveSubscribers).mockResolvedValue(mockSubscribers);

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('3');
    });

    // Click view subscribers button
    const viewButton = screen.getByTestId('view-subscribers-button');
    fireEvent.click(viewButton);

    // Wait for subscriber list to load
    await waitFor(() => {
      const subscriberList = screen.getByTestId('subscriber-list');
      expect(subscriberList).toBeInTheDocument();
    });

    // Check that subscribers are displayed with masked emails
    expect(screen.getByText('us***@example.com')).toBeInTheDocument();
    expect(screen.getByText('us***@test.org')).toBeInTheDocument();
    expect(screen.getByText('us***@domain.net')).toBeInTheDocument();

    // Check subscription dates are displayed
    expect(screen.getByText('Subscribed: 1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('Subscribed: 1/2/2024')).toBeInTheDocument();
    expect(screen.getByText('Subscribed: 1/3/2024')).toBeInTheDocument();

    // Check active/inactive status
    const activeStatuses = screen.getAllByText('Active');
    const inactiveStatuses = screen.getAllByText('Inactive');
    expect(activeStatuses).toHaveLength(2);
    expect(inactiveStatuses).toHaveLength(1);

    expect(getActiveSubscribers).toHaveBeenCalledOnce();
  });

  // Test export functionality - Requirements: 4.4
  test('export button appears after loading subscriber list', async () => {
    const { getSubscriberCount, getActiveSubscribers } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock services
    vi.mocked(getSubscriberCount).mockResolvedValue(2);
    vi.mocked(getActiveSubscribers).mockResolvedValue(mockSubscribers.slice(0, 2));

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('2');
    });

    // Initially, export button should not be visible
    expect(screen.queryByTestId('export-subscribers-button')).not.toBeInTheDocument();

    // Click view subscribers button
    const viewButton = screen.getByTestId('view-subscribers-button');
    fireEvent.click(viewButton);

    // Wait for subscriber list to load and export button to appear
    await waitFor(() => {
      expect(screen.getByTestId('export-subscribers-button')).toBeInTheDocument();
    });

    // Verify subscriber list is also present
    expect(screen.getByTestId('subscriber-list')).toBeInTheDocument();
  });

  // Test export functionality with empty list - Requirements: 4.4
  test('export button does not appear when subscriber list is empty', async () => {
    const { getSubscriberCount, getActiveSubscribers } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock services with empty list
    vi.mocked(getSubscriberCount).mockResolvedValue(0);
    vi.mocked(getActiveSubscribers).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('0');
    });

    // Click view subscribers button
    const viewButton = screen.getByTestId('view-subscribers-button');
    fireEvent.click(viewButton);

    // Wait for the subscriber list section to appear (even if empty)
    await waitFor(() => {
      expect(screen.getByText('Subscriber List (0)')).toBeInTheDocument();
    });

    // Check for empty message
    expect(screen.getByText('No active subscribers found.')).toBeInTheDocument();

    // Export button should not appear for empty list
    expect(screen.queryByTestId('export-subscribers-button')).not.toBeInTheDocument();
  });

  // Test error handling - Requirements: 4.4
  test('displays error message when subscriber count fails to load', async () => {
    const { getSubscriberCount } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock service error
    vi.mocked(getSubscriberCount).mockRejectedValue(new Error('Database connection failed'));

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });

  // Test error handling for subscriber list - Requirements: 4.4
  test('displays error message when subscriber list fails to load', async () => {
    const { getSubscriberCount, getActiveSubscribers } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock services
    vi.mocked(getSubscriberCount).mockResolvedValue(5);
    vi.mocked(getActiveSubscribers).mockRejectedValue(new Error('Failed to fetch subscribers'));

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('5');
    });

    // Click view subscribers button
    const viewButton = screen.getByTestId('view-subscribers-button');
    fireEvent.click(viewButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch subscribers')).toBeInTheDocument();
    });
  });

  // Test admin access control - Requirements: 4.4
  test('redirects non-admin users to home page', async () => {
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock non-admin user
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isAdminMode: false,
      user: null,
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Should redirect to home
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // Test loading states - Requirements: 4.4
  test('shows loading state while fetching subscriber count', async () => {
    const { getSubscriberCount } = await import('../services/newsletter');
    const { useAuth } = await import('../contexts/AuthContext');

    // Mock admin authentication
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'admin-user' } as any,
      setUser: vi.fn(),
    });

    // Mock slow loading
    vi.mocked(getSubscriberCount).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(10), 100))
    );

    render(
      <BrowserRouter>
        <NewsletterManagementPage />
      </BrowserRouter>
    );

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('10');
    });
  });
});