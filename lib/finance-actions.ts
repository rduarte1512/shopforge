'use server';

import { sql } from '@vercel/postgres';
import { auth } from '@clerk/nextjs/server';

const n = (v: any) => Number.isFinite(Number(v || 0)) ? Number(v || 0) : 0;
const month = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export async function getFinancialOverviewForUser(userId: string, storeId?: string | null) {
  const { rows: stores } = await sql`SELECT * FROM stores WHERE user_id = ${userId} ORDER BY created_at DESC`;
  const store = storeId ? stores.find((s: any) => String(s.id) === String(storeId)) || stores[0] : stores[0];
  if (!store) return { stores: [], selectedStoreId: null, metrics: null, orders: [], monthly: [], topProducts: [], generatedAt: new Date().toISOString() };

  const [{ rows: orders }, { rows: items }, { rows: carts }] = await Promise.all([
    sql`SELECT * FROM orders WHERE store_id = ${store.id} ORDER BY created_at DESC`,
    sql`SELECT oi.*, p.name as product_name, COALESCE(p.cost_per_item, 0) as cost_per_item, COALESCE(p.tax_rate, 23) as tax_rate FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN products p ON p.id = oi.product_id WHERE o.store_id = ${store.id}`,
    sql`SELECT COUNT(*)::int as count FROM abandoned_carts WHERE store_id = ${store.id}`,
  ]);

  const itemByOrder = new Map<string, any[]>();
  for (const item of items) itemByOrder.set(String(item.order_id), [...(itemByOrder.get(String(item.order_id)) || []), item]);

  const products = new Map<string, any>();
  const months = new Map<string, any>();
  let grossRevenue = 0, refunds = 0, productCost = 0, taxAmount = 0;

  for (const order of orders) {
    if (['cancelled', 'canceled', 'failed'].includes(String(order.status || '').toLowerCase())) continue;
    const total = n(order.total);
    const refund = n(order.refunded_amount) || (String(order.status || '').toLowerCase() === 'refunded' ? total : 0);
    const list = itemByOrder.get(String(order.id)) || [];
    let cost = 0;
    let tax = n(order.tax_amount);

    for (const item of list) {
      const quantity = n(item.quantity);
      const revenue = quantity * n(item.price);
      const itemCost = quantity * n(item.cost_per_item);
      cost += itemCost;
      if (!tax) tax += revenue * ((n(item.tax_rate) || 23) / (100 + (n(item.tax_rate) || 23)));
      const id = String(item.product_id || item.product_name || 'produto');
      const p = products.get(id) || { id, name: item.product_name || 'Produto', quantity: 0, revenue: 0, cost: 0 };
      p.quantity += quantity; p.revenue += revenue; p.cost += itemCost; products.set(id, p);
    }

    const mk = month(order.created_at ? new Date(order.created_at) : new Date());
    const m = months.get(mk) || { month: mk, revenue: 0, profit: 0, orders: 0 };
    m.orders += 1; m.revenue += total - refund; m.profit += total - refund - cost - tax; months.set(mk, m);
    grossRevenue += total; refunds += refund; productCost += cost; taxAmount += tax;
  }

  const paidOrders = orders.filter((o: any) => ['paid', 'shipped', 'delivered'].includes(String(o.status || '').toLowerCase()));
  const pendingOrders = orders.filter((o: any) => String(o.status || '').toLowerCase() === 'pending');
  const netRevenue = grossRevenue - refunds;
  const netProfit = netRevenue - productCost - taxAmount;
  const now = new Date();
  const currentMonth = n(months.get(month(now))?.revenue);
  const previousMonth = n(months.get(month(new Date(now.getFullYear(), now.getMonth() - 1, 1)))?.revenue);
  const abandonedCarts = n(carts[0]?.count);

  return {
    stores,
    selectedStoreId: store.id,
    metrics: {
      grossRevenue, netRevenue, netProfit, productCost, taxAmount, refunds,
      margin: netRevenue ? (netProfit / netRevenue) * 100 : 0,
      conversionRate: paidOrders.length + abandonedCarts ? (paidOrders.length / (paidOrders.length + abandonedCarts)) * 100 : 0,
      ordersCount: orders.length, paidOrdersCount: paidOrders.length, abandonedCarts,
      pendingRecoveryValue: pendingOrders.reduce((sum: number, o: any) => sum + n(o.total), 0),
      currentMonth, previousMonth,
      monthlyGrowth: previousMonth ? ((currentMonth - previousMonth) / previousMonth) * 100 : currentMonth ? 100 : 0,
    },
    orders,
    monthly: Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month)),
    topProducts: Array.from(products.values()).map((p) => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : 0 })).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    generatedAt: new Date().toISOString(),
  };
}

export async function getFinancialOverviewAction(storeId?: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return getFinancialOverviewForUser(userId, storeId);
}

export async function buildFinanceCsv(data: any) {
  const rows = [['Métrica', 'Valor'], ['Receita líquida', data.metrics?.netRevenue ?? 0], ['Lucro líquido', data.metrics?.netProfit ?? 0], ['Custo dos produtos', data.metrics?.productCost ?? 0], ['IVA', data.metrics?.taxAmount ?? 0], ['Reembolsos', data.metrics?.refunds ?? 0], [], ['Encomenda', 'Estado', 'Total'], ...data.orders.map((o: any) => [o.id, o.status || '', o.total || 0])];
  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

export async function buildSimpleFinancePdf(data: any) {
  return `ShopForge Financeiro\nReceita líquida: ${data.metrics?.netRevenue ?? 0}\nLucro líquido: ${data.metrics?.netProfit ?? 0}\nMargem: ${data.metrics?.margin ?? 0}%`;
}
