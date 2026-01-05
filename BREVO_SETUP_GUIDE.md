# Brevo Integration Setup Guide

## ✅ What's Already Done
- Brevo API integration code is implemented in `supabase/functions/send-newsletter/index.ts`
- Edge Function has been deployed to Supabase
- Environment variable structure is set up

## 🔧 What You Need to Do

### 1. Get Your Brevo API Key
1. Log into your [Brevo account](https://app.brevo.com)
2. Go to **Settings → API Keys**
3. Create a new API key or copy your existing one
4. Copy the API key (starts with `xkeysib-...`)

### 2. Add API Key to Local Environment
Add this line to your `.env` file:
```bash
BREVO_API_KEY=xkeysib-your-actual-api-key-here
```

### 3. Add API Key to Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/dtatnhzupgwizypqvvzw)
2. Navigate to **Settings → Edge Functions**
3. Click **Add Environment Variable**
4. Name: `BREVO_API_KEY`
5. Value: Your Brevo API key
6. Click **Save**

### 4. Update Sender Email Addresses
Replace the placeholder email addresses in `supabase/functions/send-newsletter/index.ts`:

**Find these lines:**
```typescript
email: 'noreply@yourdomain.com' // Replace with your verified domain email
```

**Replace with your actual domain:**
```typescript
email: 'noreply@yourrealdomain.com'
```

### 5. Verify Your Domain in Brevo
1. Go to **Brevo Dashboard → Senders & IP**
2. Click **Add a domain**
3. Enter your domain name
4. Follow the DNS verification steps:
   - Add SPF record to your DNS
   - Add DKIM record to your DNS
   - Verify domain ownership

### 6. Test the Integration
1. Create a test blog post
2. Use the "Send Newsletter" button
3. Check Brevo dashboard for email statistics
4. Verify emails are delivered to test subscribers

## 🎯 Benefits of Brevo
- **Free tier**: 300 emails/day
- **Great deliverability**: Professional email infrastructure
- **Analytics**: Detailed email performance metrics
- **Domain authentication**: Better inbox placement
- **GDPR compliant**: European privacy standards

## 🔍 Troubleshooting

### Common Issues:
1. **API Key Error**: Make sure the API key is correctly added to both local `.env` and Supabase environment variables
2. **Domain Not Verified**: Emails might go to spam if domain isn't verified in Brevo
3. **Rate Limits**: Brevo free tier has daily limits (300 emails/day)

### Testing Commands:
```bash
# Test the Edge Function locally (if you have Supabase CLI)
supabase functions serve send-newsletter

# Deploy after making changes
supabase functions deploy send-newsletter
```

## 📧 Email Template Features
Your newsletter emails include:
- **Personal tone**: Styled like personal correspondence
- **Clean HTML**: Professional but warm design
- **Mobile responsive**: Looks great on all devices
- **Unsubscribe link**: GDPR compliant
- **Plain text version**: Better deliverability

## ✅ Next Steps
1. Complete the setup steps above
2. Test with a few subscribers first
3. Monitor delivery rates in Brevo dashboard
4. Adjust sender reputation by maintaining good practices

Your newsletter system is ready to go once you complete these setup steps!