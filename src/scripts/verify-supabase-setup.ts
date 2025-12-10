/**
 * Supabase Setup Verification Script
 * 
 * This script verifies that the Supabase database and storage are correctly configured.
 * Run this after completing the manual setup steps in SUPABASE_SETUP_GUIDE.md
 * 
 * Usage: npx tsx src/scripts/verify-supabase-setup.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  console.error('\nCurrent values:');
  console.error('  VITE_SUPABASE_URL:', SUPABASE_URL || '(not set)');
  console.error('  VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '(set)' : '(not set)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySetup() {
  console.log('🔍 Verifying Supabase Setup...\n');

  let allChecksPass = true;

  // Check 1: Verify posts table exists and is accessible
  console.log('1️⃣ Checking posts table...');
  try {
    const { error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   ❌ Error accessing posts table:', error.message);
      allChecksPass = false;
    } else {
      console.log('   ✅ Posts table is accessible');
    }
  } catch (err) {
    console.error('   ❌ Failed to query posts table:', err);
    allChecksPass = false;
  }

  // Check 2: Verify RLS is enabled (public read should work)
  console.log('\n2️⃣ Checking Row Level Security (public read)...');
  try {
    const { error } = await supabase
      .from('posts')
      .select('count');

    if (error) {
      console.error('   ❌ RLS public read policy not working:', error.message);
      allChecksPass = false;
    } else {
      console.log('   ✅ Public read access is working');
    }
  } catch (err) {
    console.error('   ❌ Failed to test public read:', err);
    allChecksPass = false;
  }

  // Check 3: Verify storage bucket exists
  console.log('\n3️⃣ Checking blog-photos storage bucket...');
  try {
    const { error } = await supabase
      .storage
      .from('blog-photos')
      .list('', { limit: 1 });

    if (error) {
      console.error('   ❌ Storage bucket not accessible:', error.message);
      console.error('   💡 Make sure the "blog-photos" bucket is created and set to public');
      allChecksPass = false;
    } else {
      console.log('   ✅ Storage bucket is accessible');
    }
  } catch (err) {
    console.error('   ❌ Failed to access storage bucket:', err);
    allChecksPass = false;
  }

  // Check 4: Test unauthenticated write (should fail)
  console.log('\n4️⃣ Checking RLS write protection (should deny unauthenticated writes)...');
  try {
    const { error } = await supabase
      .from('posts')
      .insert({
        title: 'Test Post',
        story: 'This should fail',
        photo_urls: []
      });

    if (error) {
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        console.log('   ✅ RLS correctly blocks unauthenticated writes');
      } else {
        console.error('   ⚠️  Write failed but with unexpected error:', error.message);
      }
    } else {
      console.error('   ❌ WARNING: Unauthenticated write succeeded (RLS may not be configured correctly)');
      allChecksPass = false;
    }
  } catch (err) {
    console.error('   ❌ Failed to test write protection:', err);
    allChecksPass = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allChecksPass) {
    console.log('✅ All checks passed! Supabase is configured correctly.');
    console.log('\nNext steps:');
    console.log('1. Create an admin user in the Supabase Dashboard');
    console.log('2. Proceed to implement the Supabase service module (Task 3)');
  } else {
    console.log('❌ Some checks failed. Please review the errors above.');
    console.log('\nRefer to SUPABASE_SETUP_GUIDE.md for detailed setup instructions.');
  }
  console.log('='.repeat(60));
}

verifySetup().catch(console.error);
