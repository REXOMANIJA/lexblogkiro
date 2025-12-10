import { createClient } from '@supabase/supabase-js';
import type { BlogPost, CreatePostInput, UpdatePostInput, Category, Comment } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retry configuration for network requests
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable (network errors, timeouts, 5xx errors)
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return true;
  }
  
  // Timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }
  
  // 5xx server errors
  if (error.code && typeof error.code === 'string') {
    const code = parseInt(error.code);
    if (code >= 500 && code < 600) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationName: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error or if we're out of retries
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(
        `${operationName} failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`,
        error
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Cache for posts with timestamp
interface PostsCache {
  data: BlogPost[];
  timestamp: number;
}

let postsCache: PostsCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Clear the posts cache
 */
export function clearPostsCache(): void {
  postsCache = null;
}

/**
 * Fetch all blog posts ordered by creation date (newest first)
 * Uses caching to reduce unnecessary API calls
 * Includes retry logic for network failures
 * Includes new fields: cover_image_url, cover_image_position, category_ids
 */
export async function fetchAllPosts(): Promise<BlogPost[]> {
  // Check if cache is valid
  const now = Date.now();
  if (postsCache && (now - postsCache.timestamp) < CACHE_DURATION) {
    return postsCache.data;
  }

  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, story, photo_urls, cover_image_url, cover_image_position, category_ids, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    // Update cache
    postsCache = {
      data: data || [],
      timestamp: now,
    };

    return data || [];
  }, 'fetchAllPosts');
}

/**
 * Fetch paginated blog posts ordered by creation date (newest first)
 * Includes retry logic for network failures
 * Includes new fields: cover_image_url, cover_image_position, category_ids
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of posts per page
 */
export async function fetchPaginatedPosts(page: number = 0, pageSize: number = 9): Promise<{ posts: BlogPost[], hasMore: boolean, total: number }> {
  return retryWithBackoff(async () => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to fetch post count: ${countError.message}`);
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, story, photo_urls, cover_image_url, cover_image_position, category_ids, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    const total = count || 0;
    const hasMore = (from + (data?.length || 0)) < total;

    return {
      posts: data || [],
      hasMore,
      total,
    };
  }, 'fetchPaginatedPosts');
}

/**
 * Create a new blog post with photo uploads
 * Includes retry logic for network failures
 * Handles cover_image_url, cover_image_position, and category_ids
 */
export async function createPost(input: CreatePostInput): Promise<BlogPost> {
  // Validate required fields
  if (!input.title || input.title.trim() === '') {
    throw new Error('Title is required');
  }
  
  if (!input.story || input.story.trim() === '') {
    throw new Error('Story is required');
  }
  
  if (!input.photos || input.photos.length === 0) {
    throw new Error('At least one photo is required');
  }

  return retryWithBackoff(async () => {
    // First, create the post to get an ID
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        title: input.title,
        story: input.story,
        photo_urls: [], // Temporarily empty, will update after upload
        cover_image_url: null,
        cover_image_position: input.cover_image_position || { x: 50, y: 50, zoom: 100 },
        category_ids: input.category_ids || [],
      })
      .select()
      .single();

    if (insertError || !post) {
      throw new Error(`Failed to create post: ${insertError?.message}`);
    }

    // Upload photos to storage
    const photoUrls: string[] = [];
    for (const photo of input.photos) {
      const filename = `${Date.now()}_${photo.name}`;
      const filePath = `${post.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-photos')
        .upload(filePath, photo);

      if (uploadError) {
        // Cleanup: delete the post if photo upload fails
        await supabase.from('posts').delete().eq('id', post.id);
        throw new Error(`Failed to upload photo: ${uploadError.message}`);
      }

      // Get public URL for the uploaded photo
      const { data: urlData } = supabase.storage
        .from('blog-photos')
        .getPublicUrl(filePath);

      photoUrls.push(urlData.publicUrl);
    }

    // Determine cover image URL based on cover_image_index
    let coverImageUrl: string | null = null;
    if (input.cover_image_index !== undefined && input.cover_image_index >= 0 && input.cover_image_index < photoUrls.length) {
      // Reorder photo_urls to place cover image first
      coverImageUrl = photoUrls[input.cover_image_index];
      const reorderedPhotoUrls = [coverImageUrl, ...photoUrls.filter((_, idx) => idx !== input.cover_image_index)];
      photoUrls.splice(0, photoUrls.length, ...reorderedPhotoUrls);
    } else if (photoUrls.length > 0) {
      // Default to first photo as cover image
      coverImageUrl = photoUrls[0];
    }

    // Update post with photo URLs, cover image, and other fields
    const { data: updatedPosts, error: updateError } = await supabase
      .from('posts')
      .update({ 
        photo_urls: photoUrls,
        cover_image_url: coverImageUrl,
      })
      .eq('id', post.id)
      .select();

    if (updateError) {
      throw new Error(`Failed to update post with photo URLs: ${updateError.message}`);
    }

    if (!updatedPosts || updatedPosts.length === 0) {
      throw new Error(`Failed to update post with photo URLs: No post returned after update`);
    }

    const updatedPost = updatedPosts[0];

    // Clear cache after creating a post
    clearPostsCache();

    return updatedPost;
  }, 'createPost');
}

/**
 * Update an existing blog post with optional new photos
 * Includes retry logic for network failures
 * Handles cover_image_url, cover_image_position, and category_ids updates
 */
export async function updatePost(input: UpdatePostInput): Promise<BlogPost> {
  return retryWithBackoff(async () => {
    let finalPhotoUrls = [...input.photo_urls];

    // Upload new photos if provided
    if (input.photos && input.photos.length > 0) {
      for (const photo of input.photos) {
        const filename = `${Date.now()}_${photo.name}`;
        const filePath = `${input.id}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from('blog-photos')
          .upload(filePath, photo);

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        // Get public URL for the uploaded photo
        const { data: urlData } = supabase.storage
          .from('blog-photos')
          .getPublicUrl(filePath);

        finalPhotoUrls.push(urlData.publicUrl);
      }
    }

    // Prepare update object with all fields
    const updateData: any = {
      title: input.title,
      story: input.story,
      photo_urls: finalPhotoUrls,
    };

    // Add cover_image_url if provided
    if (input.cover_image_url !== undefined) {
      updateData.cover_image_url = input.cover_image_url;
    }

    // Add cover_image_position if provided
    if (input.cover_image_position !== undefined) {
      updateData.cover_image_position = input.cover_image_position;
    }

    // Add category_ids if provided
    if (input.category_ids !== undefined) {
      updateData.category_ids = input.category_ids;
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      throw new Error(`Failed to update post: ${updateError?.message}`);
    }

    // Clear cache after updating a post
    clearPostsCache();

    return updatedPost;
  }, 'updatePost');
}

/**
 * Delete a blog post and clean up associated photos from storage
 * Includes retry logic for network failures
 */
export async function deletePost(postId: string): Promise<void> {
  return retryWithBackoff(async () => {
    // First, fetch the post to get photo URLs
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('photo_urls')
      .eq('id', postId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch post for deletion: ${fetchError.message}`);
    }

    // Delete photos from storage
    if (post && post.photo_urls && post.photo_urls.length > 0) {
      // Extract file paths from URLs
      const filePaths = post.photo_urls.map((url: string) => {
        // URL format: https://{project}.supabase.co/storage/v1/object/public/blog-photos/{postId}/{filename}
        const parts = url.split('/blog-photos/');
        return parts[1]; // Returns: {postId}/{filename}
      });

      const { error: storageError } = await supabase.storage
        .from('blog-photos')
        .remove(filePaths);

      if (storageError) {
        console.error('Failed to delete photos from storage:', storageError);
        // Continue with post deletion even if storage cleanup fails
      }
    }

    // Delete the post from database
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      throw new Error(`Failed to delete post: ${deleteError.message}`);
    }

    // Clear cache after deleting a post
    clearPostsCache();
  }, 'deletePost');
}

/**
 * Fetch all categories ordered by name
 * Includes retry logic for network failures
 */
export async function fetchAllCategories(): Promise<Category[]> {
  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }, 'fetchAllCategories');
}

/**
 * Create a new category
 * Includes retry logic for network failures
 * @param name - Category name
 * @param slug - URL-friendly slug
 * @param color - Hex color code (default: '#3B82F6')
 */
export async function createCategory(name: string, slug: string, color: string = '#3B82F6'): Promise<Category> {
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new Error('Category name is required');
  }
  
  if (!slug || slug.trim() === '') {
    throw new Error('Category slug is required');
  }

  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        color: color,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create category: No data returned');
    }

    return data;
  }, 'createCategory');
}

/**
 * Update an existing category
 * Includes retry logic for network failures
 * @param id - Category ID
 * @param updates - Partial category updates (name, slug, color)
 */
export async function updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'slug' | 'color'>>): Promise<Category> {
  if (!id) {
    throw new Error('Category ID is required');
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('At least one field must be updated');
  }

  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update category: No data returned');
    }

    return data;
  }, 'updateCategory');
}

/**
 * Delete a category
 * Includes retry logic for network failures
 * @param id - Category ID
 */
export async function deleteCategory(id: string): Promise<void> {
  if (!id) {
    throw new Error('Category ID is required');
  }

  return retryWithBackoff(async () => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }, 'deleteCategory');
}

/**
 * Fetch posts filtered by category
 * Includes retry logic for network failures
 * Includes new fields: cover_image_url, cover_image_position, category_ids
 * @param categoryId - Category ID to filter by
 */
export async function fetchPostsByCategory(categoryId: string): Promise<BlogPost[]> {
  if (!categoryId) {
    throw new Error('Category ID is required');
  }

  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, story, photo_urls, cover_image_url, cover_image_position, category_ids, created_at, updated_at')
      .contains('category_ids', [categoryId])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by category: ${error.message}`);
    }

    return data || [];
  }, 'fetchPostsByCategory');
}

/**
 * Fetch comments for a specific post
 * @param postId - Post ID to fetch comments for
 */
export async function fetchComments(postId: string): Promise<Comment[]> {
  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    return data || [];
  }, 'Fetch comments');
}

/**
 * Create a new comment
 * @param input - Comment data
 */
export async function createComment(input: {
  post_id: string;
  author_name: string;
  content: string;
}): Promise<Comment> {
  return retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: input.post_id,
        author_name: input.author_name,
        content: input.content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    return data;
  }, 'Create comment');
}

/**
 * Delete a comment by ID
 * @param commentId - Comment ID to delete
 */
export async function deleteComment(commentId: string): Promise<void> {
  return retryWithBackoff(async () => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }, 'Delete comment');
}