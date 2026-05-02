import { supabase, isSupabaseConfigured } from './supabase';

export { supabase, isSupabaseConfigured };

export interface StoreEmailSettings {
  id?: string;
  store_id: string;
  resend_api_key: string | null;
  sender_name: string | null;
  sender_email: string | null;
  reply_to_email: string | null;
  logo_url: string | null;
  brand_color: string | null;
  notify_new_order: boolean;
  notify_order_status: boolean;
  notify_low_stock: boolean;
  cart_recovery_enabled: boolean;
  cart_recovery_delay_hours: number;
  cart_recovery_2nd_email: boolean;
  marketing_consent_default: boolean;
  marketing_consent_text: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmailTemplate {
  id?: string;
  store_id: string;
  type: 'order_confirmation' | 'order_status' | 'cart_recovery' | 'welcome' | 'newsletter';
  subject: string;
  preview_text: string | null;
  html_content: string | null;
  custom_values?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getStoreEmailSettings(storeId: string): Promise<StoreEmailSettings | null> {
  const { data, error } = await supabase
    .from('store_email_settings')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
  return data;
}

export async function sendEmail({ apiKey, to, subject, html, from, replyTo }: { apiKey: string, to: string, subject: string, html: string, from: string, replyTo?: string }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        reply_to: replyTo
      })
    });
    
    const data = await res.json();
    if (!res.ok) return { data: null, error: data };
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function logEmail(logData: any) {
  const { error } = await supabase
    .from('email_logs')
    .insert([logData]);
  if (error) console.error('Error logging email:', error);
}

export async function getEmailTemplate(storeId: string, type: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('store_id', storeId)
    .eq('type', type)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

export async function isEmailUnsubscribed(storeId: string, email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('store_id', storeId)
    .eq('email', email)
    .single();

  return !!data;
}

export async function unsubscribeEmail(storeId: string, email: string) {
  const { error } = await supabase
    .from('email_unsubscribes')
    .insert([{ store_id: storeId, email }]);
  return { error };
}

export async function getAbandonedCartsNeedingRecovery(storeId: string, hours: number): Promise<any[]> {
  // Simple mock or basic query
  return [];
}

export async function markAbandonmentEmailSent(cartId: string) {
  // Simple mock
}
