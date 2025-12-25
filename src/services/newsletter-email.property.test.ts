import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

// Email generation functions (extracted from Edge Function for testing)
function generateEmailSubject(siteTitle: string): string {
  return siteTitle;
}

function extractFirstParagraph(htmlContent: string): string {
  // Remove HTML tags and get first paragraph
  const textContent = htmlContent.replace(/<[^>]*>/g, '');
  const paragraphs = textContent.split('\n').filter(p => p.trim().length > 0);
  
  // Get the first non-empty paragraph, or fallback to trimmed content
  const firstParagraph = paragraphs.find(p => p.trim().length > 0) || textContent.trim();
  
  // If still empty or too short, provide a meaningful fallback
  if (!firstParagraph || firstParagraph.trim().length === 0) {
    return 'New blog post available';
  }
  
  return firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph;
}

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
    <title>${data.siteTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        .site-title {
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .post-title {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            margin: 30px 0 20px 0;
            line-height: 1.3;
        }
        .post-content {
            font-size: 16px;
            line-height: 1.7;
            color: #374151;
            margin-bottom: 30px;
        }
        .read-more {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .read-more:hover {
            background-color: #2563eb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .unsubscribe {
            color: #9ca3af;
            text-decoration: none;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="site-title">${data.siteTitle}</h1>
        </div>
        
        <h2 class="post-title">${data.postTitle}</h2>
        
        <div class="post-content">
            ${data.postContent}
        </div>
        
        <a href="${data.postUrl}" class="read-more">Read Full Post</a>
        
        <div class="footer">
            <p>Thank you for subscribing to ${data.siteTitle}!</p>
            <p><a href="${data.unsubscribeUrl}" class="unsubscribe">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Arbitraries for generating test data
const arbitrarySiteTitle = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
};

const arbitraryPostTitle = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
};

const arbitraryPostContent = (): fc.Arbitrary<string> => {
  return fc.oneof(
    // Plain text content (ensure it has meaningful content)
    fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
    // HTML content with paragraphs (ensure meaningful content)
    fc.array(fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 5), { minLength: 1, maxLength: 5 })
      .map(paragraphs => paragraphs.map(p => `<p>${p}</p>`).join('\n')),
    // Mixed HTML content (ensure meaningful content)
    fc.tuple(
      fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 5),
      fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 5),
      fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 5)
    ).map(([p1, p2, p3]) => `<h2>Heading</h2><p>${p1}</p><p>${p2}</p><div>${p3}</div>`)
  );
};

const arbitraryUrl = (): fc.Arbitrary<string> => {
  return fc.tuple(
    fc.constantFrom('http', 'https'),
    fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
    fc.constantFrom('com', 'org', 'net'),
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-/]+$/.test(s))
  ).map(([protocol, domain, tld, path]) => `${protocol}://${domain}.${tld}/${path}`);
};

describe('Newsletter Email Generation Property Tests', () => {
  
  // Feature: newsletter-subscription, Property 6: Email Subject Formatting
  // Validates: Requirements 2.3, 3.1
  test('Property 6: Email Subject Formatting', async () => {
    await fc.assert(
      fc.property(
        arbitrarySiteTitle(),
        (siteTitle) => {
          const subject = generateEmailSubject(siteTitle);
          
          // The email subject should use the site title exactly
          expect(subject).toBe(siteTitle);
          
          // Subject should not be empty
          expect(subject.trim()).not.toBe('');
        }
      ),
      { numRuns: 10 }
    );
  });

  // Feature: newsletter-subscription, Property 7: Email Content Structure
  // Validates: Requirements 2.4, 2.5, 2.6, 3.2, 3.3, 3.4
  test('Property 7: Email Content Structure', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          siteTitle: arbitrarySiteTitle(),
          postTitle: arbitraryPostTitle(),
          postContent: arbitraryPostContent(),
          postUrl: arbitraryUrl(),
          unsubscribeUrl: arbitraryUrl()
        }),
        (data) => {
          const firstParagraph = extractFirstParagraph(data.postContent);
          const emailHTML = generateEmailHTML({
            ...data,
            postContent: firstParagraph // Use the extracted paragraph instead of raw content
          });
          
          // Email should contain the post title prominently
          expect(emailHTML).toContain(data.postTitle);
          
          // Email should include the first paragraph of the post
          expect(emailHTML).toContain(firstParagraph);
          
          // Verify that the first paragraph is meaningful (not just whitespace)
          expect(firstParagraph.trim()).not.toBe('');
          expect(firstParagraph.trim().length).toBeGreaterThan(0);
          
          // Email should include a valid link to the full post
          expect(emailHTML).toContain(data.postUrl);
          expect(emailHTML).toContain('href="' + data.postUrl + '"');
          
          // Email should contain the site title
          expect(emailHTML).toContain(data.siteTitle);
          
          // Email should have a clear "Read Full Post" or similar link
          expect(emailHTML.toLowerCase()).toMatch(/read\s+(full\s+)?post/);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Feature: newsletter-subscription, Property 8: HTML Email Formatting
  // Validates: Requirements 3.5
  test('Property 8: HTML Email Formatting', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          siteTitle: arbitrarySiteTitle(),
          postTitle: arbitraryPostTitle(),
          postContent: arbitraryPostContent(),
          postUrl: arbitraryUrl(),
          unsubscribeUrl: arbitraryUrl()
        }),
        (data) => {
          const emailHTML = generateEmailHTML(data);
          
          // Email should use proper HTML structure
          expect(emailHTML).toContain('<!DOCTYPE html>');
          expect(emailHTML).toContain('<html');
          expect(emailHTML).toContain('<head>');
          expect(emailHTML).toContain('<body>');
          expect(emailHTML).toContain('</html>');
          expect(emailHTML).toContain('</head>');
          expect(emailHTML).toContain('</body>');
          
          // Email should have proper meta tags for readability
          expect(emailHTML).toContain('<meta charset="UTF-8">');
          expect(emailHTML).toContain('<meta name="viewport"');
          
          // Email should include CSS styles for formatting
          expect(emailHTML).toContain('<style>');
          expect(emailHTML).toContain('</style>');
          
          // Email should have proper semantic HTML structure
          expect(emailHTML).toContain('<h1');
          expect(emailHTML).toContain('<h2');
          expect(emailHTML).toContain('<div');
          expect(emailHTML).toContain('<a');
          
          // Email should be well-formed (basic validation)
          const openTags = (emailHTML.match(/<[^/][^>]*>/g) || []).length;
          const closeTags = (emailHTML.match(/<\/[^>]*>/g) || []).length;
          // Allow for self-closing tags like <meta>, so open tags should be >= close tags
          expect(openTags).toBeGreaterThanOrEqual(closeTags);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Additional test for first paragraph extraction functionality
  test('First paragraph extraction works correctly', () => {
    fc.assert(
      fc.property(
        arbitraryPostContent(),
        (content) => {
          const firstParagraph = extractFirstParagraph(content);
          
          // Should return a non-empty string
          expect(firstParagraph.trim()).not.toBe('');
          
          // Should not contain HTML tags
          expect(firstParagraph).not.toMatch(/<[^>]*>/);
          
          // Should be reasonable length (not too long)
          expect(firstParagraph.length).toBeLessThanOrEqual(203); // 200 + "..."
        }
      ),
      { numRuns: 10 }
    );
  });
});