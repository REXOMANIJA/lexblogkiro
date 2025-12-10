# Implementation Plan

- [x] 1. Set up project structure and Supabase configuration





  - Initialize React + TypeScript + Vite project with Tailwind CSS
  - Install dependencies: @supabase/supabase-js, react-router-dom, fast-check (for property testing)
  - Create Supabase project and obtain API keys
  - Configure Supabase client with environment variables
  - Set up project folder structure (components, pages, services, types)
  - _Requirements: All_

- [x] 2. Set up Supabase database and storage
  - Create `posts` table with schema (id, title, story, photo_urls, created_at, updated_at)
  - Create index on created_at for efficient sorting
  - Enable Row Level Security on posts table
  - Create RLS policies for public read and authenticated write/update/delete
  - Create `blog-photos` storage bucket with public read access
  - Configure storage policies for authenticated uploads
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 8.1_

- [x] 2.1 Update database schema for new features





  - Add `cover_image_url` TEXT column to posts table
  - Add `cover_image_position` JSONB column with default value
  - Add `category_ids` UUID[] column to posts table
  - Create GIN index on category_ids for efficient filtering
  - Create `categories` table with id, name, slug, color, created_at
  - Create index on categories.slug
  - Enable RLS on categories table with public read and admin write policies
  - _Requirements: 9.1, 9.2, 10.3, 11.1, 11.2_

- [x] 3. Implement core data types and Supabase service
  - Define TypeScript interfaces (BlogPost, CreatePostInput, UpdatePostInput, AuthState)
  - Create Supabase service module with functions for CRUD operations
  - Implement fetchAllPosts() with ordering by created_at DESC
  - Implement createPost() with photo upload to storage
  - Implement updatePost() with photo management
  - Implement deletePost() with storage cleanup
  - _Requirements: 1.1, 3.4, 4.4, 5.3, 6.1, 6.2, 6.3, 6.5_

- [x] 3.6 Update data types for new features





  - Update BlogPost interface to include cover_image_url, cover_image_position, category_ids
  - Create Category interface (id, name, slug, color, created_at)
  - Update CreatePostInput to include cover_image_index, cover_image_position, category_ids
  - Update UpdatePostInput to include cover_image_url, cover_image_position, category_ids
  - Update story field type to indicate it stores HTML content
  - _Requirements: 9.1, 10.1, 11.1, 13.2_

- [x] 3.7 Implement category service functions




  - Implement fetchAllCategories() with ordering by name
  - Implement createCategory(name, slug, color)
  - Implement updateCategory(id, updates)
  - Implement deleteCategory(id)
  - Implement fetchPostsByCategory(categoryId) with filtering
  - _Requirements: 9.1, 9.2, 10.5_

- [x] 3.8 Update post service for new features





  - Update createPost() to handle cover_image_url and cover_image_position
  - Update createPost() to handle category_ids array
  - Update updatePost() to handle cover image changes
  - Update updatePost() to handle category updates
  - Update fetchAllPosts() to include new fields
  - _Requirements: 10.3, 11.2, 11.5_

- [x] 3.1 Write property test for post ordering


  - **Property 1: Posts are sorted in reverse chronological order**
  - **Validates: Requirements 1.1, 6.2**

- [x] 3.2 Write property test for post creation persistence



  - **Property 5: Created posts appear in the feed**
  - **Validates: Requirements 3.4, 6.1**

- [x] 3.3 Write property test for post updates

  - **Property 8: Post updates are persisted**
  - **Validates: Requirements 4.4, 4.5, 6.4**

- [x] 3.4 Write property test for post deletion

  - **Property 9: Deleted posts are removed from the feed**
  - **Validates: Requirements 5.3, 5.4**

- [x] 3.5 Write property test for storage cleanup on deletion
  - **Property 10: Deletion removes both database record and storage files**
  - **Validates: Requirements 6.5**

- [x] 3.9 Write property test for category filtering





  - **Property 16: Category filter shows only matching posts**
  - **Validates: Requirements 9.2**

- [x] 3.10 Write property test for clearing filters





  - **Property 17: Clearing filters returns all posts**
  - **Validates: Requirements 9.3**

- [x] 3.11 Write property test for multi-category posts





  - **Property 18: Multi-category posts appear in all their category filters**
  - **Validates: Requirements 9.5**

- [x] 3.12 Write property test for category persistence





  - **Property 19: Category assignments persist after save**
  - **Validates: Requirements 10.3**

- [x] 4. Implement authentication service and context





  - Create auth service module using Supabase Auth
  - Implement login() and logout() functions
  - Create AuthContext for managing authentication state
  - Implement session persistence and restoration on page load
  - Create useAuth() hook for components
  - _Requirements: 2.5, 8.1, 8.3, 8.4_

- [x] 4.1 Write property test for session persistence


  - **Property 13: Admin session persists across page refreshes**
  - **Validates: Requirements 2.5**

- [x] 4.2 Write property test for unauthenticated access denial


  - **Property 14: Unauthenticated users cannot access admin features**
  - **Validates: Requirements 8.1**

- [x] 5. Create routing and page structure





  - Set up React Router with routes for home (/) and admin login (/lex)
  - Create HomePage component (public blog view)
  - Create AdminLoginPage component (hidden at /lex)
  - Implement protected route logic for admin features
  - _Requirements: 2.1, 8.1_

- [x] 6. Build BlogPostList component
  - Create component to display all posts in a grid/list layout
  - Fetch posts from Supabase on component mount
  - Display post previews (title, first photo, excerpt)
  - Implement empty state when no posts exist
  - Add loading state during fetch
  - Make component responsive (mobile, tablet, desktop)
  - _Requirements: 1.1, 1.5, 7.4_

- [x] 6.3 Add CategoryFilter component





  - Create component to display available categories as filter chips
  - Fetch categories from Supabase
  - Implement multi-select category filtering
  - Show active filter state visually
  - Add "Clear all filters" button
  - Display post count per category (optional)
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 6.4 Integrate category filtering with BlogPostList





  - Update BlogPostList to accept category filter prop
  - Filter posts based on selected categories
  - Show empty state when no posts match selected categories
  - Update URL params to reflect active filters (optional)
  - _Requirements: 9.2, 9.4_

- [x] 6.5 Write property test for category display on posts





  - **Property 20: Assigned categories are displayed on posts**
  - **Validates: Requirements 10.4**

- [x] 6.1 Write property test for content rendering


  - **Property 3: All post content is rendered**
  - **Validates: Requirements 1.2, 1.4**

- [x] 6.2 Write property test for responsive layout


  - **Property 12: Layout adapts to screen size**
  - **Validates: Requirements 7.4**

- [x] 7. Build BlogPostDetail component
  - Create component to display full post (title, all photos, complete story)
  - Implement PhotoGallery sub-component for multiple photos
  - Add lightbox functionality for full-size photo viewing
  - Style with clean, readable typography
  - Make component responsive
  - _Requirements: 1.2, 1.4, 7.5_

- [x] 7.1 Enhance PhotoGallery with carousel navigation





  - Refactor PhotoGallery to carousel-style display
  - Display center photo prominently at full size
  - Scale down and blur adjacent photos (left and right)
  - Add navigation arrows (previous/next)
  - Implement smooth transition animations between photos
  - Handle edge cases (single photo, two photos)
  - Make responsive for mobile devices
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 7.2 Write property test for gallery center display





  - **Property 24: Gallery displays center photo prominently**
  - **Validates: Requirements 12.1, 12.4**

- [x] 7.3 Write property test for gallery navigation





  - **Property 25: Gallery navigation updates active photo**
  - **Validates: Requirements 12.3**

- [x] 7.4 Write property test for navigation arrow visibility





  - **Property 26: Navigation arrows shown only for multiple photos**
  - **Validates: Requirements 12.2**

- [x] 7.5 Update BlogPostDetail to render rich text HTML





  - Parse and render story HTML content safely
  - Implement HTML sanitization (DOMPurify)
  - Style formatted content (headings, bold, italic, lists, links)
  - Ensure responsive text rendering
  - _Requirements: 13.4_

- [x] 8. Implement admin controls visibility logic
  - Add conditional rendering of admin controls based on auth state
  - Ensure no admin UI elements appear when not authenticated
  - Display edit and delete buttons on each post in admin mode
  - Add subtle logout button in corner when authenticated
  - _Requirements: 1.3, 2.2, 4.1, 5.1_

- [x] 8.2 Add category management interface for admin




  - Create category management page/modal
  - Display list of existing categories
  - Add form to create new categories (name, slug, color)
  - Add edit functionality for existing categories
  - Add delete functionality with confirmation
  - Link to category management from admin controls
  - _Requirements: 10.5_

- [x] 8.1 Write property test for admin controls visibility


  - **Property 2: Admin controls are visible only when authenticated**
  - **Validates: Requirements 1.3, 2.2, 4.1, 5.1**

- [x] 9. Build PostEditor component for creating posts
  - Create form with fields for title, story, and photo uploads
  - Implement file input with drag-and-drop support
  - Add image preview before upload
  - Implement client-side validation for required fields
  - Handle form submission and photo upload to Supabase
  - Display success/error messages
  - Clear form after successful creation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9.3 Update PostEditor with improved styling





  - Replace dark blue background with light background (#ffffff or #f8fafc)
  - Update text color to dark gray (#1e293b) for readability
  - Ensure all form elements have sufficient contrast
  - Test contrast ratios meet WCAG AA standards (4.5:1 minimum)
  - _Requirements: 13.1_

- [x] 9.4 Write property test for editor contrast





  - **Property 27: Editor text has sufficient contrast**
  - **Validates: Requirements 13.1**

- [x] 9.5 Integrate rich text editor for story field




  - Install and configure TipTap or similar rich text editor
  - Add formatting toolbar (bold, italic, underline, headings, lists, links)
  - Configure editor to output HTML
  - Implement HTML sanitization on save (DOMPurify)
  - Style editor interface to match design
  - _Requirements: 13.2, 13.3_

- [x] 9.6 Add category selection to PostEditor




  - Add multi-select dropdown for categories
  - Fetch available categories from Supabase
  - Allow selecting multiple categories per post
  - Display selected categories as chips/tags
  - Include category_ids in form submission
  - _Requirements: 10.1, 10.2_

- [x] 9.7 Add cover image designation to PostEditor





  - Add UI to designate which uploaded photo is the cover
  - Reorder photos array to place cover image first
  - Add visual indicator for cover image in preview
  - Update form submission to include cover_image_url
  - _Requirements: 11.1, 11.2_

- [x] 9.8 Build CoverImageEditor component





  - Create visual editor for positioning cover image
  - Add drag functionality to reposition image
  - Add zoom slider (50% - 200%)
  - Add x/y position sliders (0-100)
  - Show live preview of positioning
  - Add "Reset to default" button
  - Save position data as JSONB (x, y, zoom)
  - _Requirements: 11.3, 11.4_

- [x] 9.9 Write property test for cover image positioning





  - **Property 21: Cover image is positioned first**
  - **Validates: Requirements 11.2**

- [x] 9.10 Write property test for cover positioning applied


  - **Property 22: Cover image positioning is applied**
  - **Validates: Requirements 11.4**

- [ ]* 9.11 Write property test for rich text persistence


  - **Property 28: Rich text formatting persists through save and load**
  - **Validates: Requirements 13.3, 13.4, 13.5**

- [x] 9.1 Write property test for required field validation


  - **Property 4: Posts with missing required fields are rejected**
  - **Validates: Requirements 3.2, 3.3**

- [x] 9.2 Write property test for image format support


  - **Property 6: Supported image formats are accepted**
  - **Validates: Requirements 3.5, 6.3**

- [x] 10. Implement post editing functionality
  - Add edit button to posts in admin mode
  - Create edit mode in PostEditor component
  - Pre-populate form with existing post data
  - Allow modification of title, story, and photos
  - Handle adding new photos and removing existing photos
  - Update photo_urls array correctly
  - Save changes to Supabase
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10.2 Update edit functionality for new features
  - Pre-populate category selection with existing categories
  - Pre-populate cover image designation
  - Pre-populate cover image position in CoverImageEditor
  - Load rich text HTML into editor with formatting intact
  - Handle updating cover image and position
  - Handle updating category assignments
  - _Requirements: 10.2, 11.3, 11.5, 13.5_

- [ ]* 10.3 Write property test for cover image updates
  - **Property 23: Cover image updates persist**
  - **Validates: Requirements 11.5**

- [x] 10.1 Write property test for edit form population


  - **Property 7: Edit form is populated with existing post data**
  - **Validates: Requirements 4.2**

- [x] 11. Implement post deletion functionality





  - Add delete button to posts in admin mode
  - Create confirmation dialog before deletion
  - Handle deletion of post from database
  - Clean up associated photos from Supabase Storage
  - Update UI to remove deleted post
  - Handle and display deletion errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11.1 Write property test for failed deletion


  - **Property 11: Failed deletion preserves post state**
  - **Validates: Requirements 5.5**

- [x] 12. Build AdminLoginPage component





  - Create login form at /lex route
  - Implement email/password authentication with Supabase
  - Handle login errors gracefully
  - Redirect to home page on successful login
  - Display no hints about this page in public UI
  - _Requirements: 2.1, 2.4, 8.1, 8.2, 8.3_

- [x] 13. Implement session management and logout





  - Add logout button in admin mode
  - Clear Supabase session on logout
  - Return to regular user view after logout
  - Handle session expiration automatically
  - _Requirements: 2.3, 2.5, 8.4_

- [x] 13.1 Write property test for session expiration


  - **Property 15: Session expiration returns to regular view**
  - **Validates: Requirements 8.4**

- [x] 14. Style the application with Tailwind CSS
  - Implement clean, minimal design for blog posts
  - Style photo galleries attractively
  - Create smooth transitions and animations
  - Ensure consistent spacing and typography
  - Implement dark mode support (optional enhancement)
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 14.1 Add gradient backgrounds to the application
  - Apply primary gradient background to main layout (purple/blue gradient)
  - Add semi-transparent post cards with backdrop blur
  - Ensure gradients enhance visual appeal without reducing readability
  - Test gradient appearance on different screen sizes
  - Consider secondary gradients for accent elements
  - _Requirements: 7.1, 7.5_

- [x] 15. Implement performance optimizations





  - Add lazy loading for images
  - Optimize image uploads (compression, resizing)
  - Implement caching for Supabase queries
  - Add pagination or infinite scroll for large post counts
  - _Requirements: 7.3_

- [x] 16. Add error handling and loading states





  - Implement error boundaries for React components
  - Add loading spinners during async operations
  - Display user-friendly error messages
  - Handle network failures gracefully
  - Implement retry logic for failed requests
  - _Requirements: 5.5_

- [x] 17.1 Checkpoint - Test new features
  - Test category filtering with various combinations
  - Test cover image positioning and persistence
  - Test enhanced photo gallery navigation
  - Test rich text editor formatting and persistence
  - Verify editor color contrast meets accessibility standards
  - Ask the user if questions arise

- [x] 17. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Verify all CRUD operations work correctly
  - Test authentication flow end-to-end
  - Test responsive design on different screen sizes
  - Verify admin mode is properly hidden from regular users
  - Ask the user if questions arise
