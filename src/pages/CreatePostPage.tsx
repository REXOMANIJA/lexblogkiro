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

  function handleSuccess(postId?: string) {
    // Navigate to the created post instead of home
    if (postId) {
      navigate(`/post/${postId}`);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'linear-gradient(165deg, #3d4f42 0%, #354539 28%, #2d3c31 55%, #27362b 85%, #233028 100%)' }}>
      <LogoutButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 animate-fade-in">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 font-medium transition-colors group"
            style={{ color: '#c2d0bd' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#caa873'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#c2d0bd'}
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
        <PostEditor mode="create" onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
