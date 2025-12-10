import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PostEditor } from '../components/PostEditor';
import { LogoutButton } from '../components/LogoutButton';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { BlogPost } from '../types';

export function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdminMode } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not in admin mode
    if (!isAdminMode) {
      navigate('/');
      return;
    }

    loadPost();
  }, [id, isAdminMode, navigate]);

  async function loadPost() {
    if (!id) {
      setError('No post ID provided');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data) {
        throw new Error('Post not found');
      }

      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess() {
    // Navigate back to the post detail page after successful update
    navigate(`/post/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <LogoutButton />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <LogoutButton />
        <div className="max-w-7xl mx-auto px-4 py-12">
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
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <LogoutButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 animate-fade-in">
          <Link to={`/post/${id}`} className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Post</span>
          </Link>
        </div>
        <PostEditor mode="edit" editPost={post} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
