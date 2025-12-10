-- Migration: Add categories and cover image features
-- This migration adds new columns to the posts table and creates the categories table
-- Run this if you already have an existing posts table

-- ============================================================================
-- 1. Add new columns to posts table
-- ============================================================================

-- Add cover_image_url column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add cover_image_position column with default value
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS cover_image_position JSONB DEFAULT '{"x": 50, "y": 50, "zoom": 100}';

-- Add category_ids column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category_ids UUID[];

-- ============================================================================
-- 2. Create GIN index on category_ids for efficient filtering
-- ============================================================================

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

-- ============================================================================
-- 4. Create index on categories.slug
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- 5. Enable Row Level Security on categories table
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Create RLS policies for categories table
-- ============================================================================

-- Policy: Allow public read access to all categories
DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories
  FOR SELECT 
  USING (true);

-- Policy: Allow authenticated users to insert categories
DROP POLICY IF EXISTS "Admin insert access" ON categories;
CREATE POLICY "Admin insert access" ON categories
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update categories
DROP POLICY IF EXISTS "Admin update access" ON categories;
CREATE POLICY "Admin update access" ON categories
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete categories
DROP POLICY IF EXISTS "Admin delete access" ON categories;
CREATE POLICY "Admin delete access" ON categories
  FOR DELETE 
  USING (auth.role() = 'authenticated');
