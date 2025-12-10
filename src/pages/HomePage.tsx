import { useState, useEffect } from 'react';
import { BlogPostListPaginated } from '../components/BlogPostListPaginated';
import { CategoryFilter } from '../components/CategoryFilter';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';

export function HomePage() {
  const { isAdminMode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Initialize selected categories from URL params on mount
  useEffect(() => {
    const categoriesParam = searchParams.get('categories');
    if (categoriesParam) {
      setSelectedCategoryIds(categoriesParam.split(',').filter(Boolean));
    }
  }, []);

  // Update URL params when selected categories change
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      setSearchParams({ categories: selectedCategoryIds.join(',') });
    } else {
      setSearchParams({});
    }
  }, [selectedCategoryIds, setSearchParams]);

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }

  function handleClearFilters() {
    setSelectedCategoryIds([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <LogoutButton />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header with enhanced styling */}
        <header className="mb-12 sm:mb-16 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
            Lexove Putešestvije
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Priče i slike moga života
          </p>
          
          {/* Decorative divider */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center">
            <div className="h-1 w-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"></div>
          </div>
        </header>

        {/* Admin controls */}
        {isAdminMode && (
          <div className="mb-8 flex justify-center gap-4 animate-slide-up">
            <Link
              to="/post/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Post
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Manage Categories
            </Link>
          </div>
        )}

        {/* Category Filter */}
        <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <CategoryFilter
            selectedCategoryIds={selectedCategoryIds}
            onCategoryToggle={handleCategoryToggle}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Main content */}
        <main className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <BlogPostListPaginated selectedCategoryIds={selectedCategoryIds} />
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Adventures & Daily Life. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
