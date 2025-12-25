# Supabase Edge Functions

This directory contains Supabase Edge Functions for the newsletter system.

## Setup

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Deploy the functions:
   ```bash
   supabase functions deploy send-newsletter
   ```

## Environment Variables

The following environment variables need to be set in your Supabase project:

- `RESEND_API_KEY`: Your Resend API key for sending emails
- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (automatically available)

Set them using:
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

## Functions

### send-newsletter

Sends newsletter emails to all active subscribers when a new blog post is published.

**Endpoint:** `https://your-project.supabase.co/functions/v1/send-newsletter`

**Method:** POST

**Body:**
```json
{
  "postId": "string",
  "postTitle": "string", 
  "postContent": "string",
  "postUrl": "string",
  "siteTitle": "string"
}
```

**Response:**
```json
{
  "message": "Newsletter sent successfully",
  "totalSubscribers": 10,
  "successful": 9,
  "failed": 1
}
```