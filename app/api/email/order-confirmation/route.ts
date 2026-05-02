import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/email';
import { getStoreEmailSettings, sendEmail, logEmail, getEmailTemplate, isEmailUnsubscribed } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { orderId, storeId } = await request.json();
    if (!orderId || !storeId) return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });
    if (!isSupabaseConfigured || !supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    const settings = await getStoreEmailSettings(storeId);
    if (!settings?.resend_api_key) return NextResponse.json({ error: 'Email not configured' }, { status: 400 });
    const { data: order, error: orderError } = await supabase
      .from('orders').select('*, order_items(*), products(*)').eq('id', orderId).single();
    if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (await isEmailUnsubscribed(storeId, order.customer_email)) return NextResponse.json({ message: 'Unsubscribed' });
    const { data: store } = await supabase.from('stores').select('name').eq('id', storeId).single();
    const template = await getEmailTemplate(storeId, 'order_confirmation');
    const items = (order.order_items || []).map((item: any) => ({ name: item.product?.name || 'Produto', quantity: item.quantity, price: item.price }));
    const brandColor = settings.brand_color || '#00B062';
    const logoUrl = settings.logo_url || '';
    const storeName = store?.name || 'A nossa loja';
    const itemsHtml = items.map((item: any) => `<tr><td style="padding:12px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">${item.quantity}</td><td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: order.currency }).format(item.price)}</td></tr>`).join('');
    const subject = template?.subject || `Confirmação da sua encomenda #${orderId.slice(0, 8)}`;
    const html = template?.html_content || `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="height:48px;margin-bottom:24px;">` : `<h1 style="color:${brandColor};margin:0 0 24px;">${storeName}</h1>`}<h2 style="color:${brandColor};">Olá ${order.customer_name},</h2><p>Obrigado pela sua encomenda! Recebemos a sua encomenda e estamos a processá-la.</p><p><strong>Encomenda:</strong> #${orderId.slice(0, 8)}</p><p><strong>Total:</strong> ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: order.currency }).format(order.total)}</p><table style="width:100%;border-collapse:collapse;margin:20px 0;"><thead><tr style="background:${brandColor};color:white;"><th style="padding:12px;text-align:left;">Produto</th><th style="padding:12px;text-align:center;">Qtd</th><th style="padding:12px;text-align:right;">Preço</th></tr></thead><tbody>${itemsHtml}</tbody></table>${order.payment_instructions ? `<div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:20px 0;"><h3 style="margin-top:0;">Informações de Pagamento</h3><p>${order.payment_instructions}</p></div>` : ''}<p style="color:#666;font-size:14px;margin-top:32px;">Receberá um email quando a sua encomenda for enviada.</p></body></html>`;
    const { data, error } = await sendEmail({ apiKey: settings.resend_api_key!, to: order.customer_email, subject, html, from: `${settings.sender_name} <${settings.sender_email || 'noreply@shopforge.dev'}>`, replyTo: settings.reply_to_email || undefined });
    await logEmail({ store_id: storeId, email: order.customer_email, email_type: 'order_confirmation', subject, resend_message_id: data?.id, status: error ? 'failed' : 'sent', metadata: { order_id: orderId } });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Order confirmation email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}