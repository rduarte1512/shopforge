import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const { rows: orders } = await sql`
      SELECT id, total, affiliate_link_id, store_id, status 
      FROM orders 
      WHERE id = ${orderId} 
      LIMIT 1
    `;
    
    const order = orders[0];

    if (!order) {
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

    const { rows: links } = await sql`
      SELECT percentage, conversion_count, total_commission 
      FROM affiliate_links 
      WHERE id = ${order.affiliate_link_id} 
      LIMIT 1
    `;
    
    const link = links[0];

    if (!link) {
      return NextResponse.json(
        { error: 'Affiliate link not found' },
        { status: 404 }
      );
    }

    const commissionAmount = (Number(order.total) * Number(link.percentage)) / 100;

    await sql`
      INSERT INTO affiliate_commissions (affiliate_link_id, order_id, amount, percentage_used, status)
      VALUES (${order.affiliate_link_id}, ${order.id}, ${commissionAmount}, ${link.percentage}, 'pending')
      ON CONFLICT (order_id) DO NOTHING
    `;

    await sql`
      UPDATE affiliate_links 
      SET 
        conversion_count = COALESCE(conversion_count, 0) + 1,
        total_commission = COALESCE(total_commission, 0) + ${commissionAmount}
      WHERE id = ${order.affiliate_link_id}
    `;

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
