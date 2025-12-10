import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { PhotoGallery } from './PhotoGallery';
import { Comments } from './Comments';
import { useAuth } from '../contexts/AuthContext';
import { deletePost, fetchAllCategories } from '../services/supabase';
import type { BlogPost, Category } from '../types';

interface BlogPostDetailProps {
  post: BlogPost;
}

export function BlogPostDetail({ post }: BlogPostDetailProps) {
  const { isAdminMode } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const fetchedCategories = await fetchAllCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await deletePost(post.id);
      // Navigate back to home after successful deletion
      navigate('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
      setDeleting(false);
    }
  }

  function handleEdit() {
    navigate(`/post/${post.id}/edit`);
  }

  return (
    <article className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      {/* Main content card */}
      <div 
        className="rounded-2xl shadow-lg border p-8 sm:p-12 animate-slide-up"
        style={{ 
          backgroundColor: '#f0f5f1', 
          borderColor: '#d2e2d5',
          boxShadow: '0 10px 25px -5px rgba(48, 75, 53, 0.1), 0 4px 6px -2px rgba(48, 75, 53, 0.05)'
        }}
      >
        {/* Title and Admin controls */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 leading-tight animate-slide-up" style={{ color: '#304b35' }}>
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-sm sm:text-base animate-slide-up" style={{ animationDelay: '0.1s', color: '#507c58' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time>
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>

              {/* Categories */}
              {!loadingCategories && post.category_ids && post.category_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  {post.category_ids.map(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!category) return null;
                    return (
                      <span
                        key={category.id}
                        data-testid="category-chip"
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
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
                </div>
              )}
            </div>
            
            {/* Admin controls - inside the card */}
            {isAdminMode && (
              <div className="flex gap-2 sm:gap-3 animate-scale-in" data-testid="admin-controls">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                  style={{ backgroundColor: '#6aa074' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
                  data-testid="edit-button"
                  aria-label="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Photo Gallery */}
        {post.photo_urls.length > 0 && (
          <div className="mb-8 sm:mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <PhotoGallery photos={post.photo_urls} alt={post.title} />
          </div>
        )}

        {/* Story Content with more margin */}
        <div 
          className="animate-slide-up mx-8 sm:mx-16 lg:mx-24" 
          style={{ animationDelay: '0.3s' }}
        >
          <div 
            className="prose prose-lg max-w-none text-left leading-relaxed"
            style={{
              color: '#304b35',
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.story) }}
          />
        </div>
      </div>
      
      <style>{`
        .prose {
          color: #304b35 !important;
        }
        .prose p {
          color: #304b35 !important;
          margin-bottom: 1.25em;
          line-height: 1.75;
        }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #304b35 !important;
          font-weight: 600;
        }
        .prose a {
          color: #6aa074 !important;
          text-decoration: underline;
        }
        .prose a:hover {
          color: #507c58 !important;
        }
        .prose strong {
          color: #304b35 !important;
          font-weight: 600;
        }
        .prose em {
          color: #507c58 !important;
        }
        .prose ul, .prose ol {
          color: #304b35 !important;
        }
        .prose li {
          color: #304b35 !important;
        }
        .prose blockquote {
          color: #507c58 !important;
          border-left-color: #b4cfb9 !important;
        }
        .prose code {
          color: #304b35 !important;
          background-color: #e1ece3 !important;
        }
      `}</style>

      {/* Metadata footer */}
      <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Last updated: {new Date(post.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </footer>

      {/* Comments Section */}
      <Comments postId={post.id} />
    </article>
  );
}
