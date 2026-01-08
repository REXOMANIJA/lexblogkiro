import { useEffect, useState } from 'react';
import { fetchAllCategories, fetchAllPosts } from '../services/supabase';
import type { Category } from '../types';

interface CategoryFilterProps {
  selectedCategoryIds: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearFilters: () => void;
}

export function CategoryFilter({ selectedCategoryIds, onCategoryToggle, onClearFilters }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategoriesAndCounts();
  }, []);

  async function loadCategoriesAndCounts() {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories and posts in parallel
      const [fetchedCategories, fetchedPosts] = await Promise.all([
        fetchAllCategories(),
        fetchAllPosts()
      ]);
      
      setCategories(fetchedCategories);
      
      // Calculate post count per category
      const counts: Record<string, number> = {};
      fetchedCategories.forEach(category => {
        counts[category.id] = fetchedPosts.filter(post => 
          post.category_ids && post.category_ids.includes(category.id)
        ).length;
      });
      
      setPostCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ash-grey-700 dark:border-ash-grey-600"></div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage-green-500 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-ash-grey-800 dark:bg-ash-grey-700 border border-ash-grey-600 dark:border-ash-grey-500 rounded-lg p-4 text-fern-500 dark:text-sage-green-400">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null; // Don't show filter if no categories exist
  }

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter label */}
        <span className="text-sm font-medium" style={{ color: '#304b35' }}>
          Filtriraj po kategoriji:
        </span>

        {/* Category chips */}
        {categories.map(category => {
          const isSelected = selectedCategoryIds.includes(category.id);
          const count = postCounts[category.id] || 0;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryToggle(category.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
              style={isSelected ? {
                backgroundColor: category.color,
                border: `1px solid ${category.color}`,
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              } : {
                backgroundColor: '#f0f5f1',
                border: '1px solid #c3d9c7',
                color: '#304b35'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#e1ece3';
                  e.currentTarget.style.borderColor = '#6aa074';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f0f5f1';
                  e.currentTarget.style.borderColor = '#c3d9c7';
                }
              }}
              aria-pressed={isSelected}
              aria-label={`Filter by ${category.name}`}
            >
              <span>{category.name}</span>
              {count > 0 && (
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${isSelected
                    ? 'bg-white/30 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Clear filters button */}
        {selectedCategoryIds.length > 0 && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
            style={{ backgroundColor: '#b4cfb9', color: '#304b35' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6aa074';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#b4cfb9';
              e.currentTarget.style.color = '#304b35';
            }}
            aria-label="Clear all filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Skloni filtere
          </button>
        )}
      </div>

      {/* Active filters summary */}
      {selectedCategoryIds.length > 0 && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Prikazuju se postovi u {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'categoriji' : 'categorije'}
        </div>
      )}
    </div>
  );
}
