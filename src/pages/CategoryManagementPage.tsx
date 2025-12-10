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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Category Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage blog post categories
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Blog
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Create button */}
        {!isCreating && !editingId && (
          <div className="mb-6">
            <button
              onClick={handleStartCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Travel, Food, Technology"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., travel, food, technology"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Auto-generated from name, but you can customize it
                </p>
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  {editingId ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Existing Categories ({categories.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No categories yet. Create your first category to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          /{category.slug}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {category.color}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category.id)}
                        className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirmId === category.id && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 mb-3">
                        Are you sure you want to delete "{category.name}"? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
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
