import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsletterEmailData {
  postId: string;
  postTitle: string;
  postContent: string;
  postUrl: string;
  siteTitle: string;
}

/**
 * Generate personal HTML email template optimized for Primary inbox
 */
function generateEmailHTML(data: {
  siteTitle: string;
  postTitle: string;
  postContent: string;
  postUrl: string;
  unsubscribeUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.postTitle}</title>
    <style>
        body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.7;
            color: #304b35;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            border: 1px solid #e1ece3;
        }
        .header {
            padding: 25px 30px 15px 30px;
            border-bottom: 2px solid #f0f5f1;
        }
        .site-title {
            color: #507c58;
            font-size: 20px;
            font-weight: normal;
            margin: 0;
            font-family: Georgia, serif;
        }
        .content-wrapper {
            padding: 30px;
        }
        .post-title {
            font-size: 24px;
            font-weight: 600;
            color: #304b35;
            margin: 0 0 20px 0;
            line-height: 1.4;
            font-family: Georgia, serif;
        }
        .post-content {
            font-size: 16px;
            line-height: 1.7;
            color: #507c58;
            margin-bottom: 25px;
            font-family: Georgia, serif;
        }
        .continue-reading {
            margin: 25px 0;
            padding: 20px;
            background-color: #f0f5f1;
            border-radius: 6px;
            border-left: 3px solid #6aa074;
        }
        .continue-text {
            color: #3a5a40;
            font-size: 15px;
            margin: 0 0 12px 0;
            font-style: italic;
        }
        .post-link {
            color: #507c58;
            text-decoration: underline;
            font-weight: 500;
            font-size: 16px;
        }
        .post-link:hover {
            color: #3a5a40;
        }
        .footer {
            padding: 25px 30px;
            border-top: 1px solid #e1ece3;
            background-color: #f0f5f1;
        }
        .signature {
            color: #3a5a40;
            font-size: 15px;
            margin: 0 0 20px 0;
            font-family: Georgia, serif;
        }
        .footer-note {
            color: #6aa074;
            font-size: 13px;
            margin: 15px 0 0 0;
            font-style: italic;
        }
        .unsubscribe {
            color: #6aa074;
            text-decoration: underline;
            font-size: 12px;
            margin-top: 15px;
            display: inline-block;
        }
        
        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header, .content-wrapper, .footer {
                padding: 20px;
            }
            .post-title {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <p class="site-title">Lexov Blog</p>
        </div>
        
        <div class="content-wrapper">
            <h1 class="post-title">${data.postTitle}</h1>
            
            <div class="post-content">
                <p>${data.postContent}</p>
            </div>
            
            <div class="continue-reading">
                <p class="continue-text">Možete pročitati ceo tekst ovde:</p>
                <a href="${data.postUrl}" class="post-link">Novi Post</a>
            </div>
        </div>
        
        <div class="footer">
            <p class="signature">Sve najbolje,<br>Lex</p>
            <p class="footer-note">Hvala na čitanju.</p>
            <a href="${data.unsubscribeUrl}" class="unsubscribe">Unsubscribe</a>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate personal plain text version optimized for Primary inbox
 */
function generateEmailText(data: {
  siteTitle: string;
  postTitle: string;
  postContent: string;
  postUrl: string;
  unsubscribeUrl: string;
}): string {
  return `
${data.siteTitle}

${data.postTitle}

${data.postContent}

You can read the complete article here:
${data.postUrl}

Best regards,
${data.siteTitle}

Thanks for reading my thoughts.

If you'd prefer not to receive these updates, you can unsubscribe here: ${data.unsubscribeUrl}
  `.trim();
}

/**
 * Generate more personal subject line
 */
function generateEmailSubject(siteTitle: string, postTitle: string): string {
  // Avoid promotional words, make it personal and simple
  return postTitle.length > 50 ? postTitle.substring(0, 50) + '...' : postTitle;
}

/**
 * Extract first paragraph from HTML content
 */
function extractFirstParagraph(htmlContent: string): string {
  const textContent = htmlContent.replace(/<[^>]*>/g, '');
  const paragraphs = textContent.split('\n').filter(p => p.trim().length > 0);
  const firstParagraph = paragraphs.find(p => p.trim().length > 0) || textContent.trim();
  
  if (!firstParagraph || firstParagraph.trim().length === 0) {
    return 'New blog post available';
  }
  
  return firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is required')
    }

    // Parse request body
    const { postId, postTitle, postContent, postUrl, siteTitle }: NewsletterEmailData = await req.json()

    // Validate required fields
    if (!postId || !postTitle || !postContent || !postUrl || !siteTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true)

    if (subscribersError) {
      console.error('Subscribers error:', subscribersError)
      throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`)
    }

    console.log(`Found ${subscribers?.length || 0} subscribers`)

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers found')
      return new Response(
        JSON.stringify({ message: 'No active subscribers found', totalSubscribers: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare email data
    const emailSubject = generateEmailSubject(siteTitle, postTitle)
    const firstParagraph = extractFirstParagraph(postContent)
    const unsubscribeUrl = `${new URL(postUrl).origin}/unsubscribe`

    const emailHTML = generateEmailHTML({
      siteTitle,
      postTitle,
      postContent: firstParagraph,
      postUrl,
      unsubscribeUrl
    })

    const emailText = generateEmailText({
      siteTitle,
      postTitle,
      postContent: firstParagraph,
      postUrl,
      unsubscribeUrl
    })

    console.log(`Sending emails to ${subscribers.length} subscribers via Brevo`)
    
    // Send emails using Brevo API
    const emailPromises = subscribers.map(async (subscriber) => {
      console.log(`Sending email to: ${subscriber.email}`)
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: siteTitle,
            email: 'rexomania1001@gmail.com'
          },
          to: [
            {
              email: subscriber.email
            }
          ],
          subject: emailSubject,
          htmlContent: emailHTML,
          textContent: emailText,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'X-Mailer': 'Lex',
            'Reply-To': 'rexomania1001@gmail.com'
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to send email to ${subscriber.email}:`, response.status, errorText)
        return { email: subscriber.email, success: false, error: errorText }
      }

      const result = await response.json()
      console.log(`Successfully sent email to: ${subscriber.email}`, result.messageId)
      return { email: subscriber.email, success: true, messageId: result.messageId }
    })

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises)
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`Email sending complete: ${successful} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({ 
        message: `Newsletter sent successfully via Brevo`,
        totalSubscribers: subscribers.length,
        successful,
        failed,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending newsletter:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})