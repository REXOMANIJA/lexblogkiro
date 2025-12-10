-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on post_id for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Anyone can delete comments" ON comments;

-- Policy: Anyone can read comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

-- Policy: Anyone can create comments
CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can delete comments (for both admin and user deletions)
CREATE POLICY "Anyone can delete comments"
  ON comments FOR DELETE
  USING (true);

-- Additional commands to fix delete policy if needed
-- Drop the old policy (if it exists with different name)
DROP POLICY IF EXISTS "Authenticated users can delete comments" ON comments;

-- Ensure the correct delete policy exists
DROP POLICY IF EXISTS "Anyone can delete comments" ON comments;
CREATE POLICY "Anyone can delete comments"
  ON comments FOR DELETE
  USING (true);