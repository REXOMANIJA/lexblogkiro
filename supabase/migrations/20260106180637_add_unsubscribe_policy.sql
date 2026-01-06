-- Newsletter Unsubscribe Policy Fix
-- This adds a policy to allow anonymous users to unsubscribe (deactivate their subscription)

-- ============================================================================
-- Add policy to allow public unsubscribe access
-- ============================================================================

-- Policy: Allow public update access for unsubscribing (setting is_active = false)
CREATE POLICY "Public unsubscribe access" ON newsletter_subscribers
  FOR UPDATE 
  USING (true)
  WITH CHECK (is_active = false);