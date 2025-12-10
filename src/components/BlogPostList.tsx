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
          <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: '#d2e2d5' }}></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent absolute top-0 left-0" style={{ borderColor: '#6aa074' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border rounded-xl p-6 animate-scale-in" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderColor: 'rgba(180, 207, 185, 0.6)', 
          color: '#507c58',
          boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
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
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: '#e1ece3' }}>
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: '#53815b' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-medium mb-2" style={{ color: '#507c58' }}>No posts yet</h3>
        <p className="max-w-md mx-auto" style={{ color: '#53815b' }}>
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
          className="stagger-item group rounded-xl overflow-hidden transition-all duration-300 block relative transform hover:-translate-y-2"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            border: '1px solid rgba(180, 207, 185, 0.6)',
            boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
            backdropFilter: 'blur(10px)',
            animationDelay: `${index * 0.05}s`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = '1px solid rgba(106, 160, 116, 0.8)';
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(48, 75, 53, 0.25), 0 8px 20px -5px rgba(48, 75, 53, 0.15), 0 0 20px rgba(106, 160, 116, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '1px solid rgba(180, 207, 185, 0.6)';
            e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)';
          }}
        >
          <article>
            {/* Admin controls */}
            {isAdminMode && (
              <div className="absolute top-3 right-3 z-10 flex gap-2" data-testid="admin-controls">
                <button
                  onClick={(e) => handleEdit(post.id, e)}
                  className="text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6aa074' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
                  data-testid="edit-button"
                  aria-label="Edit post"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => handleDelete(post.id, e)}
                  disabled={deletingId === post.id}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ backgroundColor: '#b4cfb9', color: '#304b35' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#53815b';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#b4cfb9';
                      e.currentTarget.style.color = '#304b35';
                    }
                  }}
                  data-testid="delete-button"
                  aria-label="Delete post"
                >
                  {deletingId === post.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}

            {/* First photo as preview */}
            {post.photo_urls.length > 0 && (
              <div className="aspect-video w-full overflow-hidden" style={{ backgroundColor: 'rgba(210, 226, 213, 0.3)' }}>
                <img
                  src={post.photo_urls[0]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 line-clamp-2 transition-colors" style={{ color: '#304b35' }}>
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#e1ece3', color: '#53815b' }}>
                      +{post.category_ids.length - 3}
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed" style={{ color: '#507c58' }}>
                {createExcerpt(post.story)}
              </p>
              <div className="flex items-center justify-between">
                <time className="text-xs sm:text-sm flex items-center gap-1.5" style={{ color: '#53815b' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
                <span className="text-sm font-medium group-hover:translate-x-1 transition-all inline-flex items-center gap-1" style={{ color: '#53815b' }}>
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
