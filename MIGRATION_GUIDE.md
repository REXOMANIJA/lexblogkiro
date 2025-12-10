# Database Migration Guide

## Overview

This guide explains how to apply the database schema updates for the new features:
- Cover image support with positioning
- Category system for filtering posts

## For New Installations

If you're setting up the database for the first time, simply run the complete setup script:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" to execute

This will create all tables, indexes, and policies with the new schema.

## For Existing Installations

If you already have a `posts` table with data, use the migration script to add the new features:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `supabase-migration-categories.sql`
4. Click "Run" to execute

This migration will:
- Add `cover_image_url` column to posts table
- Add `cover_image_position` column with default value `{"x": 50, "y": 50, "zoom": 100}`
- Add `category_ids` column to posts table
- Create GIN index on `category_ids` for efficient filtering
- Create `categories` table with proper schema
- Create index on `categories.slug`
- Enable RLS on categories table
- Create RLS policies for categories (public read, admin write)

## Verification

After running the migration, verify the changes:

```sql
-- Check posts table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts';

-- Check categories table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('posts', 'categories');

-- Check RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('posts', 'categories');
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove new columns from posts table
ALTER TABLE posts DROP COLUMN IF EXISTS cover_image_url;
ALTER TABLE posts DROP COLUMN IF EXISTS cover_image_position;
ALTER TABLE posts DROP COLUMN IF EXISTS category_ids;

-- Drop indexes
DROP INDEX IF EXISTS idx_posts_categories;
DROP INDEX IF EXISTS idx_categories_slug;

-- Drop categories table
DROP TABLE IF EXISTS categories CASCADE;
```

## Notes

- Existing posts will have `NULL` for `cover_image_url` and `category_ids`
- The `cover_image_position` will default to `{"x": 50, "y": 50, "zoom": 100}` for all posts
- No data will be lost during the migration
- The migration is idempotent - you can run it multiple times safely
