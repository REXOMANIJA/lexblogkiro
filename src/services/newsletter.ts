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

  // Check if email already exists
  const { data: existingSubscriber, error: checkError } = await supabase
    .from('newsletter_subscribers')
    .select('id')
    .eq('email', trimmedEmail.toLowerCase())
    .eq('is_active', true)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${checkError.message}`);
  }

  if (existingSubscriber) {
    throw new Error('Email already subscribed');
  }

  // Insert new subscriber
  const { error: insertError } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: trimmedEmail.toLowerCase(),
      is_active: true
    });

  if (insertError) {
    // Check if it's a duplicate key error and provide consistent message
    if (insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
      throw new Error('Email already subscribed');
    }
    throw new Error(`Failed to subscribe: ${insertError.message}`);
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