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
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'linear-gradient(135deg, #f0f5f1 0%, #e1ece3 20%, #d3e3d6 40%, #c3d9c7 60%, #b4cfb9 80%, #a5c6ab 100%)' }}>
      <LogoutButton />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header with enhanced styling */}
        <header className="mb-12 sm:mb-16 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold mb-3 sm:mb-4 tracking-tight" style={{ color: '#304b35' }}>
            Lexove Putešestvije
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: '#507c58' }}>
            Priče i slike moga života
          </p>
          
          {/* Decorative divider */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center">
            <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #6aa074, #507c58)' }}></div>
          </div>
        </header>

        {/* Admin controls */}
        {isAdminMode && (
          <div className="mb-8 flex justify-center gap-4 animate-slide-up">
            <Link
              to="/post/new"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#6aa074' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Post
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-6 py-3 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#b4cfb9', color: '#304b35' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6aa074';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#b4cfb9';
                e.currentTarget.style.color = '#304b35';
              }}
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
      <footer className="mt-16 py-8 border-t" style={{ borderColor: '#d2e2d5' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: '#53815b' }}>
            © {new Date().getFullYear()} Adventures & Daily Life. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
