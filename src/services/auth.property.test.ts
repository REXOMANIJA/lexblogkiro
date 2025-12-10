import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { supabase } from './supabase';
import { login, logout, getCurrentSession } from './auth';

describe('Auth Service Property Tests', () => {
  const testEmail = import.meta.env.VITE_TEST_ADMIN_EMAIL || 'test@example.com';
  const testPassword = import.meta.env.VITE_TEST_ADMIN_PASSWORD || 'testpassword123';

  beforeEach(async () => {
    // Ensure we start with a clean state
    await supabase.auth.signOut();
  });

  afterEach(async () => {
    // Clean up after each test
    await supabase.auth.signOut();
  });

  // Feature: personal-blog, Property 13: Admin session persists across page refreshes
  // Validates: Requirements 2.5
  test('Property 13: Admin session persists across page refreshes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // We don't need random data for this test
        async () => {
          // Login to create a session
          const { session: initialSession } = await login(testEmail, testPassword);
          expect(initialSession).toBeTruthy();
          expect(initialSession.user).toBeTruthy();

          // Simulate page refresh by getting the session again
          // In a real browser, this would be a new page load
          const refreshedSession = await getCurrentSession();

          // Verify session persists
          expect(refreshedSession).toBeTruthy();
          expect(refreshedSession?.user.id).toBe(initialSession.user.id);
          expect(refreshedSession?.access_token).toBeTruthy();

          // Clean up
          await logout();
        }
      ),
      { numRuns: 10 } // Reduced runs since this involves actual auth operations
    );
  }, 30000); // 30 second timeout for auth operations

  // Feature: personal-blog, Property 14: Unauthenticated users cannot access admin features
  // Validates: Requirements 8.1
  test('Property 14: Unauthenticated users cannot access admin features', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          story: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async (postData) => {
          // Ensure we're logged out
          await logout();
          const session = await getCurrentSession();
          expect(session).toBeNull();

          // Attempt to create a post without authentication
          // This should fail due to RLS policies
          const { error } = await supabase
            .from('posts')
            .insert({
              title: postData.title,
              story: postData.story,
              photo_urls: [],
            });

          // Verify that the operation was denied
          expect(error).toBeTruthy();
          // Supabase RLS returns a 403 or policy violation error
          expect(error?.message).toBeTruthy();
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: personal-blog, Property 15: Session expiration returns to regular view
  // Validates: Requirements 8.4
  test('Property 15: Session expiration returns to regular view', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // We don't need random data for this test
        async () => {
          // Login to create a session
          await login(testEmail, testPassword);
          let session = await getCurrentSession();
          expect(session).toBeTruthy();

          // Manually expire the session by signing out
          // In a real scenario, this would happen automatically after the session expires
          await logout();

          // Verify session is now null (regular view)
          session = await getCurrentSession();
          expect(session).toBeNull();

          // Verify that admin operations are now rejected
          const { error } = await supabase
            .from('posts')
            .insert({
              title: 'Test Post',
              story: 'Test Story',
              photo_urls: [],
            });

          // Should fail due to lack of authentication
          expect(error).toBeTruthy();
        }
      ),
      { numRuns: 10 } // Reduced runs since this involves actual auth operations
    );
  }, 30000); // 30 second timeout for auth operations
});
