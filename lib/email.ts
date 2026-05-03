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

export async function updateStoreEmailSettings(settings: StoreEmailSettings) {
  try {
    const { rows } = await sql`
      INSERT INTO store_email_settings (
        store_id, resend_api_key, sender_name, sender_email, reply_to_email,
        logo_url, brand_color, notify_new_order, notify_order_status,
        notify_low_stock, cart_recovery_enabled, cart_recovery_delay_hours,
        cart_recovery_2nd_email, marketing_consent_default, marketing_consent_text
      ) VALUES (
        ${settings.store_id}, ${settings.resend_api_key}, ${settings.sender_name}, 
        ${settings.sender_email}, ${settings.reply_to_email}, ${settings.logo_url}, 
        ${settings.brand_color}, ${settings.notify_new_order}, ${settings.notify_order_status}, 
        ${settings.notify_low_stock}, ${settings.cart_recovery_enabled}, 
        ${settings.cart_recovery_delay_hours}, ${settings.cart_recovery_2nd_email}, 
        ${settings.marketing_consent_default}, ${settings.marketing_consent_text}
      )
      ON CONFLICT (store_id) DO UPDATE SET
        resend_api_key = EXCLUDED.resend_api_key,
        sender_name = EXCLUDED.sender_name,
        sender_email = EXCLUDED.sender_email,
        reply_to_email = EXCLUDED.reply_to_email,
        logo_url = EXCLUDED.logo_url,
        brand_color = EXCLUDED.brand_color,
        notify_new_order = EXCLUDED.notify_new_order,
        notify_order_status = EXCLUDED.notify_order_status,
        notify_low_stock = EXCLUDED.notify_low_stock,
        cart_recovery_enabled = EXCLUDED.cart_recovery_enabled,
        cart_recovery_delay_hours = EXCLUDED.cart_recovery_delay_hours,
        cart_recovery_2nd_email = EXCLUDED.cart_recovery_2nd_email,
        marketing_consent_default = EXCLUDED.marketing_consent_default,
        marketing_consent_text = EXCLUDED.marketing_consent_text,
        updated_at = NOW()
      RETURNING *;
    `;
    return { data: rows[0], error: null };
  } catch (error: any) {
    console.error('Error updating email settings:', error);
    return { data: null, error };
  }
}

export async function getEmailTemplates(storeId: string): Promise<EmailTemplate[]> {
  try {
    const { rows } = await sql`
      SELECT * FROM email_templates 
      WHERE store_id = ${storeId}
    `;
    return rows as EmailTemplate[];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }
}

export async function upsertEmailTemplate(template: EmailTemplate) {
  try {
    const { rows } = await sql`
      INSERT INTO email_templates (
        store_id, type, subject, preview_text, html_content, is_active
      ) VALUES (
        ${template.store_id}, ${template.type}, ${template.subject}, 
        ${template.preview_text}, ${template.html_content}, ${template.is_active ?? true}
      )
      ON CONFLICT (store_id, type) DO UPDATE SET
        subject = EXCLUDED.subject,
        preview_text = EXCLUDED.preview_text,
        html_content = EXCLUDED.html_content,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *;
    `;
    return { data: rows[0], error: null };
  } catch (error: any) {
    console.error('Error upserting email template:', error);
    return { data: null, error };
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
