# Supabase Setup Guide

This guide walks you through setting up the database and storage for the personal blog application.

## Prerequisites

- A Supabase project created (URL and anon key should be in `.env` file)
- Access to the Supabase Dashboard

## Step 1: Run Database Migration

### For New Installations

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase-setup.sql` and paste it into the SQL editor
6. Click **Run** to execute the SQL

This will:
- ✅ Create the `posts` table with all required columns (including cover image and category support)
- ✅ Create the `categories` table
- ✅ Create indexes on `created_at` and `category_ids` for efficient querying
- ✅ Enable Row Level Security (RLS) on both tables
- ✅ Create RLS policies for public read and authenticated write/update/delete
- ✅ Create a trigger to automatically update the `updated_at` timestamp

### For Existing Installations (Migration)

If you already have a `posts` table with data:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase-migration-categories.sql` and paste it into the SQL editor
5. Click **Run** to execute the SQL

This migration adds:
- ✅ `cover_image_url` column to posts table
- ✅ `cover_image_position` column with default positioning
- ✅ `category_ids` column to posts table
- ✅ GIN index for efficient category filtering
- ✅ Complete `categories` table with RLS policies

See `MIGRATION_GUIDE.md` for detailed migration instructions and rollback procedures.

## Step 2: Create Storage Bucket

1. In the Supabase Dashboard, navigate to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Configure the bucket:
   - **Name**: `blog-photos`
   - **Public bucket**: ✅ Enable (checked)
   - **File size limit**: 50 MB (recommended)
   - **Allowed MIME types**: Leave empty or specify: `image/jpeg, image/png, image/webp`
4. Click **Create bucket**

## Step 3: Configure Storage Policies

After creating the bucket, you need to set up storage policies:

1. Click on the `blog-photos` bucket
2. Go to the **Policies** tab
3. Click **New Policy**

### Policy 1: Public Read Access

- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  true
  ```
- Click **Review** then **Save policy**

### Policy 2: Authenticated Upload Access

- **Policy name**: `Authenticated upload access`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **Review** then **Save policy**

### Policy 3: Authenticated Update Access

- **Policy name**: `Authenticated update access`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **Review** then **Save policy**

### Policy 4: Authenticated Delete Access

- **Policy name**: `Authenticated delete access`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **Review** then **Save policy**

## Step 4: Verify Setup

### Verify Database Tables

1. Go to **Table Editor** in the Supabase Dashboard
2. You should see the `posts` and `categories` tables listed
3. Click on `posts` to verify the schema:
   - `id` (uuid, primary key)
   - `title` (text)
   - `story` (text)
   - `photo_urls` (text[])
   - `cover_image_url` (text, nullable)
   - `cover_image_position` (jsonb)
   - `category_ids` (uuid[])
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)
4. Click on `categories` to verify the schema:
   - `id` (uuid, primary key)
   - `name` (text, unique)
   - `slug` (text, unique)
   - `color` (text)
   - `created_at` (timestamptz)

### Verify RLS Policies

1. In the **Table Editor**, click on the `posts` table
2. Click the **RLS** icon or go to **Authentication** → **Policies**
3. Verify you see 4 policies for `posts`:
   - Public read access
   - Admin insert access
   - Admin update access
   - Admin delete access
4. Click on the `categories` table and verify 4 policies:
   - Public read access
   - Admin insert access
   - Admin update access
   - Admin delete access

### Verify Storage Bucket

1. Go to **Storage** in the Supabase Dashboard
2. Verify the `blog-photos` bucket exists and is marked as **Public**
3. Click on the bucket and go to **Policies** tab
4. Verify you see 4 storage policies

## Step 5: Create Admin User

To use the admin features, you need to create an authenticated user:

1. Go to **Authentication** → **Users** in the Supabase Dashboard
2. Click **Add user** → **Create new user**
3. Enter an email and password for the admin account
4. Click **Create user**
5. Note down the credentials - you'll use these to log in at `/lex`

## Troubleshooting

### RLS Policies Not Working

- Ensure RLS is enabled on the `posts` table
- Check that policy definitions use `auth.role() = 'authenticated'` not `auth.uid()`
- Verify you're logged in when testing admin operations

### Storage Upload Fails

- Verify the bucket is created and named exactly `blog-photos`
- Check that storage policies are created with correct operation types
- Ensure you're authenticated when uploading

### Images Not Loading

- Verify the bucket is set to **Public**
- Check that photo URLs are correctly formatted
- Ensure the public read policy exists on the storage bucket

## Next Steps

After completing this setup:
1. Verify your `.env` file has the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Proceed to implement the Supabase service module (Task 3)
3. Test CRUD operations with the admin user you created
