import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed = new Set(['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'heartbeat']);
const kinds = new Set(['home', 'product', 'cart', 'other']);
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return fail('Origem não permitida.', 403); }
    catch { return fail('Origem inválida.', 403); }
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') return fail('Origem não permitida.', 403);
  if (Number(request.headers.get('content-length') || 0) > 1500) return fail('Pedido demasiado grande.', 413);
  const body = await request.text();
  if (body.length > 1500) return fail('Pedido demasiado grande.', 413);
  let data: any;
  try { data = JSON.parse(body); } catch { return fail('Pedido inválido.', 400); }

  const { domain, visitorId, sessionId, eventId, eventType, pageKind } = data || {};
  const productId = data?.productId ?? null;
  if (typeof domain !== 'string' || domain.length > 100 || !/^[a-z0-9-]+(?:\.[a-z0-9.-]+)?$/i.test(domain)) return fail('Loja inválida.', 400);
  if (![visitorId, sessionId, eventId].every(v => typeof v === 'string' && idPattern.test(v))) return fail('Identificadores inválidos.', 400);
  if (!allowed.has(eventType) || !kinds.has(pageKind)) return fail('Evento inválido.', 400);
  if (productId !== null && (typeof productId !== 'string' || !idPattern.test(productId))) return fail('Produto inválido.', 400);
  if (['product_view', 'add_to_cart'].includes(eventType) && !productId) return fail('Produto em falta.', 400);
  // Não recolher IP, user-agent, email, cookies ou outras informações pessoais.
  try {
    const { rows } = await sql`SELECT id FROM stores WHERE domain = ${domain} LIMIT 1`;
    const storeId = rows[0]?.id;
    if (!storeId) return fail('Loja não encontrada.', 404);

    if (productId) {
      const check = await sql`SELECT id FROM products WHERE id = ${productId} AND store_id = ${storeId} LIMIT 1`;
      if (!check.rows[0]) return fail('Produto não encontrado nesta loja.', 404);
    }
    if (eventType === 'heartbeat') {
      await sql`UPDATE store_traffic_sessions SET last_seen = now()
        WHERE store_id = ${storeId} AND session_id = ${sessionId} AND visitor_id = ${visitorId}`;
    } else {
      await sql`
        WITH accepted AS (
          SELECT 1 AS ok WHERE (
            SELECT COUNT(*) FROM store_traffic_events
            WHERE store_id = ${storeId} AND session_id = ${sessionId}
              AND created_at >= now() - interval '1 hour'
          ) < 120
        ), saved AS (
          INSERT INTO store_traffic_events
            (store_id, event_id, session_id, visitor_id, event_type, page_kind, product_id)
          SELECT ${storeId}::uuid, ${eventId}::uuid, ${sessionId}::uuid, ${visitorId}::uuid,
            ${eventType}, ${pageKind}, ${productId}::uuid
          FROM accepted
          ON CONFLICT (store_id, event_id) DO NOTHING
          RETURNING store_id, session_id, visitor_id, event_type
        ), touched AS (
          INSERT INTO store_traffic_sessions
            (store_id, session_id, visitor_id, started_at, last_seen, page_views)
          SELECT store_id, session_id, visitor_id, now(), now(),
            CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END
          FROM saved
          ON CONFLICT (store_id, session_id) DO UPDATE SET
            last_seen = now(),
            page_views = store_traffic_sessions.page_views + EXCLUDED.page_views
          RETURNING session_id
        ) SELECT COUNT(*)::int AS processed FROM touched
      `;
    }
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Traffic ingest unavailable:', error instanceof Error ? error.message : 'unknown');
    return fail('Estatísticas temporariamente indisponíveis.', 503);
  }
}
