-- Allow Resubscribe Policy
-- This modifies the unsubscribe policy to allow both subscribing and unsubscribing

-- ============================================================================
-- Drop the restrictive unsubscribe policy and create a more flexible one
-- ============================================================================

-- Drop the old policy that only allowed setting is_active = false
DROP POLICY IF EXISTS "Public unsubscribe access" ON newsletter_subscribers;

-- Create a new policy that allows anonymous users to update their subscription status
-- They can both subscribe (is_active = true) and unsubscribe (is_active = false)
CREATE POLICY "Public subscription management" ON newsletter_subscribers
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);