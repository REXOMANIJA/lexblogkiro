import { describe, test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { BlogPostList } from './BlogPostList';
import { BlogPostDetail } from './BlogPostDetail';
import type { BlogPost } from '../types';

// Mock the services
vi.mock('../services/supabase');
vi.mock('../services/auth');

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Arbitrary generators for property-based testing
const arbitraryBlogPost = (): fc.Arbitrary<BlogPost> => {
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
    category_ids: fc.array(fc.uuid(), { maxLength: 3 }),
    created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    updated_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
  });
};

describe('Admin Controls Visibility Property Tests', () => {
  // Feature: personal-blog, Property 2: Admin controls are visible only when authenticated
  // Validates: Requirements 1.3, 2.2, 4.1, 5.1
  test('Property 2: Admin controls are visible only when authenticated in BlogPostList', async () => {
    const { fetchAllPosts } = await import('../services/supabase');
    const { useAuth } = await import('../contexts/AuthContext');
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryBlogPost(), { minLength: 1, maxLength: 3 }),
        fc.boolean(), // isAuthenticated
        async (posts, isAuthenticated) => {
          // Mock the fetchAllPosts to return our generated posts
          vi.mocked(fetchAllPosts).mockResolvedValueOnce(posts);

          // Mock the auth state
          vi.mocked(useAuth).mockReturnValue({
            isAuthenticated,
            isAdminMode: isAuthenticated,
            user: isAuthenticated ? { id: 'test-user' } as any : null,
            setUser: vi.fn(),
          });

          // Render the component wrapped in BrowserRouter
          const { container, unmount } = render(
            <BrowserRouter>
              <BlogPostList />
            </BrowserRouter>
          );

          // Wait for loading to complete and posts to render
          await waitFor(() => {
            const articles = container.querySelectorAll('article');
            expect(articles.length).toBe(posts.length);
          }, { timeout: 3000 });

          // Check for admin controls
          const adminControls = container.querySelectorAll('[data-testid="admin-controls"]');
          const editButtons = container.querySelectorAll('[data-testid="edit-button"]');
          const deleteButtons = container.querySelectorAll('[data-testid="delete-button"]');

          if (isAuthenticated) {
            // When authenticated, admin controls should be visible for each post
            expect(adminControls.length).toBe(posts.length);
            expect(editButtons.length).toBe(posts.length);
            expect(deleteButtons.length).toBe(posts.length);
          } else {
            // When not authenticated, no admin controls should be present
            expect(adminControls.length).toBe(0);
            expect(editButtons.length).toBe(0);
            expect(deleteButtons.length).toBe(0);
          }

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout for property test

  // Feature: personal-blog, Property 2: Admin controls are visible only when authenticated
  // Validates: Requirements 1.3, 2.2, 4.1, 5.1
  test('Property 2: Admin controls are visible only when authenticated in BlogPostDetail', async () => {
    const { useAuth } = await import('../contexts/AuthContext');
    
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPost(),
        fc.boolean(), // isAuthenticated
        async (post, isAuthenticated) => {
          // Mock the auth state
          vi.mocked(useAuth).mockReturnValue({
            isAuthenticated,
            isAdminMode: isAuthenticated,
            user: isAuthenticated ? { id: 'test-user' } as any : null,
            setUser: vi.fn(),
          });

          // Render the component wrapped in BrowserRouter
          const { container, unmount } = render(
            <BrowserRouter>
              <BlogPostDetail post={post} />
            </BrowserRouter>
          );

          // Wait for component to render
          await waitFor(() => {
            const title = container.querySelector('h1');
            expect(title?.textContent).toBe(post.title);
          }, { timeout: 3000 });

          // Check for admin controls
          const adminControls = container.querySelectorAll('[data-testid="admin-controls"]');
          const editButtons = container.querySelectorAll('[data-testid="edit-button"]');
          const deleteButtons = container.querySelectorAll('[data-testid="delete-button"]');

          if (isAuthenticated) {
            // When authenticated, admin controls should be visible
            expect(adminControls.length).toBe(1);
            expect(editButtons.length).toBe(1);
            expect(deleteButtons.length).toBe(1);
          } else {
            // When not authenticated, no admin controls should be present
            expect(adminControls.length).toBe(0);
            expect(editButtons.length).toBe(0);
            expect(deleteButtons.length).toBe(0);
          }

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout for property test
});
