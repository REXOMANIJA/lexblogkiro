import { useNavigate, Link } from 'react-router-dom';
import { PostEditor } from '../components/PostEditor';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export function CreatePostPage() {
  const navigate = useNavigate();
  const { isAdminMode } = useAuth();

  useEffect(() => {
    // Redirect if not in admin mode
    if (!isAdminMode) {
      navigate('/');
    }
  }, [isAdminMode, navigate]);

  function handleSuccess() {
    // Navigate back to home after successful creation
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <LogoutButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
        <PostEditor mode="create" onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
