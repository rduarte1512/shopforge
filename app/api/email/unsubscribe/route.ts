import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, unsubscribeEmail, logEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { storeId, email } = await request.json();
    if (!storeId || !email) {
      return NextResponse.json({ error: 'Missing storeId or email' }, { status: 400 });
    }
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    await unsubscribeEmail(storeId, email);
    await logEmail({ store_id: storeId, email, email_type: 'test', subject: 'Unsubscribe', status: 'unsubscribed' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store'); const email = searchParams.get('email');
  if (!storeId || !email) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  try {
    await unsubscribeEmail(storeId, email);
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial; max-width: 500px; margin: 100px auto; text-align: center;"><h2>✅ Desinscrição completa</h2><p>Já não receberá emails de marketing.</p><a href="/">Voltar à loja</a></body></html>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}