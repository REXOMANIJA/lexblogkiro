import { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchComments, createComment, deleteComment } from '../services/supabase';
import type { Comment } from '../types';

interface CommentsProps {
  postId: string;
}

export function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userComments, setUserComments] = useState<string[]>([]);
  const { isAdminMode } = useAuth();
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
    // Load saved author name from localStorage
    const savedName = localStorage.getItem('blog_comment_author_name');
    if (savedName) {
      setAuthorName(savedName);
    }
    // Load user's comment IDs from localStorage
    const savedComments = localStorage.getItem(`blog_user_comments_${postId}`);
    if (savedComments) {
      setUserComments(JSON.parse(savedComments));
    }
  }, [postId]);

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

  async function loadComments() {
    try {
      setLoading(true);
      const fetchedComments = await fetchComments(postId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!authorName.trim() || !content.trim()) {
      setError('Please fill in both name and comment fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const newComment = await createComment({
        post_id: postId,
        author_name: authorName.trim(),
        content: content.trim(),
      });

      // Save author name to localStorage for future use
      localStorage.setItem('blog_comment_author_name', authorName.trim());
      
      // Track this comment as belonging to the user
      const updatedUserComments = [...userComments, newComment.id];
      setUserComments(updatedUserComments);
      localStorage.setItem(`blog_user_comments_${postId}`, JSON.stringify(updatedUserComments));

      // Clear form and reload comments
      setContent('');
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setDeleting(commentId);
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      
      // Remove from user's tracked comments
      const updatedUserComments = userComments.filter(id => id !== commentId);
      setUserComments(updatedUserComments);
      localStorage.setItem(`blog_user_comments_${postId}`, JSON.stringify(updatedUserComments));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setDeleting(null);
    }
  }

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
      }, 0);
      
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="mt-12 sm:mt-16">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Leave a Comment
        </h4>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="author-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="author-name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your name"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comment
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Write your comment..."
                disabled={submitting}
                required
              />
              
              {/* Emoji button */}
              <div className="absolute top-2 right-2" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={submitting}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Add emoji"
                >
                  😊
                </button>
                
                {/* Emoji picker dropdown */}
                {showEmojiPicker && (
                  <div className="absolute top-full right-0 mt-1 z-50 shadow-lg rounded-lg overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      height={300}
                      width={280}
                      searchDisabled={false}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {comment.author_name}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>

                {(isAdminMode || userComments.includes(comment.id)) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleting === comment.id}
                    className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title={isAdminMode ? "Delete comment (Admin)" : "Delete your comment"}
                  >
                    {deleting === comment.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
                
                {userComments.includes(comment.id) && !isAdminMode && (
                  <span className="ml-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
                    Your comment
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}