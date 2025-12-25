import { useState } from 'react';
import { sendNewsletterEmail } from '../services/newsletter';
import type { NewsletterEmailData } from '../types';

interface NewsletterSendButtonProps {
  postId: string;
  postTitle: string;
  postContent: string;
}

export function NewsletterSendButton({ postId, postTitle, postContent }: NewsletterSendButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSendNewsletter() {
    setLoading(true);
    setMessage(null);

    try {
      // Construct the full post URL
      const postUrl = `${window.location.origin}/post/${postId}`;
      
      // Use a default site title - in a real app this would come from config
      const siteTitle = 'Personal Blog';

      const emailData: NewsletterEmailData = {
        postId,
        postTitle,
        postContent,
        postUrl,
        siteTitle
      };

      await sendNewsletterEmail(emailData);
      setMessage({ 
        type: 'success', 
        text: 'Newsletter sent successfully to all subscribers!' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send newsletter';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 p-4 rounded-lg border" style={{ 
      backgroundColor: 'rgba(106, 160, 116, 0.05)', 
      borderColor: 'rgba(106, 160, 116, 0.2)' 
    }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#304b35' }}>
            Newsletter Distribution
          </h3>
          <p className="text-sm" style={{ color: '#507c58' }}>
            Send this post to all newsletter subscribers
          </p>
        </div>
        
        <button
          onClick={handleSendNewsletter}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          style={{ backgroundColor: '#6aa074', color: 'white' }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#507c58';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#6aa074';
            }
          }}
          data-testid="send-newsletter-button"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Newsletter
            </>
          )}
        </button>
      </div>

      {/* Message display */}
      {message && (
        <div 
          className={`p-3 rounded-lg flex items-start gap-3 animate-scale-in`}
          style={message.type === 'success' ? {
            backgroundColor: 'rgba(106, 160, 116, 0.1)',
            borderColor: 'rgba(106, 160, 116, 0.3)',
            color: '#304b35',
            border: '1px solid'
          } : {
            backgroundColor: 'rgba(220, 38, 127, 0.1)',
            borderColor: 'rgba(220, 38, 127, 0.3)',
            color: '#7f1d1d',
            border: '1px solid'
          }}
          data-testid="newsletter-message"
        >
          <svg 
            className="w-5 h-5 flex-shrink-0 mt-0.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {message.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
    </div>
  );
}