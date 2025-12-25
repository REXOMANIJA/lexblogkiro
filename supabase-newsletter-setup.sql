-- Newsletter Subscription Database Setup
-- This file contains SQL commands to set up the newsletter subscription feature

-- ============================================================================
-- 1. Create newsletter_subscribers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- 2. Create indexes for efficient querying
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

-- ============================================================================
-- 3. Enable Row Level Security on newsletter_subscribers table
-- ============================================================================

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create RLS policies for newsletter_subscribers table
-- ============================================================================

-- Policy: Allow public insert access for subscriptions
CREATE POLICY "Public subscription access" ON newsletter_subscribers
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Allow public read access for checking existing subscriptions
CREATE POLICY "Public read access for subscription check" ON newsletter_subscribers
  FOR SELECT 
  USING (true);

-- Policy: Allow authenticated users (admin) to view all subscribers
CREATE POLICY "Admin read access" ON newsletter_subscribers
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users (admin) to update subscriber status
CREATE POLICY "Admin update access" ON newsletter_subscribers
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users (admin) to delete subscribers
CREATE POLICY "Admin delete access" ON newsletter_subscribers
  FOR DELETE 
  USING (auth.role() = 'authenticated');