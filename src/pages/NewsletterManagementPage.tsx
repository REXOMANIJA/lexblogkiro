import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActiveSubscribers, getSubscriberCount } from '../services/newsletter';
import type { NewsletterSubscriber } from '../types';

export function NewsletterManagementPage() {
  const navigate = useNavigate();
  const { isAdminMode } = useAuth();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriberList, setShowSubscriberList] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdminMode) {
      navigate('/');
    }
  }, [isAdminMode, navigate]);

  // Load subscriber count on mount
  useEffect(() => {
    loadSubscriberCount();
  }, []);

  async function loadSubscriberCount() {
    try {
      setLoading(true);
      setError(null);
      const count = await getSubscriberCount();
      setSubscriberCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriber count');
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscribers() {
    try {
      setError(null);
      const data = await getActiveSubscribers();
      setSubscribers(data);
      setShowSubscriberList(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers');
    }
  }

  function exportSubscribers() {
    try {
      setExportLoading(true);
      setError(null);

      // Create CSV content with subscriber data (without exposing full emails)
      const csvContent = [
        'ID,Email Domain,Subscribed Date,Status',
        ...subscribers.map(subscriber => {
          // Only show domain part of email for privacy
          const emailDomain = subscriber.email.split('@')[1] || 'unknown';
          const subscribedDate = new Date(subscriber.subscribed_at).toLocaleDateString();
          return `${subscriber.id},@${emailDomain},${subscribedDate},${subscriber.is_active ? 'Active' : 'Inactive'}`;
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export subscribers');
    } finally {
      setExportLoading(false);
    }
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
              Newsletter Management
            </h1>
            <p style={{ color: '#507c58' }}>
              Manage newsletter subscribers and view statistics
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

        {/* Subscriber Count Card */}
        <div className="mb-8 p-6 rounded-lg shadow-lg border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderColor: 'rgba(180, 207, 185, 0.6)',
          boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#304b35' }}>
                Total Subscribers
              </h2>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-t-transparent" style={{ borderColor: '#d2e2d5', borderTopColor: '#6aa074' }}></div>
                  <span style={{ color: '#507c58' }}>Loading...</span>
                </div>
              ) : (
                <div className="text-4xl font-bold" style={{ color: '#6aa074' }} data-testid="subscriber-count">
                  {subscriberCount}
                </div>
              )}
            </div>
            <div className="text-right">
              <svg className="w-16 h-16 mx-auto mb-2" style={{ color: '#6aa074' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={loadSubscribers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#6aa074' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#507c58')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6aa074')}
            data-testid="view-subscribers-button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Subscriber List
          </button>

          {showSubscriberList && subscribers.length > 0 && (
            <button
              onClick={exportSubscribers}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 px-6 py-3 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#e1ece3', color: '#304b35' }}
              onMouseEnter={(e) => !exportLoading && (e.currentTarget.style.backgroundColor = '#d3e3d6')}
              onMouseLeave={(e) => !exportLoading && (e.currentTarget.style.backgroundColor = '#e1ece3')}
              data-testid="export-subscribers-button"
            >
              {exportLoading ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-4 border-t-transparent" style={{ borderColor: '#d2e2d5', borderTopColor: '#6aa074' }}></div>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Export Subscribers
            </button>
          )}
        </div>

        {/* Subscriber List */}
        {showSubscriberList && (
          <div className="rounded-lg shadow-lg overflow-hidden border" style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderColor: 'rgba(180, 207, 185, 0.6)',
            boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: '#e1ece3' }}>
              <h2 className="text-xl font-semibold" style={{ color: '#304b35' }}>
                Subscriber List ({subscribers.length})
              </h2>
              <p className="text-sm mt-1" style={{ color: '#507c58' }}>
                Email addresses are partially hidden for privacy
              </p>
            </div>

            {subscribers.length === 0 ? (
              <div className="p-8 text-center" style={{ color: '#507c58' }}>
                No active subscribers found.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#e1ece3' }} data-testid="subscriber-list">
                {subscribers.map((subscriber) => {
                  // Mask email for privacy - show first 2 chars and domain
                  const [localPart, domain] = subscriber.email.split('@');
                  const maskedEmail = `${localPart.substring(0, 2)}***@${domain}`;
                  
                  return (
                    <div
                      key={subscriber.id}
                      className="p-4 transition-colors"
                      style={{ borderColor: '#e1ece3' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 236, 227, 0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e1ece3' }}>
                              <svg className="w-5 h-5" style={{ color: '#6aa074' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium" style={{ color: '#304b35' }}>
                              {maskedEmail}
                            </p>
                            <p className="text-sm" style={{ color: '#507c58' }}>
                              Subscribed: {new Date(subscriber.subscribed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-3 py-1 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: subscriber.is_active ? '#e1ece3' : '#f0f5f1',
                              color: subscriber.is_active ? '#304b35' : '#507c58'
                            }}
                          >
                            {subscriber.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}