import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlogPostDetail } from './BlogPostDetail';
import type { BlogPost } from '../types';

// Mock the supabase service
vi.mock('../services/supabase', () => ({
  fetchAllCategories: vi.fn().mockResolvedValue([]),
  deletePost: vi.fn(),
}));

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isAdminMode: false,
    user: null,
    setUser: vi.fn(),
  })),
}));

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('BlogPostDetail Rich Text Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders HTML formatted content safely', () => {
    const post: BlogPost = {
      id: '123',
      title: 'Test Post',
      story: '<h2>Heading</h2><p>This is <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul>',
      photo_urls: ['https://example.com/photo.jpg'],
      cover_image_url: null,
      cover_image_position: { x: 50, y: 50, zoom: 100 },
      category_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { container } = render(
      <BrowserRouter>
        <BlogPostDetail post={post} />
      </BrowserRouter>
    );

    // Check that HTML elements are rendered
    expect(container.querySelector('h2')).toBeTruthy();
    expect(container.querySelector('strong')).toBeTruthy();
    expect(container.querySelector('em')).toBeTruthy();
    expect(container.querySelector('ul')).toBeTruthy();
    expect(container.querySelectorAll('li').length).toBe(2);
  });

  test('sanitizes dangerous HTML content', () => {
    const post: BlogPost = {
      id: '123',
      title: 'Test Post',
      story: '<p>Safe content</p><script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')">',
      photo_urls: ['https://example.com/photo.jpg'],
      cover_image_url: null,
      cover_image_position: { x: 50, y: 50, zoom: 100 },
      category_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { container } = render(
      <BrowserRouter>
        <BlogPostDetail post={post} />
      </BrowserRouter>
    );

    // Check that dangerous elements are removed
    expect(container.querySelector('script')).toBeNull();
    // Check that safe content is still present
    expect(container.textContent).toContain('Safe content');
  });

  test('renders links correctly', () => {
    const post: BlogPost = {
      id: '123',
      title: 'Test Post',
      story: '<p>Check out <a href="https://example.com">this link</a></p>',
      photo_urls: ['https://example.com/photo.jpg'],
      cover_image_url: null,
      cover_image_position: { x: 50, y: 50, zoom: 100 },
      category_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { container } = render(
      <BrowserRouter>
        <BlogPostDetail post={post} />
      </BrowserRouter>
    );

    const link = container.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.textContent).toBe('this link');
  });

  test('renders plain text when no HTML formatting is present', () => {
    const post: BlogPost = {
      id: '123',
      title: 'Test Post',
      story: 'This is plain text without any HTML formatting.',
      photo_urls: ['https://example.com/photo.jpg'],
      cover_image_url: null,
      cover_image_position: { x: 50, y: 50, zoom: 100 },
      category_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { container } = render(
      <BrowserRouter>
        <BlogPostDetail post={post} />
      </BrowserRouter>
    );

    expect(container.textContent).toContain('This is plain text without any HTML formatting.');
  });
});
