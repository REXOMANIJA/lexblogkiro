import { useState, useRef, useEffect } from 'react';
import type { DragEvent, ChangeEvent, FormEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import DOMPurify from 'dompurify';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { createPost, updatePost, fetchAllCategories } from '../services/supabase';
import type { CreatePostInput, UpdatePostInput, BlogPost, Category } from '../types';
import { compressImages } from '../utils/imageCompression';

interface PostEditorProps {
  onSuccess?: () => void;
  editPost?: BlogPost;
  mode?: 'create' | 'edit';
}

export function PostEditor({ onSuccess, editPost, mode = 'create' }: PostEditorProps) {
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category selection
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);



  // Validation errors
  const [titleError, setTitleError] = useState<string | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (editor) {
      editor.chain().focus().insertContent(emojiData.emoji).run();
      setShowEmojiPicker(false);
    }
  };

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        hardBreak: {
          keepMarks: true,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-sky-600 underline hover:text-sky-700',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[250px] px-4 py-2.5 text-slate-800 leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      // Clear story error when user types
      if (editor.getText().trim()) {
        setStoryError(null);
      }
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const fetchedCategories = await fetchAllCategories();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (mode === 'edit' && editPost && editor) {
      setTitle(editPost.title);
      editor.commands.setContent(editPost.story);
      setExistingPhotoUrls(editPost.photo_urls);
      setSelectedCategoryIds(editPost.category_ids || []);
      // Cover image is always first in the array (index 0)
    }
  }, [mode, editPost, editor]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError(null);
    }

    // Validate story - check if editor has content
    if (!editor || !editor.getText().trim()) {
      setStoryError('Story is required');
      isValid = false;
    } else {
      setStoryError(null);
    }

    // Validate photos - in edit mode, check both existing and new photos
    const totalPhotos = existingPhotoUrls.length + photos.length;
    if (totalPhotos === 0) {
      setPhotosError('At least one photo is required');
      isValid = false;
    } else {
      setPhotosError(null);
    }

    return isValid;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Validate file types (JPEG, PNG, WebP)
    fileArray.forEach((file) => {
      if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp') {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file types: ${invalidFiles.join(', ')}. Only JPEG, PNG, and WebP are supported.`);
      return;
    }

    // Compress images before adding them
    setIsCompressing(true);
    setError(null);
    
    try {
      const compressedFiles = await compressImages(validFiles);
      
      // Add new photos to existing ones
      const newPhotos = [...photos, ...compressedFiles];
      setPhotos(newPhotos);

      // Create preview URLs
      const newPreviewUrls = compressedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);

      // Clear photos error if we now have photos
      const totalPhotos = existingPhotoUrls.length + newPhotos.length;
      if (totalPhotos > 0) {
        setPhotosError(null);
      }
    } catch (err) {
      setError('Failed to process images. Please try again.');
      console.error('Image compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewUrls[index]);

    setPhotos(newPhotos);
    setPreviewUrls(newPreviewUrls);

    // Cover image index remains 0 (first photo is always cover)
    // If we removed the cover, the next photo automatically becomes cover

    // Set error if no photos remain
    const totalPhotos = existingPhotoUrls.length + newPhotos.length;
    if (totalPhotos === 0) {
      setPhotosError('At least one photo is required');
    }
  };

  const handleRemoveExistingPhoto = (index: number) => {
    const newExistingUrls = existingPhotoUrls.filter((_, i) => i !== index);
    setExistingPhotoUrls(newExistingUrls);

    // Cover image index remains 0 (first photo is always cover)
    // If we removed the cover, the next photo automatically becomes cover

    // Set error if no photos remain
    const totalPhotos = newExistingUrls.length + photos.length;
    if (totalPhotos === 0) {
      setPhotosError('At least one photo is required');
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSetCoverImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Reorder existing photo URLs to place selected photo first
      const newUrls = [...existingPhotoUrls];
      const [coverUrl] = newUrls.splice(index, 1);
      newUrls.unshift(coverUrl);
      setExistingPhotoUrls(newUrls);
      // Cover is now at index 0
    } else {
      // Reorder new photos and preview URLs to place selected photo first
      const newPhotos = [...photos];
      const newPreviews = [...previewUrls];
      
      const [coverPhoto] = newPhotos.splice(index, 1);
      const [coverPreview] = newPreviews.splice(index, 1);
      
      newPhotos.unshift(coverPhoto);
      newPreviews.unshift(coverPreview);
      
      setPhotos(newPhotos);
      setPreviewUrls(newPreviews);
      // Cover is now at index 0
    }
  };

  const clearForm = () => {
    setTitle('');
    if (editor) {
      editor.commands.clearContent();
    }
    setPhotos([]);
    setExistingPhotoUrls([]);
    setSelectedCategoryIds([]);
    
    // Revoke all preview URLs to free memory
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);

    // Clear validation errors
    setTitleError(null);
    setStoryError(null);
    setPhotosError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get HTML from editor and sanitize it
      const rawHTML = editor?.getHTML() || '';
      const sanitizedHTML = DOMPurify.sanitize(rawHTML, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });

      if (mode === 'edit' && editPost) {
        // Update existing post
        const updateInput: UpdatePostInput = {
          id: editPost.id,
          title: title.trim(),
          story: sanitizedHTML,
          photos: photos.length > 0 ? photos : undefined,
          photo_urls: existingPhotoUrls,
          cover_image_url: existingPhotoUrls.length > 0 ? existingPhotoUrls[0] : undefined,
          category_ids: selectedCategoryIds,
        };

        await updatePost(updateInput);
        setSuccess('Post updated successfully!');
      } else {
        // Create new post
        const postInput: CreatePostInput = {
          title: title.trim(),
          story: sanitizedHTML,
          photos,
          cover_image_index: 0, // Cover image is always first after reordering
          category_ids: selectedCategoryIds,
        };

        await createPost(postInput);
        setSuccess('Post created successfully!');
        clearForm();
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode === 'edit' ? 'update' : 'create'} post`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 sm:mb-8">
        {mode === 'edit' ? 'Edit Post' : 'Create New Post'}
      </h2>

      {/* Success message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 animate-scale-in">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">{success}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 animate-scale-in">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Title field */}
        <div className="animate-slide-up">
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) {
                setTitleError(null);
              }
            }}
            className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
              titleError ? 'border-red-500 ring-2 ring-red-500' : ''
            }`}
            placeholder="Enter post title"
            disabled={isSubmitting}
          />
          {titleError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {titleError}
            </p>
          )}
        </div>

        {/* Story field with rich text editor */}
        <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <label htmlFor="story" className="block text-sm font-medium text-slate-700 mb-2">
            Story <span className="text-red-500">*</span>
          </label>
          
          {/* Formatting toolbar */}
          {editor && (
            <div className="bg-slate-100 border border-slate-300 rounded-t-lg p-2 flex flex-wrap gap-1 relative">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  editor.isActive('bold')
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
                title="Bold (Ctrl+B)"
              >
                B
              </button>

              <div className="w-px bg-slate-300 mx-1"></div>

              {/* Link button */}
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Enter URL:');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  editor.isActive('link')
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
                title="Add Link"
              >
                🔗
              </button>

              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  title="Remove Link"
                >
                  Unlink
                </button>
              )}
              
              {/* Emoji button */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded text-sm bg-white text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Add emoji"
                >
                  😊
                </button>
                
                {/* Emoji picker dropdown */}
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-1 z-50 shadow-lg rounded-lg overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      height={400}
                      width={320}
                      searchDisabled={false}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Editor content area */}
          <div
            className={`bg-slate-50 border border-t-0 border-slate-300 rounded-b-lg text-slate-800 font-serif focus-within:ring-2 focus-within:ring-sky-500 transition-all ${
              storyError ? 'border-red-500 ring-2 ring-red-500' : ''
            }`}
          >
            <EditorContent editor={editor} />
          </div>
          
          {storyError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {storyError}
            </p>
          )}
        </div>

        {/* Category selection field */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Categories
          </label>
          
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-sky-600"></div>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No categories available. Create categories in the admin panel.</p>
          ) : (
            <div className="space-y-3">
              {/* Category chips */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryToggle(category.id)}
                      disabled={isSubmitting}
                      className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                        transition-all duration-200 transform hover:scale-105
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        ${isSelected
                          ? 'text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400'
                        }
                      `}
                      style={isSelected ? {
                        backgroundColor: category.color,
                        borderColor: category.color,
                      } : undefined}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${category.name}`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Selected categories summary */}
              {selectedCategoryIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>
                    {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'category' : 'categories'} selected
                  </span>
                  {selectedCategoryIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryIds([])}
                      disabled={isSubmitting}
                      className="ml-2 text-sky-600 hover:text-sky-700 font-medium transition-colors disabled:opacity-50"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photo upload field */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Photos <span className="text-red-500">*</span>
          </label>

          {/* Drag and drop area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-300 ${
              isDragging
                ? 'border-sky-500 bg-sky-50 scale-[1.02]'
                : photosError
                ? 'border-red-500 bg-red-50'
                : 'border-slate-300 bg-slate-50 hover:border-sky-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="photos"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isSubmitting || isCompressing}
            />

            <div className="text-slate-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
                {isCompressing ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-sky-600"></div>
                ) : (
                  <svg
                    className="h-8 w-8 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <p className="mb-2 text-base">
                {isCompressing ? (
                  <span className="text-sky-600 font-semibold">Optimizing images...</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                      disabled={isSubmitting || isCompressing}
                    >
                      Click to upload
                    </button>{' '}
                    <span className="text-slate-500">or drag and drop</span>
                  </>
                )}
              </p>
              <p className="text-sm text-slate-500">
                {isCompressing ? 'Please wait...' : 'JPEG, PNG, or WebP (images will be optimized)'}
              </p>
            </div>
          </div>
          {photosError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {photosError}
            </p>
          )}

          {/* Existing photo previews (in edit mode) */}
          {existingPhotoUrls.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Existing Photos</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {existingPhotoUrls.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <img
                      src={url}
                      alt={`Existing ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-all ${
                        index === 0 ? 'ring-4 ring-sky-500' : ''
                      }`}
                    />
                    {/* Cover image badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-sky-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Cover
                      </div>
                    )}
                    {/* Set as cover button */}
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverImage(index, true)}
                        className="absolute top-2 left-2 bg-slate-700 hover:bg-sky-600 text-white text-xs font-medium px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg flex items-center gap-1"
                        disabled={isSubmitting}
                        aria-label="Set as cover image"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Cover
                      </button>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                      disabled={isSubmitting}
                      aria-label="Remove existing photo"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New photo previews */}
          {previewUrls.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700 mb-3">
                New Photos
                {existingPhotoUrls.length === 0 && (
                  <span className="ml-2 text-xs text-slate-500">(First photo will be the cover)</span>
                )}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {previewUrls.map((url, index) => (
                  <div key={`new-${index}`} className="relative group animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-all ${
                        existingPhotoUrls.length === 0 && index === 0 ? 'ring-4 ring-sky-500' : ''
                      }`}
                    />
                    {/* Cover image badge (only show if no existing photos) */}
                    {existingPhotoUrls.length === 0 && index === 0 && (
                      <div className="absolute top-2 left-2 bg-sky-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Cover
                      </div>
                    )}
                    {/* Set as cover button (only show if no existing photos and not already cover) */}
                    {existingPhotoUrls.length === 0 && index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverImage(index, false)}
                        className="absolute top-2 left-2 bg-slate-700 hover:bg-sky-600 text-white text-xs font-medium px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg flex items-center gap-1"
                        disabled={isSubmitting}
                        aria-label="Set as cover image"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Cover
                      </button>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                      disabled={isSubmitting}
                      aria-label="Remove photo"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* Submit button */}
        <div className="flex justify-end pt-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-8 py-3 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:translate-y-0"
          >
            {isSubmitting 
              ? (mode === 'edit' ? 'Updating Post...' : 'Creating Post...') 
              : (mode === 'edit' ? 'Update Post' : 'Create Post')
            }
          </button>
        </div>
      </form>
    </div>
  );
}

