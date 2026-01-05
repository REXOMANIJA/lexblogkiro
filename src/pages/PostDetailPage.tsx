import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPostDetail } from '../components/BlogPostDetail';
import { LogoutButton } from '../components/LogoutButton';
import { fetchAllPosts } from '../services/supabase';
import type { BlogPost } from '../types';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    if (!id) {
      setError('No post ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const posts = await fetchAllPosts();
      const foundPost = posts.find(p => p.id === id);
      
      if (!foundPost) {
        setError('Post not found');
      } else {
        setPost(foundPost);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ background: 'linear-gradient(45deg, #f0f5f1 0%, #e1ece3 25%, #d3e3d6 50%, #c3d9c7 75%, #b4cfb9 100%)' }}>
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: '#d2e2d5' }}></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent absolute top-0 left-0" style={{ borderColor: '#6aa074' }}></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(45deg, #f0f5f1 0%, #e1ece3 25%, #d3e3d6 50%, #c3d9c7 75%, #b4cfb9 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="border rounded-xl p-6 mb-6 animate-scale-in" style={{ backgroundColor: '#e1ece3', borderColor: '#c3d9c7', color: '#507c58' }}>
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-lg mb-1">Error</p>
                <p className="text-sm opacity-90 mb-3">{error || 'Post not found'}</p>
                <button
                  onClick={loadPost}
                  className="px-4 py-2 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                  style={{ backgroundColor: '#6aa074' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-medium transition-colors"
            style={{ color: '#53815b' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#507c58'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#53815b'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nazad na početnu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'linear-gradient(45deg, #f0f5f1 0%, #e1ece3 25%, #d3e3d6 50%, #c3d9c7 75%, #b4cfb9 100%)' }}>
      <LogoutButton />
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <div className="px-4 sm:px-6 py-6 animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Nazad na početnu</span>
          </Link>
        </div>

        {/* Post detail */}
        <BlogPostDetail post={post} />
      </div>
    </div>
  );
}
