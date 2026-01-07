import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionConfirmationData {
  email: string;
  siteTitle: string;
  siteUrl: string;
}

/**
 * Generate confirmation email HTML template
 */
function generateConfirmationHTML(data: {
  email: string;
  siteTitle: string;
  siteUrl: string;
  unsubscribeUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dobrodošli u ${data.siteTitle} Newsletter</title>
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
            padding: 30px 30px 20px 30px;
            text-align: center;
            border-bottom: 1px solid #e1ece3;
            background-color: #f0f5f1;
        }
        .site-title {
            color: #507c58;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px 0;
            font-family: Georgia, serif;
        }
        .welcome-subtitle {
            color: #6aa074;
            font-size: 16px;
            margin: 0;
            font-style: italic;
        }
        .content-wrapper {
            padding: 30px;
        }
        .welcome-title {
            font-size: 28px;
            font-weight: 600;
            color: #304b35;
            margin: 0 0 20px 0;
            line-height: 1.4;
            font-family: Georgia, serif;
            text-align: center;
        }
        .welcome-message {
            font-size: 16px;
            line-height: 1.7;
            color: #507c58;
            margin-bottom: 25px;
            font-family: Georgia, serif;
        }
        .confirmation-box {
            background-color: #f0f5f1;
            border: 1px solid #c3d9c7;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .confirmation-text {
            color: #304b35;
            font-size: 16px;
            margin: 0 0 10px 0;
            font-weight: 600;
        }
        .email-display {
            color: #507c58;
            font-size: 16px;
            font-family: monospace;
            background-color: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #c3d9c7;
            display: inline-block;
            margin-top: 10px;
        }
        .what-to-expect {
            margin: 30px 0;
        }
        .expect-title {
            color: #304b35;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 15px 0;
        }
        .expect-list {
            color: #507c58;
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
            padding-left: 20px;
        }
        .expect-list li {
            margin-bottom: 8px;
        }
        .visit-site {
            text-align: center;
            margin: 30px 0;
        }
        .site-link {
            color: #507c58;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            padding: 12px 24px;
            border: 2px solid #507c58;
            border-radius: 6px;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .site-link:hover {
            background-color: #507c58;
            color: #ffffff;
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
            .welcome-title {
                font-size: 24px;
            }
            .site-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="site-title">${data.siteTitle}</h1>
        </div>
        
        <div class="content-wrapper">
            <h2 class="welcome-title">Uspešno ste se prijavili! 🪶</h2>
            
            <div class="welcome-message">
                <p>Hvala vam što ste se prijavili na moj newsletter! </p>
                <p>Protagonista lično, za vas. Svih šest. </p>
            </div>
            
            <div class="confirmation-box">
                <p class="confirmation-text">Vaša email adresa je potvrđena:</p>
                <div class="email-display">${data.email}</div>
            </div>
            
            <div class="what-to-expect">
                <h3 class="expect-title">Šta možete očekivati:</h3>
                <ul class="expect-list">
                    <li>Obaveštenja o novim blog postovima čim se objave (Ne beri brigu čitaoče, neće biti često.)</li>
                    <li>Nikakav spam - ovo je hobi. Moj pisanje, tvoj čitanje.</li>
                    <li>Ako ste slučajno kliknuli prijavu na newsletter, evo odjavi se ispod: </li>
                </ul>
            </div>
            <a href="${data.unsubscribeUrl}" class="unsubscribe">Odjavite se sa newsletter-a</a>
            <div class="visit-site">
                <a href="${data.siteUrl}" class="site-link">Posetite blog</a>
            </div>
        </div>
        
        <div class="footer">
            <p class="signature">Hvala na poverenju,<br><strong>A.M. LEX</strong></p>
            <p class="footer-note">Ovo je automatska poruka potvrde. Molimo vas da ne odgovarate na ovaj email.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate confirmation email plain text version
 */
function generateConfirmationText(data: {
  email: string;
  siteTitle: string;
  siteUrl: string;
  unsubscribeUrl: string;
}): string {
  return `
${data.siteTitle} - Newsletter Potvrda

Uspešno ste se prijavili!

Hvala vam što ste se prijavili na naš newsletter! Drago nam je što želite da budete u toku sa našim najnovijim pričama i mislima.

Vaša email adresa je potvrđena: ${data.email}

Šta možete očekivati:
• Obaveštenja o novim blog postovima čim se objave
• Ekskluzivni sadržaj i misli koje delimo samo sa pretplatnicima  
• Nikakav spam - šaljemo samo kvalitetan sadržaj
• Možete se odjaviti u bilo kom trenutku jednim klikom

Posetite naš blog: ${data.siteUrl}

Hvala na poverenju,
${data.siteTitle}

Ovo je automatska poruka potvrde. Molimo vas da ne odgovarate na ovaj email.

Ako se želite odjaviti: ${data.unsubscribeUrl}
  `.trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is required')
    }

    // Parse request body
    const { email, siteTitle, siteUrl }: SubscriptionConfirmationData = await req.json()

    // Validate required fields
    if (!email || !siteTitle || !siteUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, siteTitle, siteUrl' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare email data
    const unsubscribeUrl = `${siteUrl}/unsubscribe`
    
    const emailHTML = generateConfirmationHTML({
      email,
      siteTitle,
      siteUrl,
      unsubscribeUrl
    })

    const emailText = generateConfirmationText({
      email,
      siteTitle,
      siteUrl,
      unsubscribeUrl
    })

    console.log(`Sending subscription confirmation to: ${email}`)
    
    // Send confirmation email using Brevo API
    const emailPayload = {
      sender: {
        name: siteTitle,
        email: 'noreply@sunjaisize.com'
      },
      to: [
        {
          email: email,
          name: email.split('@')[0]
        }
      ],
      subject: `Dobrodošli u ${siteTitle} Newsletter! 🪶`,
      htmlContent: emailHTML,
      textContent: emailText,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Personal Blog Subscription',
        'Reply-To': 'noreply@sunjaisize.com',
        'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sunjaisize.com>`,
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
      },
      tags: ['subscription-confirmation', 'welcome']
    }
    
    console.log('Confirmation email payload:', JSON.stringify(emailPayload, null, 2))
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    })

    console.log(`Confirmation email response status:`, response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to send confirmation email:`, response.status, errorText)
      throw new Error(`Failed to send confirmation email: ${errorText}`)
    }

    const result = await response.json()
    console.log(`Successfully sent confirmation email to: ${email}`, result)

    return new Response(
      JSON.stringify({ 
        message: `Confirmation email sent successfully to ${email}`,
        messageId: result.messageId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})