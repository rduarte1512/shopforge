import { sql } from '@vercel/postgres';

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
  try {
    const { rows } = await sql`SELECT * FROM store_email_settings WHERE store_id = ${storeId} LIMIT 1`;
    return rows[0] as StoreEmailSettings;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
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
  try {
    await sql`
      INSERT INTO email_logs (store_id, email, type, status, message_id)
      VALUES (${logData.store_id}, ${logData.email}, ${logData.type}, ${logData.status}, ${logData.message_id})
    `;
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

export async function getEmailTemplate(storeId: string, type: string): Promise<EmailTemplate | null> {
  try {
    const { rows } = await sql`
      SELECT * FROM email_templates 
      WHERE store_id = ${storeId} 
      AND type = ${type} 
      AND is_active = true 
      LIMIT 1
    `;
    return rows[0] as EmailTemplate;
  } catch (error) {
    return null;
  }
}

export async function isEmailUnsubscribed(storeId: string, email: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT id FROM email_unsubscribes 
      WHERE store_id = ${storeId} 
      AND email = ${email} 
      LIMIT 1
    `;
    return rows.length > 0;
  } catch (error) {
    return false;
  }
}

export async function unsubscribeEmail(storeId: string, email: string) {
  try {
    await sql`
      INSERT INTO email_unsubscribes (store_id, email)
      VALUES (${storeId}, ${email})
    `;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

export async function getAbandonedCartsNeedingRecovery(storeId: string, hours: number): Promise<any[]> {
  return [];
}

export async function markAbandonmentEmailSent(cartId: string) {
}
