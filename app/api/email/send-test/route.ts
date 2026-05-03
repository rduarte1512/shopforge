import { NextRequest, NextResponse } from 'next/server';
import { getStoreEmailSettings, sendEmail, logEmail } from '@/lib/email';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { storeId, to } = await request.json();
    if (!storeId || !to) {
      return NextResponse.json({ error: 'Missing storeId or to' }, { status: 400 });
    }

    const settings = await getStoreEmailSettings(storeId);
    if (!settings?.resend_api_key) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 400 });
    }

    const { rows: stores } = await sql`SELECT name FROM stores WHERE id = ${storeId} LIMIT 1`;
    const store = stores[0];

    const subject = 'Email de teste - ShopForge';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;"><h2 style="color: ${settings.brand_color || '#00B062'};">✅ Teste de Email</h2><p>Este é um email de teste enviado pela ${store?.name || 'sua loja'} através do ShopForge.</p><p>Se recebeu este email, a configuração do Resend está a funcionar corretamente!</p><hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"><p style="color: #666; font-size: 12px;">Enviado por ShopForge Email Marketing</p></body></html>`;
    
    const { data, error } = await sendEmail({ 
      apiKey: settings.resend_api_key!, 
      to, 
      subject, 
      html, 
      from: `${settings.sender_name} <${settings.sender_email || 'noreply@shopforge.dev'}>`, 
    });

    await logEmail({ 
      store_id: storeId, 
      email: to, 
      type: 'test', 
      status: error ? 'failed' : 'sent',
      message_id: data?.id
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Send test email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}