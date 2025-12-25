import { describe, test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { BlogPostList } from './BlogPostList';
import type { BlogPost } from '../types';

// Mock the supabase service
vi.mock('../services/supabase');

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isAdminMode: false,
    user: null,
    setUser: vi.fn(),
  })),
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

describe('BlogPostList Property Tests', () => {
  // Feature: personal-blog, Property 3: All post content is rendered
  // Validates: Requirements 1.2, 1.4
  test('Property 3: All post content is rendered', async () => {
    const { fetchAllPosts } = await import('../services/supabase');
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryBlogPost(), { minLength: 1, maxLength: 3 }),
        async (posts) => {
          // Mock the fetchAllPosts to return our generated posts
          vi.mocked(fetchAllPosts).mockResolvedValueOnce(posts);

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

          // For each post, verify all content is rendered
          for (const post of posts) {
            // Title should be present in the DOM
            const titleInDom = container.textContent?.includes(post.title);
            expect(titleInDom).toBe(true);

            // Story text should be present (at least part of it as excerpt)
            const storyStart = post.story.substring(0, 50).trim();
            const storyInDom = container.textContent?.includes(storyStart);
            expect(storyInDom).toBe(true);

            // First photo URL should be present in an img element
            const images = container.querySelectorAll('img');
            const hasFirstPhoto = Array.from(images).some(
              img => img.getAttribute('src') === post.photo_urls[0]
            );
            expect(hasFirstPhoto).toBe(true);
          }

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout for property test

  // Feature: personal-blog, Property 12: Layout adapts to screen size
  // Validates: Requirements 7.4
  test('Property 12: Layout adapts to screen size', async () => {
    const { fetchAllPosts } = await import('../services/supabase');
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryBlogPost(), { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 320, max: 1920 }), // viewport width
        async (posts, viewportWidth) => {
          // Mock the fetchAllPosts to return our generated posts
          vi.mocked(fetchAllPosts).mockResolvedValueOnce(posts);

          // Set viewport width
          global.innerWidth = viewportWidth;

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

          // Check that the grid container exists
          const gridContainer = container.querySelector('.grid');
          expect(gridContainer).toBeTruthy();

          // Verify no horizontal overflow
          const containerElement = container.firstChild as HTMLElement;
          if (containerElement) {
            // The component should not cause horizontal overflow
            // We check that the grid has proper responsive classes
            const hasResponsiveClasses = 
              gridContainer?.classList.contains('grid-cols-1') ||
              gridContainer?.classList.contains('md:grid-cols-2') ||
              gridContainer?.classList.contains('lg:grid-cols-3');
            expect(hasResponsiveClasses).toBe(true);
          }

          // Verify all images have proper responsive classes
          const images = container.querySelectorAll('img');
          images.forEach(img => {
            const hasResponsiveImageClasses = 
              img.classList.contains('w-full') &&
              img.classList.contains('h-full') &&
              img.classList.contains('object-cover');
            expect(hasResponsiveImageClasses).toBe(true);
          });

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout for property test
});
