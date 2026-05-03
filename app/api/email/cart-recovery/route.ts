import { NextRequest, NextResponse } from 'next/server';
import { getStoreEmailSettings, sendEmail, logEmail, getEmailTemplate, getAbandonedCartsNeedingRecovery, markAbandonmentEmailSent, isEmailUnsubscribed } from '@/lib/email';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { storeId, hours } = await request.json();
    if (!storeId) return NextResponse.json({ error: 'Missing storeId' }, { status: 400 });

    const settings = await getStoreEmailSettings(storeId);
    if (!settings?.resend_api_key || !settings?.cart_recovery_enabled) {
      return NextResponse.json({ message: 'Cart recovery disabled' }, { status: 200 });
    }

    const abandondedCarts = await getAbandonedCartsNeedingRecovery(storeId, hours || settings.cart_recovery_delay_hours || 1);
    let sent = 0;

    for (const cart of abandondedCarts) {
      if (!cart.email) continue;
      if (await isEmailUnsubscribed(storeId, cart.email)) continue;

      const { rows: stores } = await sql`SELECT * FROM stores WHERE id = ${storeId} LIMIT 1`;
      const store = stores[0];

      const template = await getEmailTemplate(storeId, 'cart_recovery');
      const subject = template?.subject || 'Esqueceu-se de algo?';
      
      const items = cart.cart_data?.items || [];
      const itemsHtml = items.slice(0, 5).map((item: any) => `<tr><td style="padding: 8px;">${item.name || 'Produto'}</td><td style="padding: 8px; text-align: center;">${item.quantity || 1}</td></tr>`).join('');
      
      const cartUrl = `https://${store?.domain || 'loja.com'}/cart`;
      const html = template?.html_content || `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;"><h2 style="color: ${settings.brand_color || '#00B062'};">Olá! 👋</h2><p>Parece que deixou alguns itens no seu carrinho...</p><table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table><div style="text-align: center; margin: 24px 0;"><a href="${cartUrl}" style="background: ${settings.brand_color || '#00B062'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Completar Encomenda</a></div></body></html>`;

      const { data, error } = await sendEmail({ 
        apiKey: settings.resend_api_key!, 
        to: cart.email, 
        subject, 
        html, 
        from: `${settings.sender_name} <${settings.sender_email || 'noreply@shopforge.dev'}>`, 
      });

      await markAbandonmentEmailSent(cart.id);
      await logEmail({ 
        store_id: storeId, 
        email: cart.email, 
        type: 'cart_recovery', 
        status: error ? 'failed' : 'sent',
        message_id: data?.id
      });

      if (!error) sent++;
    }

    return NextResponse.json({ success: true, total: abandondedCarts.length, sent });
  } catch (error: any) {
    console.error('Cart recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
