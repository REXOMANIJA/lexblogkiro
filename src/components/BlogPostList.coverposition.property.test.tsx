import { describe, test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { BlogPostListPaginated } from './BlogPostListPaginated';
import type { BlogPost, CoverImagePosition } from '../types';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ isAdminMode: false }),
}));

// Mock the supabase service
vi.mock('../services/supabase', () => ({
  fetchPaginatedPosts: vi.fn(),
  fetchAllCategories: vi.fn().mockResolvedValue([]),
  deletePost: vi.fn(),
}));

// Arbitrary for CoverImagePosition
const arbitraryCoverImagePosition = (): fc.Arbitrary<CoverImagePosition> =>
  fc.record({
    x: fc.integer({ min: 0, max: 100 }),
    y: fc.integer({ min: 0, max: 100 }),
    zoom: fc.integer({ min: 50, max: 200 }),
  });

// Arbitrary for BlogPost with cover image
const arbitraryBlogPostWithCover = (): fc.Arbitrary<BlogPost> =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    story: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    photo_urls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
    cover_image_url: fc.webUrl(),
    cover_image_position: arbitraryCoverImagePosition(),
    category_ids: fc.array(fc.uuid(), { maxLength: 3 }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

describe('Cover Image Positioning Property Tests', () => {
  // Feature: personal-blog, Property 22: Cover image positioning is applied
  // Validates: Requirements 11.4
  test('Property 22: Cover image positioning is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPostWithCover(),
        async (post) => {
          // Mock the fetchPaginatedPosts to return our test post
          const { fetchPaginatedPosts } = await import('../services/supabase');
          vi.mocked(fetchPaginatedPosts).mockResolvedValueOnce({
            posts: [post],
            hasMore: false,
            total: 1,
          });

          // Render the component
          const { container } = render(
            <BrowserRouter>
              <BlogPostListPaginated />
            </BrowserRouter>
          );

          // Wait for the component to load and render the image
          await waitFor(() => {
            const img = container.querySelector('img');
            expect(img).toBeTruthy();
          }, { timeout: 1000 });
          
          // Get the cover image element
          const coverImage = container.querySelector('img') as HTMLImageElement;
          
          // Verify the image exists
          expect(coverImage).toBeTruthy();
          if (!coverImage) return; // Type guard

          if (post.cover_image_position) {
            // Get the inline style
            const style = coverImage.style;

            // Property: The rendered cover image should apply CSS transforms that reflect the x, y, and zoom values
            // According to the CoverImageEditor, the positioning should be applied with:
            // - left: x%
            // - top: y%
            // - width/height: zoom%
            // - transform: translate(-50%, -50%) for centering
            
            const hasPositioning = 
              style.left !== '' || 
              style.top !== '' || 
              style.transform !== '' ||
              style.width !== '' ||
              style.height !== '';

            // The property states that positioning SHOULD be applied
            // If it's not applied, the test should fail to indicate the feature is missing
            expect(hasPositioning).toBe(true);

            // If positioning is applied, verify it matches the position data
            if (hasPositioning) {
              // Check for left positioning (should be x%)
              if (style.left) {
                expect(style.left).toBe(`${post.cover_image_position.x}%`);
              }
              
              // Check for top positioning (should be y%)
              if (style.top) {
                expect(style.top).toBe(`${post.cover_image_position.y}%`);
              }

              // Check for zoom (should affect width and/or height)
              if (style.width || style.height) {
                const expectedSize = `${post.cover_image_position.zoom}%`;
                expect(style.width === expectedSize || style.height === expectedSize).toBe(true);
              }

              // Check for transform translate (centering)
              if (style.transform) {
                expect(style.transform).toContain('translate');
              }
            }
          }
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 15000);
});
