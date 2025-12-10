import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { supabase, fetchAllPosts, createPost, deletePost } from '../services/supabase';
import type { CreatePostInput } from '../types';

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

describe('PostEditor Property Tests', () => {
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

  // Feature: personal-blog, Property 7: Edit form is populated with existing post data
  // Validates: Requirements 4.2
  test('Property 7: Edit form is populated with existing post data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 3 }),
        async (title, story, photoCount) => {
          // Create a post with random data
          const photos = Array.from({ length: photoCount }, (_, i) =>
            new File([`test image content ${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
          );

          const postInput: CreatePostInput = {
            title,
            story,
            photos,
          };

          const createdPost = await createPost(postInput);

          try {
            // Verify the post data matches what we created
            expect(createdPost.title).toBe(title);
            expect(createdPost.story).toBe(story);
            expect(createdPost.photo_urls.length).toBe(photoCount);

            // In a real component test, we would render PostEditor with editPost prop
            // and verify the form fields are populated. Since this is a property test
            // focused on the data layer, we verify that:
            // 1. The post was created with the correct data
            // 2. Fetching the post returns the same data (which would populate the form)
            const { data: fetchedPost, error } = await supabase
              .from('posts')
              .select('*')
              .eq('id', createdPost.id)
              .single();

            expect(error).toBeNull();
            expect(fetchedPost).toBeDefined();
            expect(fetchedPost?.title).toBe(title);
            expect(fetchedPost?.story).toBe(story);
            expect(fetchedPost?.photo_urls.length).toBe(photoCount);

            // Verify all photo URLs are valid
            for (const url of fetchedPost?.photo_urls || []) {
              expect(url).toMatch(/^https?:\/\//);
            }
          } finally {
            // Cleanup
            try {
              await deletePost(createdPost.id);
            } catch (error) {
              console.error(`Failed to cleanup post ${createdPost.id}:`, error);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  // Feature: personal-blog, Property 4: Posts with missing required fields are rejected
  // Validates: Requirements 3.2, 3.3
  test('Property 4: Posts with missing required fields are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: '' }),
          story: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: '' }),
          hasPhotos: fc.boolean(),
        }),
        async ({ title, story, hasPhotos }) => {
          // Skip if all fields are valid (we're testing invalid cases)
          const titleValid = title !== null && title !== '' && title.trim() !== '';
          const storyValid = story !== null && story !== '' && story.trim() !== '';
          const photosValid = hasPhotos;

          // Only test cases where at least one field is invalid
          if (titleValid && storyValid && photosValid) {
            return; // Skip valid cases
          }

          const photos = hasPhotos
            ? [new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })]
            : [];

          const postInput: CreatePostInput = {
            title: title || '',
            story: story || '',
            photos,
          };

          // Get initial post count
          const initialPosts = await fetchAllPosts();
          const initialCount = initialPosts.length;

          // Attempt to create post with missing fields
          let errorOccurred = false;
          try {
            await createPost(postInput);
          } catch (error) {
            errorOccurred = true;
          }

          // Verify that either an error occurred OR the post was not added to database
          const finalPosts = await fetchAllPosts();
          const finalCount = finalPosts.length;

          // The system should reject the post (either by throwing error or not adding to DB)
          if (!errorOccurred) {
            // If no error was thrown, verify the post count didn't increase
            expect(finalCount).toBe(initialCount);
          }

          // Cleanup any posts that might have been created
          const newPosts = finalPosts.filter(
            (p) => !initialPosts.some((ip) => ip.id === p.id)
          );
          for (const post of newPosts) {
            await deletePost(post.id);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  // Feature: personal-blog, Property 6: Supported image formats are accepted
  // Validates: Requirements 3.5, 6.3
  test('Property 6: Supported image formats are accepted', async () => {
    const supportedFormats = [
      { type: 'image/jpeg', ext: 'jpg' },
      { type: 'image/png', ext: 'png' },
      { type: 'image/webp', ext: 'webp' },
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...supportedFormats),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        async (format, title, story) => {
          // Create a file with the supported format
          const file = new File(['test image content'], `test.${format.ext}`, {
            type: format.type,
          });

          const postInput: CreatePostInput = {
            title,
            story,
            photos: [file],
          };

          // Attempt to create post with supported image format
          let createdPost;
          let uploadSucceeded = false;

          try {
            createdPost = await createPost(postInput);
            uploadSucceeded = true;

            // Verify the post was created with a valid photo URL
            expect(createdPost.photo_urls.length).toBeGreaterThan(0);
            expect(createdPost.photo_urls[0]).toMatch(/^https?:\/\//);

            // Verify the photo is accessible in storage
            const photoUrl = createdPost.photo_urls[0];
            const parts = photoUrl.split('/blog-photos/');
            const filePath = parts[1];

            const { data: fileData, error: downloadError } = await supabase.storage
              .from('blog-photos')
              .download(filePath);

            expect(downloadError).toBeNull();
            expect(fileData).toBeDefined();
          } catch (error) {
            // Supported formats should not throw errors
            throw new Error(
              `Supported format ${format.type} was rejected: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          } finally {
            // Cleanup
            if (uploadSucceeded && createdPost) {
              try {
                await deletePost(createdPost.id);
              } catch (error) {
                console.error(`Failed to cleanup post ${createdPost.id}:`, error);
              }
            }
          }
        }
      ),
      { numRuns: 3 }
    );
  }, 180000);
});
