import { sql } from '`vercel/postgres';

export type TrafficPeriod = 1 | 7 | 30;
export type TrafficOverview = {
  available: boolean;
  period: TrafficPeriod;
  generatedAt: string;
  summary: {
    live: number;
    visitors: number;
    sessions: number;
    pageViews: number;
    productViewers: number;
    cartVisitors: number;
    checkoutVisitors: number;
    returningVisitors: number;
    previousVisitors: number;
    paidOrders: number;
  };
  daily: Array<{ date: string; visitors: number; pageViews: number }>;
  topProducts: Array<{ id: string; name: string; views: number; addToCarts: number }>;
  note: string;
};
export const EMPTY_SUMMARY: TrafficOverview['summary'] = {
  live: 0, visitors: 0, sessions: 0, pageViews: 0, productViewers: 0,
  cartVisitors: 0, checkoutVisitors: 0, returningVisitors: 0, previousVisitors: 0, paidOrders: 0,
};
export function daysBack(days: TrafficPeriod, now: Date = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}
export function toNumber(input: unknown) {
  const value = Number(input);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
export function meaningfulRate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}
export function generateTrafficInsights(data: TrafficOverview): Array<{ title: string; message: string; priority: 'high' | 'medium' | 'info' }> {
  if (!data.available) return [{ title: 'Ativa o Growth Lab', message: 'Executa a migração de tráfego no Neon para começares a medir visitas reais.', priority: 'info' }];
  const { visitors, pageViews, productViewers, cartVisitors, checkoutVisitors } = data.summary;
  if (visitors < 20) return [{
    title: 'Recolhe primeiro uma amostra suficiente',
    message: 'Com menos de 20 visitantes que aceitaram estatísticas neste período, as percentagens podem oscilar muito. Partilha a loja e volta a analisar os dados.',
    priority: 'info',
  }];
  const result: ReturnType<typeof generateTrafficInsights> = [];
  if (productViewers / visitors < 0.35) result.push({
    title: 'Ajuda os visitantes a descobrir produtos',
    message: 'Poucos visitantes abriram uma página de produto. Testa categorias mais claras, uma coleção mais visível e botões de navegação.',
    priority: 'high',
  });
  if (productViewers >= 15 && cartVisitors / productViewers < 0.12) result.push({
    title: 'Melhora as páginas de produto',
    message: 'Existe interesse nos artigos, mas poucos visitantes adicionam algo ao carrinho. Revê fotografias, descrições, tamanhos e custos.',
    priority: 'high',
  });
  if (cartVisitors >= 15 && checkoutVisitors / cartVisitors < 0.3) result.push({
    title: 'Simplifica o caminho até à compra',
    message: 'Há visitantes que adicionam artigos, mas não iniciam a finalização. Torna os custos de envio e as formas de pagamento claros.',
    priority: 'medium',
  });
  if (pageViews / visitors > 4 && productViewers / visitors < 0.45) result.push({
    title: 'Reorganiza a navegação',
    message: 'Os visitantes consultam várias páginas sem chegar aos produtos. Experimenta simplificar o menu e destacar as coleções.',
    priority: 'medium',
  });
  if (!result.length) result.push({
    title: 'Acompanha a evolução da loja',
    message: 'Os dados atuais não mostram um problema evidente nos primeiros passos. Compara períodos e continua a melhorar a experiência mobile.',
    priority: 'info',
  });
  return result.slice(0, 3);
}

export async function getStoreTrafficOverview(storeId: string, period: TrafficPeriod = 7): Promise<TrafficOverview> {
  const now = new Date();
  const since = daysBack(period, now);
  const beforeSince = new Date(now.getTime() - period * 2 * 24 * 60 * 60 * 1000).toISOString();
  const fallback = (available: boolean, note: string): TrafficOverview => ({
    available, period, generatedAt: new Date().toISOString(),
    summary: { ...EMPTY_SUMMARY }, daily: [], topProducts: [], note,
  });
  try {
    const [eventTotals, visits, live, returning, previous, daily, productViews, paidOrders] = await Promise.all([
      sql`SELECT
        COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view')::int AS visitors,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
        COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'product_view')::int AS product_viewers,
        COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'add_to_cart')::int AS cart_visitors,
        COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'checkout_started')::int AS checkout_visitors
        FROM store_traffic_events WHERE store_id = ${storeId} AND created_at >= ${since}::timestamptz`,
      sql`SELECT COUNT(*)::int AS count FROM store_traffic_sessions WHERE store_id = ${storeId} AND started_at >= ${since}::timestamptz`,
      sql`SELECT COUNT(DISTINCT visitor_id)::int AS count FROM store_traffic_sessions
        WHERE store_id = ${storeId} AND last_seen >= now() - interval '5 minutes'`,
      sql`SELECT COUNT(*)::int AS count FROM (
          SELECT visitor_id FROM store_traffic_sessions WHERE store_id = ${storeId}
          GROUP BY visitor_id
          HAVING MIN(started_at) < ${since}::timestamptz
            AND MAX(last_seen) >= ${since}::timestamptz
        ) AS returning`,
      sql`SELECT COUNT(DISTINCT visitor_id)::int AS count FROM store_traffic_events
        WHERE store_id = ${storeId} AND event_type = 'page_view'
          AND created_at >= ${beforeSince}::timestamptz AND created_at < ${since}::timestamptz`,
      sql`SELECT
          to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
          COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view')::int AS visitors,
          COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views
        FROM store_traffic_events
        WHERE store_id = ${storeId} AND created_at >= ${since}::timestamptz
        GROUP BY 1 ORDER BY 1 ASC`,
      sql`SELECT e.product_id::text AS id,
          COALESCE(MAX(p.name), 'Produto removido') AS name,
          COUNT(*) FILTER (WHERE e.event_type = 'product_view')::int AS views,
          COUNT(*) FILTER (WHERE e.event_type = 'add_to_cart')::int AS add_to_carts
        FROM store_traffic_events e
        LEFT JOIN products p ON p.id = e.product_id AND p.store_id = e.store_id
        WHERE e.store_id = ${storeId} AND e.created_at >= ${since}::timestamptz
          AND e.product_id IS NOT NULL AND e.event_type IN ('product_view', 'add_to_cart')
        GROUP BY e.product_id ORDER BY views DESC, add_to_carts DESC LIMIT 6`,
      sql`SELECT COUNT(*)::int AS count FROM orders
        WHERE store_id = ${storeId} AND created_at >= ${since}::timestamptz
          AND LOWER(status::text) IN ('paid', 'shipped', 'delivered')`,
    ]);
    const raw = eventTotals.rows[0] || {};
    return {
      available: true,
      period,
      generatedAt: now.toISOString(),
      summary: {
        live: toNumber(live.rows[0]?.count),
        visitors: toNumber(raw.visitors),
        sessions: toNumber(visits.rows[0]?.count),
        pageViews: toNumber(raw.page_views),
        productViewers: toNumber(raw.product_viewers),
        cartVisitors: toNumber(raw.cart_visitors),
        checkoutVisitors: toNumber(raw.checkout_visitors),
        returningVisitors: toNumber(returning.rows[0]?.count),
        previousVisitors: toNumber(previous.rows[0]?.count),
        paidOrders: toNumber(paidOrders.rows[0]?.count),
      },
      daily: daily.rows.map(row => ({
        date: String(row.day),
        visitors: toNumber(row.visitors),
        pageViews: toNumber(row.page_views),
      })),
      topProducts: productViews.rows.map(row => ({
        id: String(row.id), name: String(row.name),
        views: toNumber(row.views), addToCarts: toNumber(row.add_to_carts),
      })),
      note: 'Medição de visitantes que aceitaram estatísticas. Ativos = atividade nos últimos 5 minutos. Datas em UTC. Encomendas pagas são independentes e não atribuídas a visitantes.',
    };
  } catch (error) {
    // Durante a instalação, devolver estado "por configurar" em vez de zeros falsos.
    if (typeof error === 'object' && error && 'code' in error && error.code === '42P01') {
      return fallback(false, 'A migração Growth Lab ainda não foi aplicada na base de dados.');
    }
    console.error('Growth Lab traffic fetch failed', error);
    return fallback(false, 'Não foi possível consultar o tráfego agora. Verifica a base de dados.');
  }
}
