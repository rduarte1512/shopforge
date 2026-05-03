import { NextRequest, NextResponse } from 'next/server';
import { getStoreEmailSettings, sendEmail, logEmail, getEmailTemplate } from '@/lib/email';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { orderId, storeId } = await request.json();
    if (!orderId || !storeId) {
      return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });
    }

    const settings = await getStoreEmailSettings(storeId);
    if (!settings?.resend_api_key) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 400 });
    }

    const { rows: orders } = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
    const order = orders[0];

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const statusLabels: Record<string, string> = {
      pending: 'Receção Confirmada',
      paid: 'Pagamento Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
    };

    const { rows: stores } = await sql`SELECT name FROM stores WHERE id = ${storeId} LIMIT 1`;
    const store = stores[0];

    const template = await getEmailTemplate(storeId, 'order_status');
    const subject = template?.subject || `Encomenda #${orderId.slice(0, 8)} - ${statusLabels[order.status] || order.status}`;
    const html = template?.html_content || `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;"><h2 style="color: ${settings.brand_color || '#00B062'};">Olá ${order.customer_name},</h2><p>O estado da sua encomenda <strong>#${orderId.slice(0, 8)}</strong> foi atualizado:</p><div style="background: ${settings.brand_color || '#00B062'}; color: white; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;"><strong style="font-size: 18px;">${statusLabels[order.status] || order.status}</strong></div>${order.status === 'shipped' ? '<p>Receberá a sua encomenda em breve.</p>' : ''}<p style="color: #666; font-size: 14px; margin-top: 32px;">Com os melhores cumprimentos,<br>${store?.name || 'A nossa loja'}</p></body></html>`;

    const { data, error } = await sendEmail({ 
      apiKey: settings.resend_api_key!, 
      to: order.customer_email, 
      subject, 
      html, 
      from: `${settings.sender_name} <${settings.sender_email || 'noreply@shopforge.dev'}>`, 
    });

    await logEmail({ 
      store_id: storeId, 
      email: order.customer_email, 
      type: 'order_status', 
      status: error ? 'failed' : 'sent',
      message_id: data?.id
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Error sending order status email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}