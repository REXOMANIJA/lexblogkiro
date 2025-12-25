# Design Document: Newsletter Subscription

## Overview

The newsletter subscription feature enables users to subscribe to email notifications when new blog posts are published. The system consists of a subscription form on the homepage, a database table for storing subscriber emails, and an email distribution system integrated into the post creation workflow.

## Architecture

The newsletter system follows the existing application architecture:

- **Frontend**: React components with TypeScript and Tailwind CSS
- **Backend**: Supabase database and Edge Functions for email sending
- **Email Service**: Supabase Edge Functions with Resend API for email delivery
- **Storage**: PostgreSQL table for subscriber management

## Components and Interfaces

### Database Schema

**Newsletter Subscribers Table**:
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

**Indexes**:
```sql
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);
```

### TypeScript Interfaces

```typescript
export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface NewsletterSubscriptionInput {
  email: string;
}

export interface NewsletterEmailData {
  postId: string;
  postTitle: string;
  postContent: string; // First paragraph
  postUrl: string;
  siteTitle: string;
}
```

### React Components

**NewsletterSubscriptionForm Component**:
- Location: `src/components/NewsletterSubscriptionForm.tsx`
- Props: None (self-contained)
- State: email input, loading state, success/error messages
- Functionality: Email validation, subscription submission, user feedback

**NewsletterSendButton Component**:
- Location: `src/components/NewsletterSendButton.tsx`
- Props: `{ postId: string, postTitle: string, postContent: string }`
- State: loading state, success/error messages
- Functionality: Trigger newsletter email distribution

### Service Layer

**Newsletter Service**:
- Location: `src/services/newsletter.ts`
- Functions:
  - `subscribeToNewsletter(email: string): Promise<void>`
  - `sendNewsletterEmail(emailData: NewsletterEmailData): Promise<void>`
  - `fetchSubscriberCount(): Promise<number>`

### Supabase Edge Function

**Newsletter Email Function**:
- Location: `supabase/functions/send-newsletter/index.ts`
- Purpose: Send emails to all active subscribers
- Integration: Resend API for email delivery
- Input: Newsletter email data
- Output: Success/failure response

## Data Models

### Newsletter Subscriber Model

```typescript
interface NewsletterSubscriber {
  id: string;           // UUID primary key
  email: string;        // Subscriber email (unique)
  subscribed_at: string; // ISO timestamp
  is_active: boolean;   // Subscription status
}
```

### Email Template Data

```typescript
interface EmailTemplateData {
  siteTitle: string;    // Blog site title
  postTitle: string;    // New post title
  postContent: string;  // First paragraph of post
  postUrl: string;      // Full URL to post
  unsubscribeUrl: string; // Unsubscribe link
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid Email Subscription Storage
*For any* valid email address, when submitted through the subscription form, the email should be stored in the newsletter_subscribers database table and marked as active.
**Validates: Requirements 1.2, 4.1**

### Property 2: Invalid Email Rejection
*For any* invalid email format, when submitted through the subscription form, the system should reject the submission and display an appropriate error message without storing the email.
**Validates: Requirements 1.3, 4.2**

### Property 3: Duplicate Email Prevention
*For any* email address that already exists in the subscriber database, attempting to subscribe again should display a message indicating the email is already subscribed without creating a duplicate entry.
**Validates: Requirements 1.4, 4.3**

### Property 4: Subscription Success Feedback
*For any* successful email subscription, the system should display a confirmation message to the user indicating the subscription was successful.
**Validates: Requirements 1.5**

### Property 5: Newsletter Email Distribution
*For any* newsletter send operation, emails should be sent to all active subscribers in the database, excluding inactive subscribers.
**Validates: Requirements 2.2, 4.4**

### Property 6: Email Subject Formatting
*For any* newsletter email, the email subject should use the site title as specified in the system configuration.
**Validates: Requirements 2.3, 3.1**

### Property 7: Email Content Structure
*For any* newsletter email, the email body should contain the post title prominently, the complete first paragraph of the post, and a valid link to the full post on the website.
**Validates: Requirements 2.4, 2.5, 2.6, 3.2, 3.3, 3.4**

### Property 8: HTML Email Formatting
*For any* newsletter email, the email should use proper HTML structure with appropriate formatting for readability.
**Validates: Requirements 3.5**

### Property 9: Database Error Handling
*For any* database operation failure during subscription, the system should handle the error gracefully and provide appropriate user feedback without crashing.
**Validates: Requirements 4.5**

### Property 10: UI Feedback Consistency
*For any* user action on the subscription form (success, error, duplicate), the system should display appropriate feedback messages that clearly communicate the result to the user.
**Validates: Requirements 5.3**

<function_calls>
<invoke name="prework">
<parameter name="featureName">newsletter-subscription

## Error Handling

### Subscription Errors
- **Invalid Email Format**: Display user-friendly error message, prevent form submission
- **Duplicate Email**: Show "already subscribed" message, maintain existing subscription
- **Database Connection Issues**: Show temporary error message, allow retry
- **Network Failures**: Implement retry logic with exponential backoff

### Email Distribution Errors
- **Email Service Failures**: Log errors, provide admin notification of failed sends
- **Invalid Subscriber Emails**: Skip invalid emails, continue with remaining subscribers
- **Rate Limiting**: Implement batch sending with appropriate delays
- **Authentication Issues**: Validate API keys, provide clear error messages

### UI Error States
- **Form Validation**: Real-time email format validation with visual feedback
- **Loading States**: Show loading indicators during subscription and email sending
- **Success States**: Clear confirmation messages for successful operations
- **Network Errors**: Graceful degradation with retry options

## Testing Strategy

### Unit Testing
The newsletter system will use **both unit tests and property-based tests** for comprehensive coverage:

**Unit Tests** focus on:
- Specific email format validation examples
- Database connection error scenarios
- UI component rendering with different states
- Email template generation with sample data
- Integration between subscription form and database

**Property-Based Tests** focus on:
- Universal email validation across all possible inputs (Property 2)
- Subscription storage consistency for all valid emails (Property 1)
- Email distribution to all active subscribers (Property 5)
- Email content structure across all posts (Property 7)
- Error handling across all failure scenarios (Property 9)

### Property-Based Testing Configuration
- **Testing Library**: fast-check (already installed in project)
- **Test Iterations**: Minimum 100 iterations per property test
- **Test Tagging**: Each property test tagged with format: **Feature: newsletter-subscription, Property {number}: {property_text}**

### Integration Testing
- **End-to-End Subscription Flow**: User subscribes → email stored → confirmation shown
- **Newsletter Send Flow**: Admin creates post → sends newsletter → subscribers receive emails
- **Database Integration**: Verify all database operations work correctly with Supabase
- **Email Service Integration**: Test email sending with Resend API in development environment

### Test Environment Setup
- **Mock Email Service**: Use test mode for Resend API during development
- **Test Database**: Separate Supabase project or local database for testing
- **Test Data**: Generate realistic test subscribers and posts for comprehensive testing
- **Cleanup**: Automated cleanup of test data after test runs