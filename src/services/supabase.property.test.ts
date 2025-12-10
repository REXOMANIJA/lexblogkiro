import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { supabase, fetchAllPosts, createPost, updatePost, deletePost } from './supabase';
import type { BlogPost, CreatePostInput } from '../types';

// Test admin credentials - set these in your environment or .env.test file
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

// Arbitrary for generating test blog posts
const arbitraryBlogPost = (): fc.Arbitrary<CreatePostInput> => {
  return fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    story: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
    photos: fc.constant([
      new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
    ])
  });
};

describe('Supabase Service Property Tests', () => {
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

  // Feature: personal-blog, Property 1: Posts are sorted in reverse chronological order
  // Validates: Requirements 1.1, 6.2
  test('Property 1: Posts are sorted in reverse chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryBlogPost(), { minLength: 2, maxLength: 3 }),
        async (postInputs) => {
          // Create posts with small delays to ensure different timestamps
          const createdPosts: BlogPost[] = [];
          for (const input of postInputs) {
            const post = await createPost(input);
            createdPosts.push(post);
            // Small delay to ensure different created_at timestamps
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Fetch all posts
          const fetchedPosts = await fetchAllPosts();

          // Verify they are sorted by created_at descending (newest first)
          for (let i = 0; i < fetchedPosts.length - 1; i++) {
            const currentDate = new Date(fetchedPosts[i].created_at);
            const nextDate = new Date(fetchedPosts[i + 1].created_at);
            expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
          }

          // Cleanup - do it sequentially to avoid overwhelming the API
          for (const post of createdPosts) {
            try {
              await deletePost(post.id);
            } catch (error) {
              console.error(`Failed to cleanup post ${post.id}:`, error);
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced runs due to async operations
    );
  }, 120000); // 120 second timeout for async operations

  // Feature: personal-blog, Property 5: Created posts appear in the feed
  // Validates: Requirements 3.4, 6.1
  test('Property 5: Created posts appear in the feed', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPost(),
        async (postInput) => {
          // Create a post
          const createdPost = await createPost(postInput);

          // Fetch all posts
          const fetchedPosts = await fetchAllPosts();

          // Verify the created post appears in the feed with matching content
          const foundPost = fetchedPosts.find(p => p.id === createdPost.id);
          expect(foundPost).toBeDefined();
          expect(foundPost?.title).toBe(postInput.title);
          expect(foundPost?.story).toBe(postInput.story);
          expect(foundPost?.photo_urls.length).toBeGreaterThan(0);

          // Cleanup
          try {
            await deletePost(createdPost.id);
          } catch (error) {
            console.error(`Failed to cleanup post ${createdPost.id}:`, error);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  // Feature: personal-blog, Property 8: Post updates are persisted
  // Validates: Requirements 4.4, 4.5, 6.4
  test('Property 8: Post updates are persisted', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPost(),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          story: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        }),
        async (originalInput, updateData) => {
          // Create a post
          const createdPost = await createPost(originalInput);

          // Update the post
          await updatePost({
            id: createdPost.id,
            title: updateData.title,
            story: updateData.story,
            photo_urls: createdPost.photo_urls, // Keep existing photos
          });

          // Fetch the post to verify persistence
          const fetchedPosts = await fetchAllPosts();
          const foundPost = fetchedPosts.find(p => p.id === createdPost.id);

          // Verify the updated content is persisted, not the original
          expect(foundPost?.title).toBe(updateData.title);
          expect(foundPost?.story).toBe(updateData.story);
          expect(foundPost?.title).not.toBe(originalInput.title);
          expect(foundPost?.story).not.toBe(originalInput.story);

          // Cleanup
          try {
            await deletePost(createdPost.id);
          } catch (error) {
            console.error(`Failed to cleanup post ${createdPost.id}:`, error);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  // Feature: personal-blog, Property 9: Deleted posts are removed from the feed
  // Validates: Requirements 5.3, 5.4
  test('Property 9: Deleted posts are removed from the feed', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPost(),
        async (postInput) => {
          // Create a post
          const createdPost = await createPost(postInput);

          // Verify it exists
          let fetchedPosts = await fetchAllPosts();
          let foundPost = fetchedPosts.find(p => p.id === createdPost.id);
          expect(foundPost).toBeDefined();

          // Delete the post
          await deletePost(createdPost.id);

          // Verify it no longer appears in the feed
          fetchedPosts = await fetchAllPosts();
          foundPost = fetchedPosts.find(p => p.id === createdPost.id);
          expect(foundPost).toBeUndefined();
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  // Feature: personal-blog, Property 10: Deletion removes both database record and storage files
  // Validates: Requirements 6.5
  test('Property 10: Deletion removes both database record and storage files', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPost(),
        async (postInput) => {
          // Create a post with photos
          const createdPost = await createPost(postInput);
          const photoUrls = createdPost.photo_urls;

          // Verify photos exist in storage
          for (const url of photoUrls) {
            const parts = url.split('/blog-photos/');
            const filePath = parts[1];
            const { data: fileData, error: fileError } = await supabase.storage
              .from('blog-photos')
              .download(filePath);
            expect(fileError).toBeNull();
            expect(fileData).toBeDefined();
          }

          // Delete the post
          await deletePost(createdPost.id);

          // Verify database record is removed
          const fetchedPosts = await fetchAllPosts();
          const foundPost = fetchedPosts.find(p => p.id === createdPost.id);
          expect(foundPost).toBeUndefined();

          // Verify storage files are removed
          for (const url of photoUrls) {
            const parts = url.split('/blog-photos/');
            const filePath = parts[1];
            const { error: fileError } = await supabase.storage
              .from('blog-photos')
              .download(filePath);
            expect(fileError).toBeDefined(); // Should error because file doesn't exist
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  // Feature: personal-blog, Property 11: Failed deletion preserves post state
  // Validates: Requirements 5.5
  test('Property 11: Failed deletion preserves post state', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogPost(),
        async (postInput) => {
          // Create a post
          const createdPost = await createPost(postInput);
          const originalTitle = createdPost.title;
          const originalStory = createdPost.story;
          const originalPhotoUrls = [...createdPost.photo_urls];

          // Attempt to delete with an invalid/non-existent post ID
          // This simulates a deletion failure scenario
          // Use a UUID that doesn't exist but won't trigger retries
          const fakePostId = '00000000-0000-0000-0000-000000000001';
          
          let deletionFailed = false;
          try {
            await deletePost(fakePostId);
          } catch (error) {
            // Expected to fail - deletion should throw an error
            deletionFailed = true;
            expect(error).toBeDefined();
          }

          // Verify deletion failed
          expect(deletionFailed).toBe(true);

          // Verify the original post still exists with unchanged content
          const fetchedPosts = await fetchAllPosts();
          const foundPost = fetchedPosts.find(p => p.id === createdPost.id);
          
          expect(foundPost).toBeDefined();
          expect(foundPost?.title).toBe(originalTitle);
          expect(foundPost?.story).toBe(originalStory);
          expect(foundPost?.photo_urls).toEqual(originalPhotoUrls);

          // Verify photos still exist in storage
          for (const url of originalPhotoUrls) {
            const parts = url.split('/blog-photos/');
            const filePath = parts[1];
            const { data: fileData, error: fileError } = await supabase.storage
              .from('blog-photos')
              .download(filePath);
            expect(fileError).toBeNull();
            expect(fileData).toBeDefined();
          }

          // Cleanup
          try {
            await deletePost(createdPost.id);
          } catch (error) {
            console.error(`Failed to cleanup post ${createdPost.id}:`, error);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000);

  // Feature: personal-blog, Property 16: Category filter shows only matching posts
  // Validates: Requirements 9.2
  test('Property 16: Category filter shows only matching posts', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a category
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          slug: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          color: fc.constantFrom('#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'),
        }),
        // Generate posts with various category assignments
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            story: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            photos: fc.constant([
              new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
            ]),
            // Some posts will have the category, some won't
            hasTargetCategory: fc.boolean(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (categoryInput, postInputs) => {
          // Create the category
          const category = await supabase
            .from('categories')
            .insert(categoryInput)
            .select()
            .single();

          if (category.error || !category.data) {
            throw new Error(`Failed to create test category: ${category.error?.message}`);
          }

          const createdCategory = category.data;
          const createdPosts: BlogPost[] = [];

          try {
            // Create posts with or without the target category
            for (const postInput of postInputs) {
              const categoryIds = postInput.hasTargetCategory ? [createdCategory.id] : [];
              
              const post = await createPost({
                title: postInput.title,
                story: postInput.story,
                photos: [...postInput.photos],
                category_ids: categoryIds,
              });
              
              createdPosts.push(post);
              
              // Small delay to ensure different timestamps
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Fetch posts filtered by the category
            const { data: filteredPosts, error: fetchError } = await supabase
              .from('posts')
              .select('*')
              .contains('category_ids', [createdCategory.id])
              .order('created_at', { ascending: false });

            if (fetchError) {
              throw new Error(`Failed to fetch filtered posts: ${fetchError.message}`);
            }

            // Verify that ALL returned posts contain the target category
            for (const post of filteredPosts || []) {
              expect(post.category_ids).toContain(createdCategory.id);
            }

            // Verify that ALL posts with the target category are returned
            const expectedPostIds = createdPosts
              .filter(p => p.category_ids.includes(createdCategory.id))
              .map(p => p.id)
              .sort();

            const actualPostIds = (filteredPosts || [])
              .map(p => p.id)
              .sort();

            expect(actualPostIds).toEqual(expectedPostIds);

            // Verify that posts WITHOUT the category are NOT returned
            const postsWithoutCategory = createdPosts.filter(
              p => !p.category_ids.includes(createdCategory.id)
            );

            for (const post of postsWithoutCategory) {
              const foundInFiltered = (filteredPosts || []).find(p => p.id === post.id);
              expect(foundInFiltered).toBeUndefined();
            }

          } finally {
            // Cleanup: delete all created posts
            for (const post of createdPosts) {
              try {
                await deletePost(post.id);
              } catch (error) {
                console.error(`Failed to cleanup post ${post.id}:`, error);
              }
            }

            // Cleanup: delete the category
            try {
              await supabase
                .from('categories')
                .delete()
                .eq('id', createdCategory.id);
            } catch (error) {
              console.error(`Failed to cleanup category ${createdCategory.id}:`, error);
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 180000); // 180 second timeout for async operations with multiple posts

  // Feature: personal-blog, Property 17: Clearing filters returns all posts
  // Validates: Requirements 9.3
  test('Property 17: Clearing filters returns all posts', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple categories
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            slug: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            color: fc.constantFrom('#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        // Generate posts with various category assignments
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            story: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            photos: fc.constant([
              new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
            ]),
            // Each post will be assigned to 0 or more categories (determined later)
            categoryIndices: fc.array(fc.nat(), { maxLength: 3 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (categoryInputs, postInputs) => {
          const createdCategories: any[] = [];
          const createdPosts: BlogPost[] = [];

          try {
            // Create categories
            for (const categoryInput of categoryInputs) {
              const category = await supabase
                .from('categories')
                .insert(categoryInput)
                .select()
                .single();

              if (category.error || !category.data) {
                throw new Error(`Failed to create test category: ${category.error?.message}`);
              }

              createdCategories.push(category.data);
            }

            // Create posts with various category assignments
            for (const postInput of postInputs) {
              // Map category indices to actual category IDs
              const categoryIds = postInput.categoryIndices
                .filter(idx => idx < createdCategories.length)
                .map(idx => createdCategories[idx].id)
                // Remove duplicates
                .filter((id, index, self) => self.indexOf(id) === index);
              
              const post = await createPost({
                title: postInput.title,
                story: postInput.story,
                photos: [...postInput.photos],
                category_ids: categoryIds,
              });
              
              createdPosts.push(post);
              
              // Small delay to ensure different timestamps
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // First, apply a category filter (if we have categories)
            if (createdCategories.length > 0) {
              const filterCategoryId = createdCategories[0].id;
              
              const { data: filteredPosts, error: filterError } = await supabase
                .from('posts')
                .select('*')
                .contains('category_ids', [filterCategoryId])
                .order('created_at', { ascending: false });

              if (filterError) {
                throw new Error(`Failed to fetch filtered posts: ${filterError.message}`);
              }

              // Verify that filtering works (should return fewer posts than total)
              const postsWithCategory = createdPosts.filter(p => 
                p.category_ids.includes(filterCategoryId)
              );
              
              expect(filteredPosts?.length).toBe(postsWithCategory.length);
            }

            // Now clear the filter by fetching all posts (no category filter)
            const allPosts = await fetchAllPosts();

            // Verify that ALL created posts are returned when no filter is applied
            const createdPostIds = createdPosts.map(p => p.id).sort();
            const fetchedPostIds = allPosts
              .filter(p => createdPostIds.includes(p.id))
              .map(p => p.id)
              .sort();

            expect(fetchedPostIds).toEqual(createdPostIds);

            // Verify that the count matches
            expect(fetchedPostIds.length).toBe(createdPosts.length);

            // Verify that posts with NO categories are also included
            const postsWithoutCategories = createdPosts.filter(
              p => !p.category_ids || p.category_ids.length === 0
            );

            for (const post of postsWithoutCategories) {
              const foundInAll = allPosts.find(p => p.id === post.id);
              expect(foundInAll).toBeDefined();
            }

            // Verify that posts with ANY categories are also included
            const postsWithCategories = createdPosts.filter(
              p => p.category_ids && p.category_ids.length > 0
            );

            for (const post of postsWithCategories) {
              const foundInAll = allPosts.find(p => p.id === post.id);
              expect(foundInAll).toBeDefined();
            }

          } finally {
            // Cleanup: delete all created posts
            for (const post of createdPosts) {
              try {
                await deletePost(post.id);
              } catch (error) {
                console.error(`Failed to cleanup post ${post.id}:`, error);
              }
            }

            // Cleanup: delete all categories
            for (const category of createdCategories) {
              try {
                await supabase
                  .from('categories')
                  .delete()
                  .eq('id', category.id);
              } catch (error) {
                console.error(`Failed to cleanup category ${category.id}:`, error);
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 180000); // 180 second timeout for async operations with multiple posts

  // Feature: personal-blog, Property 18: Multi-category posts appear in all their category filters
  // Validates: Requirements 9.5
  test('Property 18: Multi-category posts appear in all their category filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple categories (at least 2)
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            slug: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            color: fc.constantFrom('#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'),
          }),
          { minLength: 2, maxLength: 4 }
        ),
        // Generate posts with various multi-category assignments
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            story: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            photos: fc.constant([
              new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
            ]),
            // Each post will be assigned to multiple categories
            // Use indices to select which categories (at least 2 for multi-category posts)
            categoryIndices: fc.array(fc.nat(), { minLength: 2, maxLength: 4 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (categoryInputs, postInputs) => {
          const createdCategories: any[] = [];
          const createdPosts: BlogPost[] = [];

          try {
            // Create categories
            for (const categoryInput of categoryInputs) {
              const category = await supabase
                .from('categories')
                .insert(categoryInput)
                .select()
                .single();

              if (category.error || !category.data) {
                throw new Error(`Failed to create test category: ${category.error?.message}`);
              }

              createdCategories.push(category.data);
            }

            // Create posts with multiple category assignments
            for (const postInput of postInputs) {
              // Map category indices to actual category IDs
              // Ensure we have at least 2 categories and remove duplicates
              const categoryIds = postInput.categoryIndices
                .filter(idx => idx < createdCategories.length)
                .map(idx => createdCategories[idx].id)
                .filter((id, index, self) => self.indexOf(id) === index)
                .slice(0, Math.min(postInput.categoryIndices.length, createdCategories.length));
              
              // Only create posts that have at least 2 categories
              if (categoryIds.length >= 2) {
                const post = await createPost({
                  title: postInput.title,
                  story: postInput.story,
                  photos: [...postInput.photos],
                  category_ids: categoryIds,
                });
                
                createdPosts.push(post);
                
                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            // Skip test if no multi-category posts were created
            if (createdPosts.length === 0) {
              return; // Property vacuously true
            }

            // For each post with multiple categories, verify it appears when filtering by ANY of its categories
            for (const post of createdPosts) {
              expect(post.category_ids.length).toBeGreaterThanOrEqual(2);

              // Test filtering by each category the post belongs to
              for (const categoryId of post.category_ids) {
                const { data: filteredPosts, error: fetchError } = await supabase
                  .from('posts')
                  .select('*')
                  .contains('category_ids', [categoryId])
                  .order('created_at', { ascending: false });

                if (fetchError) {
                  throw new Error(`Failed to fetch posts by category ${categoryId}: ${fetchError.message}`);
                }

                // Verify the multi-category post appears in the filtered results
                const foundPost = (filteredPosts || []).find(p => p.id === post.id);
                expect(foundPost).toBeDefined();
                expect(foundPost?.id).toBe(post.id);
                expect(foundPost?.category_ids).toContain(categoryId);
              }
            }

            // Additional verification: ensure posts appear in ALL their assigned category filters
            for (const post of createdPosts) {
              const categoriesWherePostAppears: string[] = [];

              // Check each category the post is assigned to
              for (const categoryId of post.category_ids) {
                const { data: filteredPosts, error: fetchError } = await supabase
                  .from('posts')
                  .select('*')
                  .contains('category_ids', [categoryId])
                  .order('created_at', { ascending: false });

                if (fetchError) {
                  throw new Error(`Failed to fetch posts by category ${categoryId}: ${fetchError.message}`);
                }

                const foundPost = (filteredPosts || []).find(p => p.id === post.id);
                if (foundPost) {
                  categoriesWherePostAppears.push(categoryId);
                }
              }

              // Verify the post appears in ALL its assigned categories
              expect(categoriesWherePostAppears.sort()).toEqual(post.category_ids.sort());
            }

          } finally {
            // Cleanup: delete all created posts
            for (const post of createdPosts) {
              try {
                await deletePost(post.id);
              } catch (error) {
                console.error(`Failed to cleanup post ${post.id}:`, error);
              }
            }

            // Cleanup: delete all categories
            for (const category of createdCategories) {
              try {
                await supabase
                  .from('categories')
                  .delete()
                  .eq('id', category.id);
              } catch (error) {
                console.error(`Failed to cleanup category ${category.id}:`, error);
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 180000); // 180 second timeout for async operations with multiple posts

  // Feature: personal-blog, Property 19: Category assignments persist after save
  // Validates: Requirements 10.3
  test('Property 19: Category assignments persist after save', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate categories
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            slug: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            color: fc.constantFrom('#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate a post
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          story: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          photos: fc.constant([
            new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
          ]),
          // Select which categories to assign (indices into the categories array)
          categoryIndices: fc.array(fc.nat(), { minLength: 0, maxLength: 5 }),
        }),
        async (categoryInputs, postInput) => {
          const createdCategories: any[] = [];
          let createdPost: BlogPost | null = null;

          try {
            // Create categories
            for (const categoryInput of categoryInputs) {
              const category = await supabase
                .from('categories')
                .insert(categoryInput)
                .select()
                .single();

              if (category.error || !category.data) {
                throw new Error(`Failed to create test category: ${category.error?.message}`);
              }

              createdCategories.push(category.data);
            }

            // Map category indices to actual category IDs
            const categoryIds = postInput.categoryIndices
              .filter(idx => idx < createdCategories.length)
              .map(idx => createdCategories[idx].id)
              // Remove duplicates
              .filter((id, index, self) => self.indexOf(id) === index);

            // Create a post with assigned categories
            createdPost = await createPost({
              title: postInput.title,
              story: postInput.story,
              photos: [...postInput.photos],
              category_ids: categoryIds,
            });

            // Verify the post was created with the assigned categories
            expect(createdPost.category_ids).toBeDefined();
            expect(createdPost.category_ids.sort()).toEqual(categoryIds.sort());

            // Fetch the post from the database to verify persistence
            const { data: fetchedPost, error: fetchError } = await supabase
              .from('posts')
              .select('*')
              .eq('id', createdPost.id)
              .single();

            if (fetchError || !fetchedPost) {
              throw new Error(`Failed to fetch post: ${fetchError?.message}`);
            }

            // Verify that the fetched post has the same category assignments
            expect(fetchedPost.category_ids).toBeDefined();
            expect(fetchedPost.category_ids.sort()).toEqual(categoryIds.sort());

            // Verify each assigned category ID is present
            for (const categoryId of categoryIds) {
              expect(fetchedPost.category_ids).toContain(categoryId);
            }

            // Verify no extra categories were added
            expect(fetchedPost.category_ids.length).toBe(categoryIds.length);

          } finally {
            // Cleanup: delete the created post
            if (createdPost) {
              try {
                await deletePost(createdPost.id);
              } catch (error) {
                console.error(`Failed to cleanup post ${createdPost.id}:`, error);
              }
            }

            // Cleanup: delete all categories
            for (const category of createdCategories) {
              try {
                await supabase
                  .from('categories')
                  .delete()
                  .eq('id', category.id);
              } catch (error) {
                console.error(`Failed to cleanup category ${category.id}:`, error);
              }
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 120000); // 120 second timeout for async operations
});
