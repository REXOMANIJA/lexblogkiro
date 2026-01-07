import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { EditPostPage } from './pages/EditPostPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';
import { NewsletterManagementPage } from './pages/NewsletterManagementPage';
import { UnsubscribePage } from './pages/UnsubscribePage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/new" element={<CreatePostPage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/post/:id/edit" element={<EditPostPage />} />
            <Route path="/categories" element={<CategoryManagementPage />} />
            <Route path="/newsletter" element={<NewsletterManagementPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/lex" element={<AdminLoginPage />} />
            <Route path="*" element={<div style={{padding: '20px', textAlign: 'center'}}>
              <h1>404 - Stranica nije pronađena</h1>
              <p>Ruta: {window.location.pathname}</p>
              <a href="/">Nazad na početnu</a>
            </div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
