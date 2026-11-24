import { requireFeature } from '@/lib/plan-access';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { getStoreTrafficOverview, type TrafficPeriod } from '@/lib/store-traffic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sem sessão iniciada.' }, { status: 401 });
  try{await requireFeature('traffic',userId);}catch{return NextResponse.json({error:'Funcionalidade disponível num plano superior.'},{status:403});}
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId') || '';
  const days = Number(url.searchParams.get('days') || 7);
  if (!/^[0-9a-f-]{36}$/i.test(storeId) || ![1, 7, 30].includes(days)) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
  }
  const { rows } = await sql`SELECT id FROM stores WHERE id = ${storeId} AND user_id = ${userId} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
  const overview = await getStoreTrafficOverview(storeId, days as TrafficPeriod);
  return NextResponse.json(overview, { headers: { 'Cache-Control': 'no-store, private' } });
}
