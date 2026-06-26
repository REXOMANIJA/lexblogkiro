import { useState, useEffect } from 'react';
import { BlogPostListPaginated } from '../components/BlogPostListPaginated';
import { CategoryFilter } from '../components/CategoryFilter';
import { LogoutButton } from '../components/LogoutButton';
import { NewsletterSubscriptionForm } from '../components/NewsletterSubscriptionForm';
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
    <div className="min-h-screen transition-colors duration-300 relative" style={{ background: 'linear-gradient(165deg, #3d4f42 0%, #354539 28%, #2d3c31 55%, #27362b 85%, #233028 100%)' }}>
      {/* Atmospheric glow: warm moonlight above, subtle depth below */}
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 85% 45% at 50% -8%, rgba(202, 168, 115, 0.12) 0%, transparent 58%), radial-gradient(circle at 50% 115%, rgba(0,0,0,0.18) 0%, transparent 50%)' }}></div>

      <LogoutButton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
        {/* Header with storybook styling */}
        <header className="mb-12 sm:mb-16 text-center animate-fade-in">
          <p className="font-serif italic text-sm sm:text-base tracking-[0.3em] uppercase mb-3 sm:mb-4" style={{ color: '#caa873' }}>
            Jednom davno
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold mb-3 sm:mb-4 tracking-tight" style={{ color: '#f4ecda', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Šunja i Siže
          </h1>
          <p className="font-serif italic text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: '#c2d0bd' }}>
            Uglavnom kratke priče i poneka bajka
          </p>

          {/* Decorative ornamental divider */}
          <div className="ornament-divider mt-6 sm:mt-8">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1.5 3 3.5 4.5 6.5 5C15.5 8 13.5 9.5 12 12c-1.5-2.5-3.5-4-6.5-5C8.5 6.5 10.5 5 12 2z" />
              <path d="M12 12c1.5 3 3.5 4.5 6.5 5-3 .5-5 2-6.5 5-1.5-3-3.5-4.5-6.5-5 3-.5 5-2 6.5-5z" opacity="0.7" />
            </svg>
          </div>
        </header>

        {/* Admin controls */}
        {isAdminMode && (
          <div className="mb-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-slide-up max-w-md sm:max-w-none mx-auto">
            <Link
              to="/post/new"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto"
              style={{ backgroundColor: '#6aa074' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">Create New Post</span>
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto"
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
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="whitespace-nowrap">Manage Categories</span>
            </Link>
            <Link
              to="/newsletter"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto"
              style={{ backgroundColor: '#a5c6ab', color: '#304b35' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6aa074';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#a5c6ab';
                e.currentTarget.style.color = '#304b35';
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span className="whitespace-nowrap">Newsletter</span>
            </Link>
          </div>
        )}

        {/* Newsletter Subscription Form */}
        <NewsletterSubscriptionForm />

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
      <footer className="mt-16 py-10 border-t relative" style={{ borderColor: 'rgba(202, 168, 115, 0.25)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="ornament-divider mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1.5 3 3.5 4.5 6.5 5C15.5 8 13.5 9.5 12 12c-1.5-2.5-3.5-4-6.5-5C8.5 6.5 10.5 5 12 2z" />
            </svg>
          </div>
          <p className="font-serif text-sm" style={{ color: '#9fb0a0' }}>
            Instagram: <a href='https://www.instagram.com/lex_2h4s/' className="underline decoration-dotted underline-offset-2" style={{ color: '#caa873' }}>@lex_2h4s</a>
          </p>
          <p className="font-serif italic text-sm mt-1" style={{ color: '#9fb0a0' }}>
            © {new Date().getFullYear()} Šunja i Siže. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
