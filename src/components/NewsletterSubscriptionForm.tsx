import { useState } from 'react';
import { subscribeToNewsletter } from '../services/newsletter';

export function NewsletterSubscriptionForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Unesite vašu email adresu' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await subscribeToNewsletter(email);
      setMessage({ type: 'success', text: 'Uspešno ste se prijavili na Newsletter! Proverite email za potvrdu.' });
      setEmail('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Neuspešno';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-12 animate-fade-in">
      <div 
        className="max-w-2xl mx-auto p-6 sm:p-8 rounded-xl"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          border: '1px solid rgba(180, 207, 185, 0.6)',
          boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ color: '#304b35' }}>
            Ostani Obavešten
          </h2>
          <p className="text-sm sm:text-base" style={{ color: '#507c58' }}>
            Prijavite se da biste dobijali obaveštenja putem mail-a kada se objavi nova priča
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Unesite vašu email adresu"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#f0f5f1',
                  borderColor: '#c3d9c7',
                  color: '#304b35'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6aa074';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(106, 160, 116, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#c3d9c7';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                data-testid="email-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
              data-testid="subscribe-button"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Prijavljivanje...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Prijavi me
                </>
              )}
            </button>
          </div>

          {/* Message display */}
          {message && (
            <div 
              className={`p-4 rounded-lg flex items-start gap-3 animate-scale-in`}
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
              data-testid="message"
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
        </form>
      </div>
    </div>
  );
}