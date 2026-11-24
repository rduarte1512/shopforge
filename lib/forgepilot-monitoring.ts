import { sql } from '@vercel/postgres';

// Only monitoring records are written. No storefront changes or external messages.
export async function refreshForgePilotMonitoring(storeId?: string) {
  const result = await sql.query(
    "WITH metrics AS (SELECT w.store_id, s.description, "
    + "(SELECT count(*) FROM products p WHERE p.store_id=w.store_id AND p.stock BETWEEN 0 AND 5) AS low_stock, "
    + "(SELECT count(*) FROM products p WHERE p.store_id=w.store_id AND length(coalesce(p.description,'')) < 80) AS thin_copy, "
    + "(SELECT count(DISTINCT visitor_id) FROM store_traffic_events e WHERE e.store_id=w.store_id AND e.event_type='page_view' AND e.created_at >= now()-interval '7 days') AS visitors, "
    + "(SELECT count(DISTINCT visitor_id) FROM store_traffic_events e WHERE e.store_id=w.store_id AND e.event_type='add_to_cart' AND e.created_at >= now()-interval '7 days') AS carts, "
    + "(SELECT count(DISTINCT visitor_id) FROM store_traffic_events e WHERE e.store_id=w.store_id AND e.event_type='checkout_started' AND e.created_at >= now()-interval '7 days') AS checkouts, "
    + "(SELECT p.name FROM store_traffic_events e JOIN products p ON p.id=e.product_id AND p.store_id=e.store_id WHERE e.store_id=w.store_id AND e.event_type='product_view' AND e.created_at>=now()-interval '7 days' GROUP BY p.id,p.name HAVING count(*)>=10 ORDER BY count(*) DESC LIMIT 1) AS top_product "
    + "FROM forgepilot_workspace w JOIN stores s ON s.id=w.store_id JOIN profiles p ON p.id=s.user_id WHERE p.subscription_tier::text IN ('PRO','BUSINESS','ENTERPRISE') AND p.subscription_status::text IN ('active','trialing') AND w.monitoring_enabled AND ($1::uuid IS NULL OR w.store_id=$1::uuid)) "
    + "UPDATE forgepilot_workspace w SET checked_at=now(), alerts = "
    + "(CASE WHEN m.low_stock>0 THEN jsonb_build_array(jsonb_build_object('title','Stock reduzido','detail',m.low_stock||' produto(s) com stock de 0 a 5 unidades.','severity','high','href','/dashboard/products')) ELSE '[]'::jsonb END) || "
    + "(CASE WHEN m.thin_copy>0 THEN jsonb_build_array(jsonb_build_object('title','Oportunidade de conteúdo','detail',m.thin_copy||' produto(s) têm descrições com menos de 80 caracteres.','severity','medium','href','/dashboard/products')) ELSE '[]'::jsonb END) || "
    + "(CASE WHEN m.visitors>=20 AND m.carts>=15 AND m.checkouts::numeric/NULLIF(m.carts,0)<0.3 THEN jsonb_build_array(jsonb_build_object('title','Rever o checkout','detail','Nos últimos 7 dias houve '||m.carts||' visitantes com carrinho e '||m.checkouts||' com início de checkout. São contagens independentes, não abandono atribuído.','severity','medium','href','/dashboard/forgepilot?tab=growth')) ELSE '[]'::jsonb END) || "
    + "(CASE WHEN m.top_product IS NOT NULL THEN jsonb_build_array(jsonb_build_object('title','Produto com interesse','detail',m.top_product||' é o produto mais consultado no período entre os que tiveram pelo menos 10 visualizações.','severity','info','href','/dashboard/products')) ELSE '[]'::jsonb END) || "
    + "(CASE WHEN m.visitors<20 THEN jsonb_build_array(jsonb_build_object('title','Amostra de tráfego reduzida','detail','Menos de 20 visitantes medidos com consentimento em 7 dias. Evita conclusões precipitadas.','severity','info','href','/dashboard/forgepilot?tab=growth')) ELSE '[]'::jsonb END) "
    + "FROM metrics m WHERE w.store_id=m.store_id RETURNING w.store_id",
    [storeId || null],
  );
  return result.rows.length;
}
