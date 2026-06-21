import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrders, getProducts } from '@/lib/db';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const storeId = new URL(request.url).searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'Missing store' }, { status: 400 });

  const { rows } = await sql`SELECT id FROM stores WHERE id = ${storeId} AND user_id = ${userId} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [products, orders] = await Promise.all([getProducts(storeId), getOrders(storeId)]);
  return NextResponse.json({ products, orders, generatedAt: new Date().toISOString() });
}
