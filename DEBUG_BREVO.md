# Brevo Email Debug Guide

## 🔍 Why Emails Aren't Being Sent

### Most Common Issues:

### 1. **Sender Email Not Verified in Brevo**
- `noreply@sunjaisize.com` must be verified in Brevo
- Go to **Brevo Dashboard → Senders & IP → Domains and IPs**
- Add and verify `sunjaisize.com` domain

### 2. **API Key Not in Supabase**
- Check: https://supabase.com/dashboard/project/dtatnhzupgwizypqvvzw/settings/edge-functions
- Must have: `BREVO_API_KEY` with your API key value

### 3. **Domain DNS Not Configured**
- Need SPF record: `v=spf1 include:spf.brevo.com ~all`
- Need DKIM record (provided by Brevo)

## 🧪 Quick Test Steps:

### Step 1: Check Supabase Logs
1. Go to: https://supabase.com/dashboard/project/dtatnhzupgwizypqvvzw/logs/edge-functions
2. Look for `send-newsletter` function logs
3. Check for errors or API responses

### Step 2: Test with Verified Email
Temporarily change sender email to a verified one:

1. In Brevo, go to **Senders & IP → Senders**
2. See which emails are verified
3. Use one of those verified emails for testing

### Step 3: Check Brevo Activity
1. Go to **Brevo Dashboard → Campaigns → Transactional**
2. Look for recent email activity
3. Check if emails are being processed

## 🔧 Quick Fix Options:

### Option A: Use Your Gmail (Temporary)
```typescript
sender: {
  name: siteTitle,
  email: 'rexomania1001@gmail.com' // If this is verified in Brevo
}
```

### Option B: Verify Your Domain
1. **Brevo Dashboard → Senders & IP → Domains and IPs**
2. **Add Domain**: `sunjaisize.com`
3. **Add DNS Records** as instructed by Brevo
4. **Wait for verification** (can take up to 24 hours)

### Option C: Use Brevo Default Sender
Check if Brevo provided a default sender email when you signed up.

## 📋 Checklist:
- [ ] API key added to Supabase environment variables
- [ ] Sender email verified in Brevo
- [ ] Domain DNS records configured
- [ ] Test subscribers exist in database
- [ ] Check Supabase function logs for errors

## 🚨 Next Steps:
1. **Check Supabase logs** for detailed error messages
2. **Verify sender email** in Brevo dashboard
3. **Test with a verified email** first
4. **Check spam folder** of test recipients

Let me know what you find in the Supabase logs!