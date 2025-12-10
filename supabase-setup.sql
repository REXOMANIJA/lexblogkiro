-- Personal Blog Database Setup
-- This file contains all SQL commands needed to set up the Supabase database and storage

-- ============================================================================
-- 1. Create posts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
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

-- ============================================================================
-- 2. Create indexes for efficient querying
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- GIN index for efficient category filtering
CREATE INDEX IF NOT EXISTS idx_posts_categories ON posts USING GIN(category_ids);

-- ============================================================================
-- 3. Create categories table
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on categories.slug for efficient lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- 4. Enable Row Level Security on posts table
-- ============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Enable Row Level Security on categories table
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Create RLS policies for posts table
-- ============================================================================

-- Policy: Allow public read access to all posts
CREATE POLICY "Public read access" ON posts
  FOR SELECT 
  USING (true);

-- Policy: Allow authenticated users to insert posts
CREATE POLICY "Admin insert access" ON posts
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update posts
CREATE POLICY "Admin update access" ON posts
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete posts
CREATE POLICY "Admin delete access" ON posts
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 7. Create RLS policies for categories table
-- ============================================================================

-- Policy: Allow public read access to all categories
CREATE POLICY "Public read access" ON categories
  FOR SELECT 
  USING (true);

-- Policy: Allow authenticated users to insert categories
CREATE POLICY "Admin insert access" ON categories
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update categories
CREATE POLICY "Admin update access" ON categories
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete categories
CREATE POLICY "Admin delete access" ON categories
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 8. Storage bucket setup (blog-photos)
-- ============================================================================
-- Note: Storage buckets must be created through the Supabase Dashboard or API
-- The following policies should be applied to the 'blog-photos' bucket:
--
-- Bucket Configuration:
-- - Name: blog-photos
-- - Public: true (for public read access)
-- - File size limit: 50MB (recommended)
-- - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Storage Policies (to be created in Supabase Dashboard):
--
-- 1. Public read access:
--    Policy name: "Public read access"
--    Allowed operation: SELECT
--    Policy definition: true
--
-- 2. Authenticated upload access:
--    Policy name: "Authenticated upload access"
--    Allowed operation: INSERT
--    Policy definition: auth.role() = 'authenticated'
--
-- 3. Authenticated update access:
--    Policy name: "Authenticated update access"
--    Allowed operation: UPDATE
--    Policy definition: auth.role() = 'authenticated'
--
-- 4. Authenticated delete access:
--    Policy name: "Authenticated delete access"
--    Allowed operation: DELETE
--    Policy definition: auth.role() = 'authenticated'

-- ============================================================================
-- 9. Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Create trigger to automatically update updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
