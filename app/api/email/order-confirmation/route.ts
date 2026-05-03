import { NextRequest, NextResponse } from 'next/server';
import { getStoreEmailSettings, sendEmail, logEmail, getEmailTemplate, isEmailUnsubscribed } from '@/lib/email';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { orderId, storeId } = await request.json();
    if (!orderId || !storeId) return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });

    const settings = await getStoreEmailSettings(storeId);
    if (!settings?.resend_api_key) return NextResponse.json({ error: 'Email not configured' }, { status: 400 });

    const { rows: orders } = await sql`
      SELECT o.*, 
      (SELECT json_agg(json_build_object('name', p.name, 'quantity', oi.quantity, 'price', oi.price)) 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = o.id) as items
      FROM orders o 
      WHERE o.id = ${orderId} 
      LIMIT 1
    `;
    const order = orders[0];

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (await isEmailUnsubscribed(storeId, order.customer_email)) return NextResponse.json({ message: 'Unsubscribed' });

    const { rows: stores } = await sql`SELECT name FROM stores WHERE id = ${storeId} LIMIT 1`;
    const store = stores[0];

    const template = await getEmailTemplate(storeId, 'order_confirmation');
    const items = order.items || [];
    const brandColor = settings.brand_color || '#00B062';
    const logoUrl = settings.logo_url || '';
    const storeName = store?.name || 'A nossa loja';

    const itemsHtml = items.map((item: any) => `<tr><td style="padding:12px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">${item.quantity}</td><td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: order.currency }).format(item.price)}</td></tr>`).join('');
    
    const subject = template?.subject || `Confirmação da sua encomenda #${orderId.slice(0, 8)}`;
    const html = template?.html_content || `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="height:48px;margin-bottom:24px;">` : `<h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>`}<h2 style="color:${brandColor};">Olá ${order.customer_name},</h2><p>Obrigado pela sua encomenda! Recebemos a sua encomenda e estamos a processá-la.</p><p><strong>Encomenda:</strong> #${orderId.slice(0, 8)}</p><p><strong>Total:</strong> ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: order.currency }).format(order.total)}</p><table style="width:100%;border-collapse:collapse;margin:20px 0;"><thead><tr style="background:${brandColor};color:white;"><th style="padding:12px;text-align:left;">Produto</th><th style="padding:12px;text-align:center;">Qtd</th><th style="padding:12px;text-align:right;">Preço</th></tr></thead><tbody>${itemsHtml}</tbody></table>${order.payment_instructions ? `<div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:20px 0;"><h3 style="margin-top:0;">Informações de Pagamento</h3><p>${order.payment_instructions}</p></div>` : ''}<p style="color:#666;font-size:14px;margin-top:32px;">Receberá um email quando a sua encomenda for enviada.</p></body></html>`;

    const { data, error } = await sendEmail({ 
      apiKey: settings.resend_api_key!, 
      to: order.customer_email, 
      subject, 
      html, 
      from: `${settings.sender_name} <${settings.sender_email || 'noreply@shopforge.dev'}>`, 
      replyTo: settings.reply_to_email || undefined 
    });

    await logEmail({ 
      store_id: storeId, 
      email: order.customer_email, 
      type: 'order_confirmation', 
      status: error ? 'failed' : 'sent',
      message_id: data?.id
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Order confirmation email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
