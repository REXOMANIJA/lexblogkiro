import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { unsubscribeFromNewsletter } from '../services/newsletter';

export function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isAutoUnsubscribe, setIsAutoUnsubscribe] = useState(false);

  useEffect(() => {
    // Check if email is provided in URL parameters
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setIsAutoUnsubscribe(true);
      handleUnsubscribe(emailParam);
    }
  }, [searchParams]);

  async function handleUnsubscribe(emailToUnsubscribe?: string) {
    const targetEmail = emailToUnsubscribe || email;
    
    if (!targetEmail.trim()) {
      setMessage({ type: 'error', text: 'Unesite vašu email adresu' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await unsubscribeFromNewsletter(targetEmail);
      setMessage({ 
        type: 'success', 
        text: 'Uspešno ste se odjavili sa newsletter-a. Nećete više primati naša obaveštenja.' 
      });
      if (!isAutoUnsubscribe) {
        setEmail('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Neuspešno';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleUnsubscribe();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f5f1' }}>
      {/* Header */}
      <header className="py-6 px-4 border-b" style={{ borderColor: '#c3d9c7', backgroundColor: 'white' }}>
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/" 
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
            style={{ color: '#304b35' }}
          >
            Šunja i Siže
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div 
            className="p-8 rounded-xl shadow-lg"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid rgba(180, 207, 185, 0.6)',
              boxShadow: '0 8px 25px -5px rgba(48, 75, 53, 0.15), 0 4px 10px -2px rgba(48, 75, 53, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="text-center mb-8">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="#507c58"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 10l6 6 6-6" 
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold mb-3" style={{ color: '#304b35' }}>
                Odjava sa Newsletter-a
              </h1>
              <p className="text-lg" style={{ color: '#507c58' }}>
                Žao nam je što odlazite. Možete se odjaviti sa naših obaveštenja ovde.
              </p>
            </div>

            {!isAutoUnsubscribe && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#304b35' }}
                  >
                    Email adresa
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Unesite email adresu koju želite da odjavite"
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
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Odjavljujem...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Odjavi me sa newsletter-a
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Message display */}
            {message && (
              <div 
                className={`p-4 rounded-lg flex items-start gap-3 animate-scale-in ${!isAutoUnsubscribe ? 'mt-6' : ''}`}
                style={message.type === 'success' ? {
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                  color: '#166534',
                  border: '1px solid'
                } : message.type === 'error' ? {
                  backgroundColor: 'rgba(220, 38, 127, 0.1)',
                  borderColor: 'rgba(220, 38, 127, 0.3)',
                  color: '#7f1d1d',
                  border: '1px solid'
                } : {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  color: '#1e40af',
                  border: '1px solid'
                }}
              >
                <svg 
                  className="w-5 h-5 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {message.type === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : message.type === 'error' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div>
                  <p className="text-sm font-medium">{message.text}</p>
                  {message.type === 'success' && (
                    <p className="text-xs mt-2 opacity-80">
                      Možete se ponovo prijaviti na newsletter u bilo kom trenutku na našoj početnoj stranici.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Back to home */}
            <div className="text-center mt-8 pt-6 border-t" style={{ borderColor: '#e1ece3' }}>
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: '#507c58' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Nazad na početnu stranicu
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}