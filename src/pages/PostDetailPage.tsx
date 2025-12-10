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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-800 dark:text-red-200 mb-6 animate-scale-in">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-lg mb-1">Error</p>
                <p className="text-sm opacity-90 mb-3">{error || 'Post not found'}</p>
                <button
                  onClick={loadPost}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
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
            <span className="font-medium">Back to all posts</span>
          </Link>
        </div>

        {/* Post detail */}
        <BlogPostDetail post={post} />
      </div>
    </div>
  );
}
