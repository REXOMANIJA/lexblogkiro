import { supabase } from './supabase';
import type { NewsletterSubscriber, NewsletterEmailData } from '../types';

/**
 * Subscribe a user to the newsletter
 */
export async function subscribeToNewsletter(email: string): Promise<void> {
  // Validate email format with more comprehensive regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional validation checks
  if (!email || email.trim() === '' || !emailRegex.test(email.trim())) {
    throw new Error('Invalid email format');
  }

  // Check for common invalid patterns
  const trimmedEmail = email.trim();
  if (trimmedEmail.includes('..') || 
      trimmedEmail.startsWith('.') || 
      trimmedEmail.endsWith('.') ||
      trimmedEmail.includes('@.') ||
      trimmedEmail.includes('.@')) {
    throw new Error('Invalid email format');
  }

  // Check if email already exists (active or inactive)
  const { data: existingSubscriber, error: checkError } = await supabase
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', trimmedEmail.toLowerCase())
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${checkError.message}`);
  }

  if (existingSubscriber) {
    if (existingSubscriber.is_active) {
      throw new Error('Email already subscribed');
    } else {
      // Reactivate existing inactive subscription
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true })
        .eq('email', trimmedEmail.toLowerCase());

      if (updateError) {
        throw new Error(`Failed to reactivate subscription: ${updateError.message}`);
      }
    }
  } else {
    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: trimmedEmail.toLowerCase(),
        is_active: true
      });

    if (insertError) {
      throw new Error(`Failed to subscribe: ${insertError.message}`);
    }
  }

  // Send confirmation email
  try {
    await sendSubscriptionConfirmation(trimmedEmail);
  } catch (confirmationError) {
    // Log the error but don't fail the subscription
    console.error('Failed to send confirmation email:', confirmationError);
    // The subscription was successful, so we don't throw here
  }
}

/**
 * Get all active subscribers
 */
export async function getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('is_active', true)
    .order('subscribed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get subscriber count
 */
export async function getSubscriberCount(): Promise<number> {
  const { count, error } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to get subscriber count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Send newsletter email to all subscribers
 */
export async function sendNewsletterEmail(emailData: NewsletterEmailData): Promise<void> {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-newsletter', {
      body: emailData
    });

    if (error) {
      throw new Error(`Failed to send newsletter: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(`Newsletter sending failed: ${data.error}`);
    }

    // Return success - the Edge Function handles the actual email sending
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while sending newsletter');
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(email: string): Promise<void> {
  try {
    const siteTitle = 'Šunja i Siže';
    const siteUrl = window.location.origin;

    // Call the Supabase Edge Function for confirmation
    const { data, error } = await supabase.functions.invoke('send-subscription-confirmation', {
      body: {
        email,
        siteTitle,
        siteUrl
      }
    });

    if (error) {
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(`Confirmation email sending failed: ${data.error}`);
    }

    console.log('Confirmation email sent successfully to:', email);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while sending confirmation email');
  }
}

/**
 * Unsubscribe a user from the newsletter
 */
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  // Validate email format
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || email.trim() === '' || !emailRegex.test(email.trim())) {
    throw new Error('Invalid email format');
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check if email exists and is active
  const { data: existingSubscriber, error: checkError } = await supabase
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', trimmedEmail)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${checkError.message}`);
  }

  if (!existingSubscriber) {
    throw new Error('Email not found in our newsletter list');
  }

  if (!existingSubscriber.is_active) {
    throw new Error('Email is already unsubscribed');
  }

  // Deactivate the subscription
  const { error: updateError } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('email', trimmedEmail);

  if (updateError) {
    throw new Error(`Failed to unsubscribe: ${updateError.message}`);
  }
}