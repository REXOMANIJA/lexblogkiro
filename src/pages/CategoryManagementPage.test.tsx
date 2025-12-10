import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CategoryManagementPage } from './CategoryManagementPage';
import type { Category } from '../types';

// Mock the services
vi.mock('../services/supabase', () => ({
  fetchAllCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('CategoryManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders category management page when admin is authenticated', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    const { fetchAllCategories } = await import('../services/supabase');

    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Travel',
        slug: 'travel',
        color: '#3B82F6',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Food',
        slug: 'food',
        color: '#10B981',
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isAdminMode: true,
      user: { id: 'test-user' } as any,
      setUser: vi.fn(),
    });

    vi.mocked(fetchAllCategories).mockResolvedValue(mockCategories);

    render(
      <BrowserRouter>
        <CategoryManagementPage />
      </BrowserRouter>
    );

    // Check that the page title is rendered
    expect(screen.getByText('Category Management')).toBeDefined();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Travel')).toBeDefined();
      expect(screen.getByText('Food')).toBeDefined();
    });

    // Check that the create button is present
    expect(screen.getByText('Create New Category')).toBeDefined();
  });

  test('redirects when not in admin mode', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    const { fetchAllCategories } = await import('../services/supabase');

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isAdminMode: false,
      user: null,
      setUser: vi.fn(),
    });

    vi.mocked(fetchAllCategories).mockResolvedValue([]);

    const { container } = render(
      <BrowserRouter>
        <CategoryManagementPage />
      </BrowserRouter>
    );

    // Should render nothing when not admin
    expect(container.textContent).toBe('');
  });
});
