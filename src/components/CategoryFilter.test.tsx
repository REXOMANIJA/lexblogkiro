import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CategoryFilter } from './CategoryFilter';
import * as supabaseService from '../services/supabase';
import type { Category, BlogPost } from '../types';

// Mock the supabase service
vi.mock('../services/supabase', () => ({
  fetchAllCategories: vi.fn(),
  fetchAllPosts: vi.fn(),
}));

describe('CategoryFilter', () => {
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Travel',
      slug: 'travel',
      color: '#3B82F6',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Food',
      slug: 'food',
      color: '#10B981',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockPosts: BlogPost[] = [
    {
      id: 'post1',
      title: 'Post 1',
      story: 'Story 1',
      photo_urls: ['url1'],
      cover_image_url: 'url1',
      cover_image_position: { x: 50, y: 50, zoom: 100 },
      category_ids: ['1'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'post2',
      title: 'Post 2',
      story: 'Story 2',
      photo_urls: ['url2'],
      cover_image_url: 'url2',
      cover_image_position: { x: 50, y: 50, zoom: 100 },
      category_ids: ['1', '2'],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockOnCategoryToggle = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseService.fetchAllCategories).mockResolvedValue(mockCategories);
    vi.mocked(supabaseService.fetchAllPosts).mockResolvedValue(mockPosts);
  });

  it('renders category filter chips with post counts', async () => {
    render(
      <CategoryFilter
        selectedCategoryIds={[]}
        onCategoryToggle={mockOnCategoryToggle}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    expect(screen.getByText('Food')).toBeInTheDocument();
    
    // Check post counts (Travel: 2 posts, Food: 1 post)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows clear filters button when categories are selected', async () => {
    render(
      <CategoryFilter
        selectedCategoryIds={['1']}
        onCategoryToggle={mockOnCategoryToggle}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });
  });

  it('does not show clear filters button when no categories are selected', async () => {
    render(
      <CategoryFilter
        selectedCategoryIds={[]}
        onCategoryToggle={mockOnCategoryToggle}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('shows active filter summary when categories are selected', async () => {
    render(
      <CategoryFilter
        selectedCategoryIds={['1', '2']}
        onCategoryToggle={mockOnCategoryToggle}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Showing posts in 2 categories/)).toBeInTheDocument();
    });
  });

  it('renders nothing when no categories exist', async () => {
    vi.mocked(supabaseService.fetchAllCategories).mockResolvedValue([]);
    
    const { container } = render(
      <CategoryFilter
        selectedCategoryIds={[]}
        onCategoryToggle={mockOnCategoryToggle}
        onClearFilters={mockOnClearFilters}
      />
    );

    await waitFor(() => {
      expect(supabaseService.fetchAllCategories).toHaveBeenCalled();
    });

    expect(container.firstChild).toBeNull();
  });
});
