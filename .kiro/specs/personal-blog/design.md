# Personal Blog Design Document

## Overview

The personal blog is a web application that provides a public-facing blog interface for readers and a hidden admin mode for content management. The system uses a modern web stack with React for the frontend, Supabase for backend services (database, authentication, and file storage), and implements a creative hidden admin mode activation mechanism.

The application prioritizes a clean, distraction-free reading experience for regular users while providing powerful content management capabilities for the administrator through a seamlessly integrated admin interface.

## Architecture

### Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Backend Services**: Supabase
  - Database: PostgreSQL via Supabase
  - Authentication: Supabase Auth
  - File Storage: Supabase Storage
- **Build Tool**: Vite
- **Image Handling**: Supabase Storage with CDN delivery

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  Public Blog View │         │  Admin Mode Interface    │ │
│  │  - Post List      │         │  - Create Post Form      │ │
│  │  - Post Detail    │         │  - Edit Post Form        │ │
│  │  - Photo Gallery  │         │  - Delete Confirmation   │ │
│  └──────────────────┘         └──────────────────────────┘ │
│           │                              │                   │
│           └──────────────┬───────────────┘                   │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Database   │  │     Auth     │  │     Storage      │ │
│  │  (Posts)     │  │  (Admin)     │  │    (Photos)      │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Hidden Admin Mode Activation

The admin mode will be activated through a hidden URL path:
- **Hidden Route**: Navigating to `/lex` displays the admin login page
- No links or navigation elements point to this route in the public interface
- After successful authentication, redirect to home page with admin controls visible
- Admin session persists across navigation
- No visible UI elements hint at this route in regular mode

## Components and Interfaces

### Frontend Components

#### 1. BlogPostList Component
- Displays all published blog posts in reverse chronological order
- Shows post preview (title, first photo, excerpt)
- Handles empty state when no posts exist
- In admin mode: displays edit/delete controls for each post

#### 2. BlogPostDetail Component
- Renders full blog post with title, all photos, and complete story
- Implements responsive photo gallery
- Supports full-size photo viewing (lightbox)
- In admin mode: displays inline edit/delete buttons

#### 3. AdminLoginPage Component
- Hidden page accessible only at `/lex` route
- Handles Supabase authentication
- Minimal, secure login form
- Redirects to home page on successful authentication

#### 4. PostEditor Component
- Form for creating and editing blog posts
- Fields: 
  - Title (text input)
  - Story (rich text editor with formatting toolbar)
  - Photos (file upload with drag-and-drop, reorderable)
  - Cover image selector (designate which photo is cover)
  - Cover image position controls (x, y, zoom sliders)
  - Category multi-select
- Improved color scheme with readable text contrast
- Image upload with drag-and-drop support
- Real-time preview of post content
- Validation for required fields

#### 5. AdminControls Component
- Edit and delete buttons overlaid on posts in admin mode
- Delete confirmation dialog
- Logout button (subtle, in corner)
- Category management interface (create, edit, delete categories)

#### 6. PhotoGallery Component
- Enhanced carousel-style display
- Center image displayed prominently at full size
- Adjacent images (left and right) scaled down and blurred
- Navigation arrows to move between photos
- Smooth transition animations
- Supports various image formats (JPEG, PNG, WebP)
- Responsive behavior for mobile devices

#### 7. CategoryFilter Component
- Displays available categories as filter chips/buttons
- Shows active filter state
- Allows selecting multiple categories
- Clear all filters option
- Shows post count per category

#### 8. CoverImageEditor Component
- Visual editor for positioning cover image
- Drag to reposition
- Zoom slider (50% - 200%)
- Live preview of how cover will appear
- Reset to default position button

### Backend Schema (Supabase)

#### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL,
  cover_image_url TEXT,
  cover_image_position JSONB DEFAULT '{"x": 50, "y": 50, "zoom": 100}',
  category_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_categories ON posts USING GIN(category_ids);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
```

#### Storage Buckets
- **blog-photos**: Public bucket for storing blog post images
  - Path structure: `{post_id}/{filename}`
  - Public read access, authenticated write access

#### Row Level Security (RLS)
```sql
-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON posts
  FOR SELECT USING (true);

-- Allow authenticated admin to insert
CREATE POLICY "Admin insert access" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated admin to update
CREATE POLICY "Admin update access" ON posts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated admin to delete
CREATE POLICY "Admin delete access" ON posts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Public read access" ON categories
  FOR SELECT USING (true);

-- Allow authenticated admin to manage categories
CREATE POLICY "Admin insert access" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update access" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin delete access" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');
```

### API Interfaces

#### Supabase Client Operations

**Fetch All Posts**
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false });
```

**Create Post**
```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    title,
    story,
    photo_urls: uploadedPhotoUrls
  });
```

**Update Post**
```typescript
const { data, error } = await supabase
  .from('posts')
  .update({ title, story, photo_urls })
  .eq('id', postId);
```

**Delete Post**
```typescript
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

**Upload Photo**
```typescript
const { data, error } = await supabase.storage
  .from('blog-photos')
  .upload(`${postId}/${filename}`, file);
```

**Delete Photos**
```typescript
const { error } = await supabase.storage
  .from('blog-photos')
  .remove(photoPaths);
```

**Fetch Categories**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('name', { ascending: true });
```

**Create Category**
```typescript
const { data, error } = await supabase
  .from('categories')
  .insert({
    name,
    slug,
    color
  });
```

**Filter Posts by Category**
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .contains('category_ids', [categoryId])
  .order('created_at', { ascending: false });
```

## Data Models

### BlogPost Model
```typescript
interface BlogPost {
  id: string;
  title: string;
  story: string;  // Rich text HTML content
  photo_urls: string[];
  cover_image_url: string | null;
  cover_image_position: {
    x: number;  // Horizontal position (0-100)
    y: number;  // Vertical position (0-100)
    zoom: number;  // Zoom level (50-200)
  };
  category_ids: string[];
  created_at: string;
  updated_at: string;
}
```

### Category Model
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;  // Hex color code
  created_at: string;
}
```

### CreatePostInput Model
```typescript
interface CreatePostInput {
  title: string;
  story: string;  // Rich text HTML
  photos: File[];
  cover_image_index: number;  // Index of cover image in photos array
  cover_image_position?: {
    x: number;
    y: number;
    zoom: number;
  };
  category_ids: string[];
}
```

### UpdatePostInput Model
```typescript
interface UpdatePostInput {
  id: string;
  title: string;
  story: string;  // Rich text HTML
  photos?: File[];  // Optional: only if adding new photos
  photo_urls: string[];  // Existing photo URLs to keep
  cover_image_url: string;
  cover_image_position: {
    x: number;
    y: number;
    zoom: number;
  };
  category_ids: string[];
}
```

### AuthState Model
```typescript
interface AuthState {
  isAuthenticated: boolean;
  isAdminMode: boolean;
  user: User | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant:
- Admin controls visibility (2.2, 4.1, 5.1) → Combined into Property 2
- Post ordering (1.1, 6.2) → Single property covers both
- Required field validation (3.2, 3.3) → Combined into Property 4
- Post persistence after edit (4.4, 6.4) → Single property covers both
- Post removal after delete (5.3, 5.4) → Single property covers both

The following properties provide unique validation value without redundancy:

### Property 1: Posts are sorted in reverse chronological order
*For any* set of blog posts with different creation timestamps, fetching all posts should return them ordered with the newest post first and oldest post last.
**Validates: Requirements 1.1, 6.2**

### Property 2: Admin controls are visible only when authenticated
*For any* blog post, when the user is authenticated as admin, the rendered post should include edit and delete controls; when not authenticated, these controls should not be present in the DOM.
**Validates: Requirements 1.3, 2.2, 4.1, 5.1**

### Property 3: All post content is rendered
*For any* blog post with a title, story, and photo URLs, the rendered output should contain the title text, the complete story text, and all photo URLs.
**Validates: Requirements 1.2, 1.4**

### Property 4: Posts with missing required fields are rejected
*For any* post creation attempt, if the title is empty, or the story is empty, or no photos are provided, the system should reject the creation and not add the post to the database.
**Validates: Requirements 3.2, 3.3**

### Property 5: Created posts appear in the feed
*For any* valid blog post (with title, story, and at least one photo), after successfully creating the post, fetching all posts should include the newly created post with matching content.
**Validates: Requirements 3.4, 6.1**

### Property 6: Supported image formats are accepted
*For any* image file with format JPEG, PNG, or WebP, the system should successfully upload the file to Supabase Storage and return a valid URL.
**Validates: Requirements 3.5, 6.3**

### Property 7: Edit form is populated with existing post data
*For any* existing blog post, when loading the edit form, the form fields should be pre-filled with the post's current title, story, and photo URLs.
**Validates: Requirements 4.2**

### Property 8: Post updates are persisted
*For any* existing blog post, after modifying the title, story, or photos and saving, fetching the post should return the updated content, not the original content.
**Validates: Requirements 4.4, 4.5, 6.4**

### Property 9: Deleted posts are removed from the feed
*For any* existing blog post, after successfully deleting the post, fetching all posts should not include the deleted post.
**Validates: Requirements 5.3, 5.4**

### Property 10: Deletion removes both database record and storage files
*For any* blog post with associated photos, after deletion, both the database record and all photo files in Supabase Storage should be removed and not accessible.
**Validates: Requirements 6.5**

### Property 11: Failed deletion preserves post state
*For any* blog post, if deletion fails (e.g., network error), the post should remain in the database with all its original content unchanged.
**Validates: Requirements 5.5**

### Property 12: Layout adapts to screen size
*For any* viewport width (mobile, tablet, desktop), the blog layout should adjust appropriately with no horizontal overflow and readable text sizing.
**Validates: Requirements 7.4**

### Property 13: Admin session persists across page refreshes
*For any* authenticated admin session, after refreshing the page, the user should remain authenticated and admin controls should still be visible.
**Validates: Requirements 2.5**

### Property 14: Unauthenticated users cannot access admin features
*For any* admin operation (create, edit, delete), attempting the operation without valid authentication should be rejected by Supabase RLS policies.
**Validates: Requirements 8.1**

### Property 15: Session expiration returns to regular view
*For any* authenticated admin session, when the session expires, admin controls should no longer be visible and admin operations should be rejected.
**Validates: Requirements 8.4**

### Property 16: Category filter shows only matching posts
*For any* category and set of posts with various category assignments, filtering by that category should return only posts that include that category in their category_ids array.
**Validates: Requirements 9.2**

### Property 17: Clearing filters returns all posts
*For any* set of posts and any active category filter, clearing the filter should return the complete set of posts without any filtering applied.
**Validates: Requirements 9.3**

### Property 18: Multi-category posts appear in all their category filters
*For any* post with multiple categories, the post should appear in the results when filtering by any one of its assigned categories.
**Validates: Requirements 9.5**

### Property 19: Category assignments persist after save
*For any* post with assigned categories, after saving the post and fetching it from the database, the category_ids should match the originally assigned categories.
**Validates: Requirements 10.3**

### Property 20: Assigned categories are displayed on posts
*For any* post with assigned categories, the rendered post output should include visual representation of all assigned category names.
**Validates: Requirements 10.4**

### Property 21: Cover image is positioned first
*For any* post where a cover image is designated, the cover_image_url should match the first element in the photo_urls array.
**Validates: Requirements 11.2**

### Property 22: Cover image positioning is applied
*For any* post with cover_image_position data, the rendered cover image should apply CSS transforms that reflect the x, y, and zoom values.
**Validates: Requirements 11.4**

### Property 23: Cover image updates persist
*For any* post, after changing the cover image designation and saving, fetching the post should return the new cover_image_url, not the original.
**Validates: Requirements 11.5**

### Property 24: Gallery displays center photo prominently
*For any* post with three or more photos, the photo gallery should render with the active photo at full size and adjacent photos scaled down and with blur filter applied.
**Validates: Requirements 12.1, 12.4**

### Property 25: Gallery navigation updates active photo
*For any* post with multiple photos, clicking the next navigation arrow should increment the active photo index, and clicking previous should decrement it (with wrapping at boundaries).
**Validates: Requirements 12.3**

### Property 26: Navigation arrows shown only for multiple photos
*For any* post, navigation arrows should be present in the DOM when photo_urls.length > 1, and absent when photo_urls.length === 1.
**Validates: Requirements 12.2**

### Property 27: Editor text has sufficient contrast
*For any* text element in the post editor interface, the contrast ratio between text color and background color should meet WCAG AA standards (minimum 4.5:1 for normal text).
**Validates: Requirements 13.1**

### Property 28: Rich text formatting persists through save and load
*For any* story content with rich text formatting (bold, italic, headings, etc.), after saving the post, fetching it, and loading it in the editor, the formatting should be preserved in the HTML.
**Validates: Requirements 13.3, 13.4, 13.5**

## Error Handling

### Client-Side Error Handling

1. **Network Errors**
   - Display user-friendly error messages when Supabase requests fail
   - Implement retry logic for transient failures
   - Show loading states during async operations

2. **Validation Errors**
   - Validate form inputs before submission
   - Display inline error messages for invalid fields
   - Prevent submission of incomplete forms

3. **Authentication Errors**
   - Handle invalid credentials gracefully
   - Implement rate limiting on login attempts
   - Clear error messages without revealing security details

4. **File Upload Errors**
   - Validate file types before upload
   - Handle file size limits
   - Display progress and error states for uploads

### Server-Side Error Handling (Supabase)

1. **Database Errors**
   - Row Level Security policies enforce access control
   - Foreign key constraints maintain data integrity
   - Unique constraints prevent duplicate entries

2. **Storage Errors**
   - Bucket policies enforce access control
   - File size limits prevent abuse
   - Automatic cleanup of orphaned files

3. **Authentication Errors**
   - Session expiration handled automatically
   - Invalid tokens rejected
   - Rate limiting on authentication attempts

## Testing Strategy

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

### Unit Testing

Unit tests will verify specific examples, edge cases, and integration points:

- **Component Rendering**: Test that components render correctly with sample data
- **User Interactions**: Test button clicks, form submissions, and navigation
- **Edge Cases**: Empty states, single post, maximum content length
- **Authentication Flow**: Login, logout, session persistence
- **Error States**: Network failures, validation errors, permission denials

**Testing Framework**: Vitest with React Testing Library

### Property-Based Testing

Property-based tests will verify universal properties across all inputs:

- **Testing Framework**: fast-check (JavaScript property-based testing library)
- **Test Configuration**: Minimum 100 iterations per property test
- **Tagging Convention**: Each property test must include a comment with the format:
  `// Feature: personal-blog, Property {number}: {property_text}`

**Property Test Coverage**:
- Post ordering across random datasets
- Admin controls visibility with various auth states
- Content rendering with random post data
- Validation with various invalid inputs
- CRUD operations with random valid data
- Image upload with various file formats
- Session persistence across page loads
- Responsive layout across viewport sizes

**Example Property Test Structure**:
```typescript
// Feature: personal-blog, Property 1: Posts are sorted in reverse chronological order
test('posts are always sorted newest first', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryBlogPost(), { minLength: 2, maxLength: 20 }),
      async (posts) => {
        // Insert posts in random order
        await insertPosts(posts);
        
        // Fetch all posts
        const fetchedPosts = await getAllPosts();
        
        // Verify they are sorted by created_at descending
        for (let i = 0; i < fetchedPosts.length - 1; i++) {
          expect(new Date(fetchedPosts[i].created_at))
            .toBeGreaterThanOrEqual(new Date(fetchedPosts[i + 1].created_at));
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

- Test complete user flows (view posts, create post, edit post, delete post)
- Test admin mode activation and deactivation
- Test Supabase integration (database, auth, storage)
- Test responsive behavior across devices

### Manual Testing

- Visual design review
- UX flow testing
- Cross-browser compatibility
- Performance testing with large datasets

## Implementation Notes

### Admin Mode Activation

The hidden admin mode uses a secret URL path:
- Route: `/lex` displays the admin login page
- No links or references to this route in the public UI
- After login: Redirect to home page with admin controls enabled
- Session persists across navigation
- Logout button available in admin mode

### Photo Management

- Photos uploaded to Supabase Storage bucket: `blog-photos`
- Path structure: `{post_id}/{timestamp}_{filename}`
- Generate public URLs for display
- Cleanup orphaned photos when posts are deleted
- Support drag-and-drop upload in editor

### Visual Design

#### Gradient Backgrounds
- Main background: Subtle gradient (e.g., from soft blue to purple)
- Post cards: Semi-transparent with backdrop blur
- Editor interface: Light background with high contrast text
- Color palette:
  - Primary gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Secondary gradient: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
  - Editor background: `#ffffff` or `#f8fafc`
  - Editor text: `#1e293b` (dark gray for readability)

#### Rich Text Editor
- Toolbar with formatting options: Bold, Italic, Underline, Headings, Lists, Links
- Library: TipTap or similar React rich text editor
- Output format: HTML stored in database
- Sanitization: DOMPurify to prevent XSS attacks

### Responsive Design Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Performance Considerations

- Lazy load images as user scrolls
- Implement pagination or infinite scroll for large post counts
- Optimize images (compress, resize) before upload
- Cache Supabase queries where appropriate
- Use Supabase CDN for fast image delivery

### Security Considerations

- All admin operations protected by Supabase RLS
- No admin UI elements in production build for regular users
- Secure session management via Supabase Auth
- Rate limiting on authentication attempts
- Input sanitization to prevent XSS attacks
- HTTPS only in production
