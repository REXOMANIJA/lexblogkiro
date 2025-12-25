import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostEditor } from './PostEditor';
import * as supabaseService from '../services/supabase';
import * as newsletterService from '../services/newsletter';

// Mock the services
vi.mock('../services/supabase', () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
  fetchAllCategories: vi.fn()
}));

vi.mock('../services/newsletter', () => ({
  sendNewsletterEmail: vi.fn()
}));

// Mock image compression to avoid file processing
vi.mock('../utils/imageCompression', () => ({
  compressImages: vi.fn().mockResolvedValue([])
}));

// Mock TipTap editor to avoid complex DOM manipulation
vi.mock('@tiptap/react', () => ({
  useEditor: () => ({
    getHTML: () => '<p>Test content for newsletter</p>',
    getText: () => 'Test content for newsletter',
    commands: {
      setContent: vi.fn(),
      clearContent: vi.fn()
    },
    isActive: () => false,
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn() }),
        setLink: () => ({ run: vi.fn() }),
        unsetLink: () => ({ run: vi.fn() }),
        insertContent: () => ({ run: vi.fn() })
      })
    })
  }),
  EditorContent: () => (
    <div data-testid="editor-content" role="textbox">
      <p>Test content for newsletter</p>
    </div>
  )
}));

describe('PostEditor Newsletter Integration Tests', () => {
  const mockCreatePost = vi.mocked(supabaseService.createPost);
  const mockUpdatePost = vi.mocked(supabaseService.updatePost);
  const mockFetchCategories = vi.mocked(supabaseService.fetchAllCategories);
  const mockSendNewsletter = vi.mocked(newsletterService.sendNewsletterEmail);

  const mockPost = {
    id: 'test-post-id',
    title: 'Test Post',
    story: '<p>Test content for newsletter</p>',
    photo_urls: ['https://example.com/test.jpg'],
    cover_image_url: 'https://example.com/test.jpg',
    cover_image_position: { x: 50, y: 50, zoom: 100 },
    category_ids: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCategories.mockResolvedValue([]);
    mockSendNewsletter.mockResolvedValue(undefined);
  });

  test('newsletter button appears after successful post creation', async () => {
    mockCreatePost.mockResolvedValue(mockPost);

    const { container } = render(<PostEditor mode="create" />);

    // Fill in the form with valid data
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Newsletter Post' } });

    // Mock adding a photo by directly manipulating the component state
    // We'll simulate the form submission with valid data
    const form = container.querySelector('form');
    expect(form).toBeTruthy();

    // Create a mock file and simulate file selection
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Submit the form
    fireEvent.submit(form!);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
    });

    // Check that newsletter button appears
    await waitFor(() => {
      expect(screen.getByTestId('send-newsletter-button')).toBeInTheDocument();
    });

    // Verify newsletter button has correct text
    expect(screen.getByText(/send newsletter/i)).toBeInTheDocument();
  });

  test('newsletter button appears after successful post update', async () => {
    const existingPost = { ...mockPost, title: 'Original Title' };
    const updatedPost = { ...mockPost, title: 'Updated Title' };
    
    mockUpdatePost.mockResolvedValue(updatedPost);

    render(<PostEditor mode="edit" editPost={existingPost} />);

    // Wait for form to be populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
    });

    // Update the title
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    // Submit the form
    const form = titleInput.closest('form');
    fireEvent.submit(form!);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/post updated successfully/i)).toBeInTheDocument();
    });

    // Check that newsletter button appears
    await waitFor(() => {
      expect(screen.getByTestId('send-newsletter-button')).toBeInTheDocument();
    });
  });

  test('complete flow from post creation to email sending', async () => {
    mockCreatePost.mockResolvedValue(mockPost);

    const { container } = render(<PostEditor mode="create" />);

    // Fill in the form
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Newsletter Integration Test' } });

    // Add story content by simulating typing in the editor
    const editorContent = container.querySelector('.ProseMirror') as HTMLElement;
    if (editorContent) {
      // Simulate typing in the TipTap editor
      editorContent.innerHTML = '<p>Test content for newsletter</p>';
      fireEvent.input(editorContent);
    }

    // Mock file selection
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Submit the form
    const form = container.querySelector('form');
    fireEvent.submit(form!);

    // Wait for success message first
    await waitFor(() => {
      expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
    });

    // Wait for newsletter button to appear
    await waitFor(() => {
      expect(screen.getByTestId('send-newsletter-button')).toBeInTheDocument();
    });

    // Click the newsletter button
    const newsletterButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(newsletterButton);

    // Verify the newsletter service was called with correct data
    await waitFor(() => {
      expect(mockSendNewsletter).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 'test-post-id',
          postTitle: 'Test Post',
          postContent: 'Test content for newsletter',
          siteTitle: 'Personal Blog'
        })
      );
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByTestId('newsletter-message')).toBeInTheDocument();
      expect(screen.getByText(/newsletter sent successfully/i)).toBeInTheDocument();
    });
  });

  test('newsletter button extracts first paragraph correctly', async () => {
    const postWithMultipleParagraphs = {
      ...mockPost,
      story: '<p>First paragraph content.</p><p>Second paragraph content.</p>'
    };
    
    mockCreatePost.mockResolvedValue(postWithMultipleParagraphs);

    const { container } = render(<PostEditor mode="create" />);

    // Fill in form
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Content Extraction Test' } });

    // Add story content by simulating typing in the editor
    const editorContent = container.querySelector('.ProseMirror') as HTMLElement;
    if (editorContent) {
      // Simulate typing in the TipTap editor
      editorContent.innerHTML = '<p>Test content for newsletter</p>';
      fireEvent.input(editorContent);
    }

    // Mock file selection
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Submit the form
    const form = container.querySelector('form');
    fireEvent.submit(form!);

    // Wait for success message first
    await waitFor(() => {
      expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
    });

    // Wait for newsletter button to appear
    await waitFor(() => {
      expect(screen.getByTestId('send-newsletter-button')).toBeInTheDocument();
    });

    // Click the newsletter button
    const newsletterButton = screen.getByTestId('send-newsletter-button');
    fireEvent.click(newsletterButton);

    // Verify the newsletter service was called with extracted first paragraph
    await waitFor(() => {
      expect(mockSendNewsletter).toHaveBeenCalledWith(
        expect.objectContaining({
          postContent: 'First paragraph content.'
        })
      );
    });
  });

  test('newsletter button integration in post creation workflow', async () => {
    mockCreatePost.mockResolvedValue(mockPost);

    const { container } = render(<PostEditor mode="create" />);

    // Verify initial state - no newsletter button
    expect(screen.queryByTestId('send-newsletter-button')).not.toBeInTheDocument();

    // Fill in form and submit
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Integration Test' } });

    // Add story content by simulating typing in the editor
    const editorContent = container.querySelector('.ProseMirror') as HTMLElement;
    if (editorContent) {
      // Simulate typing in the TipTap editor
      editorContent.innerHTML = '<p>Test content for newsletter</p>';
      fireEvent.input(editorContent);
    }

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    // Wait for success message first
    await waitFor(() => {
      expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
    });

    // Verify createPost was called
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
    });

    // Verify newsletter button appears after successful creation
    await waitFor(() => {
      expect(screen.getByTestId('send-newsletter-button')).toBeInTheDocument();
    });

    // Verify the button is functional
    expect(screen.getByText(/send newsletter/i)).toBeInTheDocument();
  });
});