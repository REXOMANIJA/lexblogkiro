import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '../services/supabase';
import type { Category } from '../types';

export function CategoryManagementPage() {
  const navigate = useNavigate();
  const { isAdminMode } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdminMode) {
      navigate('/');
    }
  }, [isAdminMode, navigate]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ name: '', slug: '', color: '#3B82F6' });
  }

  function handleStartEdit(category: Category) {
    setEditingId(category.id);
    setIsCreating(false);
    setFormData({
      name: category.name,
      slug: category.slug,
      color: category.color,
    });
  }

  function handleCancelForm() {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', color: '#3B82F6' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (editingId) {
        // Update existing category
        await updateCategory(editingId, formData);
      } else {
        // Create new category
        await createCategory(formData.name, formData.slug, formData.color);
      }
      
      // Reload categories and reset form
      await loadCategories();
      handleCancelForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      await deleteCategory(id);
      await loadCategories();
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug from name if creating new or slug is empty
      slug: (!editingId || prev.slug === '') ? generateSlug(name) : prev.slug,
    }));
  }

  if (!isAdminMode) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'radial-gradient(ellipse at top, #f0f5f1 0%, #e1ece3 30%, #d3e3d6 60%, #c3d9c7 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#304b35' }}>
              Category Management
            </h1>
            <p style={{ color: '#507c58' }}>
              Create and manage blog post categories
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 transition-colors"
            style={{ color: '#53815b' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#304b35'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#53815b'}
          >
            ← Back to Blog
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#c3d9c7' }}>
            <p style={{ color: '#507c58' }}>{error}</p>
          </div>
        )}

        {/* Create button */}
        {!isCreating && !editingId && (
          <div className="mb-6">
            <button
              onClick={handleStartCreate}
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: '#6aa074' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Category
            </button>
          </div>
        )}

        {/* Create/Edit form */}
        {(isCreating || editingId) && (
          <div className="mb-8 p-6 rounded-lg shadow-lg border" style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderColor: 'rgba(180, 207, 185, 0.6)',
            boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#304b35' }}>
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: '#304b35' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: '#c3d9c7', 
                    backgroundColor: '#f0f5f1', 
                    color: '#304b35'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6aa074';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(106, 160, 116, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#c3d9c7';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="e.g., Travel, Food, Technology"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1" style={{ color: '#304b35' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: '#c3d9c7', 
                    backgroundColor: '#f0f5f1', 
                    color: '#304b35'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6aa074';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(106, 160, 116, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#c3d9c7';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="e.g., travel, food, technology"
                />
                <p className="mt-1 text-sm" style={{ color: '#53815b' }}>
                  Auto-generated from name, but you can customize it
                </p>
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium mb-1" style={{ color: '#304b35' }}>
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      borderColor: '#c3d9c7', 
                      backgroundColor: '#f0f5f1', 
                      color: '#304b35'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#6aa074';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(106, 160, 116, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#c3d9c7';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 text-white font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#6aa074' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#507c58'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
                >
                  {editingId ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-6 py-2 font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#e1ece3', color: '#304b35' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d3e3d6';
                    e.currentTarget.style.color = '#304b35';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e1ece3';
                    e.currentTarget.style.color = '#304b35';
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories list */}
        <div className="rounded-lg shadow-lg overflow-hidden border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderColor: 'rgba(180, 207, 185, 0.6)',
          boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: '#e1ece3' }}>
            <h2 className="text-xl font-semibold" style={{ color: '#304b35' }}>
              Existing Categories ({categories.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: '#d2e2d5', borderTopColor: '#6aa074' }}></div>
              <p className="mt-2" style={{ color: '#507c58' }}>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#507c58' }}>
              No categories yet. Create your first category to get started!
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#e1ece3' }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-6 transition-colors"
                  style={{ borderColor: '#e1ece3' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 236, 227, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold" style={{ color: '#304b35' }}>
                          {category.name}
                        </h3>
                        <p className="text-sm font-mono" style={{ color: '#507c58' }}>
                          /{category.slug}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#53815b' }}>
                          {category.color}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="px-4 py-2 text-sm rounded-lg transition-colors"
                        style={{ backgroundColor: '#e1ece3', color: '#304b35' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#6aa074';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e1ece3';
                          e.currentTarget.style.color = '#304b35';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category.id)}
                        className="px-4 py-2 text-sm rounded-lg transition-colors"
                        style={{ backgroundColor: '#f0f5f1', color: '#507c58' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#b4cfb9';
                          e.currentTarget.style.color = '#304b35';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f5f1';
                          e.currentTarget.style.color = '#507c58';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirmId === category.id && (
                    <div className="mt-4 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#c3d9c7' }}>
                      <p className="mb-3" style={{ color: '#507c58' }}>
                        Are you sure you want to delete "{category.name}"? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="px-4 py-2 text-sm text-white rounded-lg transition-colors"
                          style={{ backgroundColor: '#b4cfb9' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6aa074'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b4cfb9'}
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-4 py-2 text-sm rounded-lg transition-colors"
                          style={{ backgroundColor: '#e1ece3', color: '#304b35' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#d3e3d6';
                            e.currentTarget.style.color = '#304b35';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#e1ece3';
                            e.currentTarget.style.color = '#304b35';
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
