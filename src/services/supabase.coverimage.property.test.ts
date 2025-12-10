import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { supabase, createPost, deletePost } from './supabase';
import type { CreatePostInput, BlogPost } from '../types';

// Test admin credentials
const TEST_ADMIN_EMAIL = process.env.VITE_TEST_ADMIN_EMAIL || 'admin@lexblog.com';
const TEST_ADMIN_PASSWORD = process.env.VITE_TEST_ADMIN_PASSWORD || 'admin123';

// Helper to authenticate as admin for tests
async function authenticateAdmin() {
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
  });
  
  if (error) {
    throw new Error(
      `Failed to authenticate test admin. Please create a user in Supabase Dashboard:\n` +
      `  1. Go to Authentication → Users\n` +
      `  2. Click "Add user" → "Create new user"\n` +
      `  3. Email: ${TEST_ADMIN_EMAIL}\n` +
      `  4. Password: ${TEST_ADMIN_PASSWORD}\n` +
      `  5. Disable "Auto Confirm User" if needed\n` +
      `Error: ${error.message}`
    );
  }
}

// Helper to clean up test data
async function cleanupTestPosts() {
  const { data: posts } = await supabase.from('posts').select('id, photo_urls');
  if (posts) {
    for (const post of posts) {
      // Clean up storage
      if (post.photo_urls && post.photo_urls.length > 0) {
        const filePaths = post.photo_urls.map((url: string) => {
          const parts = url.split('/blog-photos/');
          return parts[1];
        });
        await supabase.storage.from('blog-photos').remove(filePaths);
      }
    }
    // Delete all posts
    await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

describe('Cover Image Property Tests', () => {
  beforeAll(async () => {
    await authenticateAdmin();
  });

  beforeEach(async () => {
    await cleanupTestPosts();
  });

  afterAll(async () => {
    await cleanupTestPosts();
    await supabase.auth.signOut();
  });

  // Feature: personal-blog, Property 21: Cover image is positioned first
  // Validates: Requirements 11.2
  test('Property 21: Cover image is positioned first', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 2, max: 5 }), // Number of photos (at least 2 to test reordering)
        async (title, story, photoCount) => {
          // Create multiple photos with distinct content
          const photos = Array.from({ length: photoCount }, (_, i) =>
            new File([`test image content ${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
          );

          // Generate a random cover image index (not the first one to test reordering)
          const coverImageIndex = fc.sample(fc.integer({ min: 1, max: photoCount - 1 }), 1)[0];

          const postInput: CreatePostInput = {
            title,
            story,
            photos,
            cover_image_index: coverImageIndex,
          };

          let createdPost: BlogPost | null = null;

          try {
            // Create the post with a designated cover image
            createdPost = await createPost(postInput);

            // Verify the post was created
            expect(createdPost).toBeDefined();
            expect(createdPost.photo_urls.length).toBe(photoCount);

            // Property: The cover_image_url should match the first element in photo_urls array
            expect(createdPost.cover_image_url).toBe(createdPost.photo_urls[0]);

            // Additional verification: The cover image URL should be present in the photo_urls
            expect(createdPost.photo_urls).toContain(createdPost.cover_image_url);

            // Verify that the cover image is indeed at index 0
            const coverImageUrl = createdPost.cover_image_url;
            expect(coverImageUrl).toBeDefined();
            expect(coverImageUrl).not.toBeNull();
            
            const firstPhotoUrl = createdPost.photo_urls[0];
            expect(firstPhotoUrl).toBe(coverImageUrl);

            // Verify all photos are present (no photos were lost during reordering)
            expect(createdPost.photo_urls.length).toBe(photoCount);

            // Verify all photo URLs are valid
            for (const url of createdPost.photo_urls) {
              expect(url).toMatch(/^https?:\/\//);
            }

          } finally {
            // Cleanup
            if (createdPost) {
              try {
                await deletePost(createdPost.id);
              } catch (error) {
                console.error(`Failed to cleanup post ${createdPost.id}:`, error);
              }
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});
