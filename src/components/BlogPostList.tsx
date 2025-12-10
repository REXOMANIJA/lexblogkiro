import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllPosts, deletePost, fetchAllCategories } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { BlogPost, Category } from '../types';

export function BlogPostList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { isAdminMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      setError(null);
      const [fetchedPosts, fetchedCategories] = await Promise.all([
        fetchAllPosts(),
        fetchAllCategories(),
      ]);
      setPosts(fetchedPosts);
      setCategories(fetchedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string, event: React.MouseEvent) {
    event.preventDefault(); // Prevent navigation to post detail
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(postId);
      await deletePost(postId);
      // Remove post from local state
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(postId: string, event: React.MouseEvent) {
    event.preventDefault(); // Prevent navigation to post detail
    navigate(`/post/${postId}/edit`);
  }

  // Create excerpt from story (first 150 characters, stripping HTML tags)
  function createExcerpt(story: string): string {
    // Strip HTML tags and convert line breaks to spaces
    let plainText = story.replace(/<[^>]*>/g, '');
    // Replace multiple whitespace/newlines with single space
    plainText = plainText.replace(/\s+/g, ' ').trim();
    if (plainText.length <= 150) return plainText;
    return plainText.substring(0, 150).trim().replace(/[,;:]$/, '') + '...';
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 sm:py-24">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-800 dark:text-red-200 animate-scale-in">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-lg mb-1">Error loading posts</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
          <svg
            className="w-10 h-10 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No posts yet</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Check back soon for new stories and adventures!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {posts.map((post, index) => (
        <Link
          key={post.id}
          to={`/post/${post.id}`}
          className="stagger-item group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 block relative"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <article>
            {/* Admin controls */}
            {isAdminMode && (
              <div className="absolute top-3 right-3 z-10 flex gap-2" data-testid="admin-controls">
                <button
                  onClick={(e) => handleEdit(post.id, e)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 hover:scale-105"
                  data-testid="edit-button"
                  aria-label="Edit post"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => handleDelete(post.id, e)}
                  disabled={deletingId === post.id}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  data-testid="delete-button"
                  aria-label="Delete post"
                >
                  {deletingId === post.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}

            {/* First photo as preview */}
            {post.photo_urls.length > 0 && (
              <div className="aspect-video w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={post.photo_urls[0]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {post.title}
              </h2>
              
              {/* Categories */}
              {post.category_ids && post.category_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.category_ids.slice(0, 3).map(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!category) return null;
                    return (
                      <span
                        key={category.id}
                        data-testid="category-chip"
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                          border: `1px solid ${category.color}40`,
                        }}
                      >
                        {category.name}
                      </span>
                    );
                  })}
                  {post.category_ids.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      +{post.category_ids.length - 3}
                    </span>
                  )}
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed">
                {createExcerpt(post.story)}
              </p>
              <div className="flex items-center justify-between">
                <time className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Read more
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
