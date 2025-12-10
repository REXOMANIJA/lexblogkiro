import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { BlogPostDetail } from './BlogPostDetail';
import type { BlogPost, Category } from '../types';

// Mock the supabase service
vi.mock('../services/supabase', () => ({
  fetchAllCategories: vi.fn(),
  deletePost: vi.fn(),
}));

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isAdminMode: false,
    user: null,
    setUser: vi.fn(),
  })),
}));

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Arbitrary generators for property-based testing
const arbitraryCategory = (): fc.Arbitrary<Category> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    slug: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
    color: fc.constantFrom('#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'),
    created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
  });
};

const arbitraryBlogPostWithCategories = (categories: Category[]): fc.Arbitrary<BlogPost> => {
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    story: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0),
    photo_urls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
    cover_image_url: fc.oneof(fc.webUrl(), fc.constant(null)),
    cover_image_position: fc.record({
      x: fc.integer({ min: 0, max: 100 }),
      y: fc.integer({ min: 0, max: 100 }),
      zoom: fc.integer({ min: 50, max: 200 }),
    }),
    // Assign 1-3 random categories from the available categories
    category_ids: fc.shuffledSubarray(categories.map(c => c.id), { minLength: 1, maxLength: Math.min(3, categories.length) }),
    created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    updated_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
  });
};

describe('BlogPostDetail Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: personal-blog, Property 20: Assigned categories are displayed on posts
  // Validates: Requirements 10.4
  test('Property 20: Assigned categories are displayed on posts', async () => {
    const { fetchAllCategories } = await import('../services/supabase');
    const { waitFor } = await import('@testing-library/react');
    
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-5 categories
        fc.array(arbitraryCategory(), { minLength: 1, maxLength: 5 }),
        async (categories) => {
          // Mock fetchAllCategories to return our generated categories
          vi.mocked(fetchAllCategories).mockResolvedValueOnce(categories);

          // Generate a post with some of these categories assigned
          const postArbitrary = arbitraryBlogPostWithCategories(categories);
          const post = fc.sample(postArbitrary, 1)[0];

          // Render the component wrapped in BrowserRouter
          const { container, unmount } = render(
            <BrowserRouter>
              <BlogPostDetail post={post} />
            </BrowserRouter>
          );

          // Get the category names that should be displayed
          const assignedCategories = categories.filter(c => post.category_ids.includes(c.id));

          // Wait for categories to be loaded and rendered
          await waitFor(() => {
            const categoryElements = container.querySelectorAll('[data-testid="category-chip"]');
            expect(categoryElements.length).toBeGreaterThan(0);
          }, { timeout: 3000 });

          // Verify that ALL assigned category names are present in the rendered output
          for (const category of assignedCategories) {
            const categoryNameInDom = container.textContent?.includes(category.name);
            expect(categoryNameInDom).toBe(true);
          }

          // Verify that the correct number of category chips are rendered
          const categoryElements = container.querySelectorAll('[data-testid="category-chip"]');
          expect(categoryElements.length).toBe(assignedCategories.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout for property test
});
