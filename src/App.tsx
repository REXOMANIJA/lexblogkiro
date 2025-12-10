import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { EditPostPage } from './pages/EditPostPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';

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
            <Route path="/lex" element={<AdminLoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
