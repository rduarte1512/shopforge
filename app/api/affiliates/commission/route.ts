import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        affiliate_link_id,
        store_id,
        status
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.affiliate_link_id) {
      return NextResponse.json({ message: 'No affiliate link associated' });
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ message: 'Order not paid yet' });
    }

    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('percentage, conversion_count, total_commission')
      .eq('id', order.affiliate_link_id)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Affiliate link not found' },
        { status: 404 }
      );
    }

    const commissionAmount = (order.total * link.percentage) / 100;

    await supabase.from('affiliate_commissions').insert({
      affiliate_link_id: order.affiliate_link_id,
      order_id: order.id,
      amount: commissionAmount,
      percentage_used: link.percentage,
      status: 'pending',
    });

    await supabase
      .from('affiliate_links')
      .update({
        conversion_count: (link.conversion_count || 0) + 1,
        total_commission: (link.total_commission || 0) + commissionAmount,
      })
      .eq('id', order.affiliate_link_id);

    return NextResponse.json({
      success: true,
      commissionAmount,
      percentage: link.percentage,
    });
  } catch (error) {
    console.error('Error processing affiliate commission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}