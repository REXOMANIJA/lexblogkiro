import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/auth';

export function LogoutButton() {
  const { isAdminMode } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isAdminMode) {
    return null;
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      // Auth context will automatically update via onAuthStateChange
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to logout');
      setLoggingOut(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="fixed top-4 right-4 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-50 transform hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center gap-2"
      data-testid="logout-button"
      aria-label="Logout"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {loggingOut ? 'Logging out...' : 'Logout'}
    </button>
  );
}
