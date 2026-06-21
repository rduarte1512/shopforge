'use server';

import { sql } from '@vercel/postgres';
import { auth } from '@clerk/nextjs/server';

function toNumber(value: any) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentAndPreviousMonth() {
  const now = new Date();
  const current = monthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { current, previous: monthKey(previousDate) };
}

function orderIsRevenue(order: any) {
  return !['cancelled', 'canceled', 'failed'].includes(String(order.status || '').toLowerCase());
}

export async function getFinancialOverviewForUser(userId: string, storeId?: string | null) {
  const { rows: stores } = await sql`
    SELECT * FROM stores
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  const activeStore = storeId
    ? stores.find((store: any) => String(store.id) === String(storeId)) || stores[0]
    : stores[0];

  if (!activeStore) {
    return {
      stores: [],
      selectedStoreId: null,
      metrics: null,
      orders: [],
      monthly: [],
      topProducts: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const [{ rows: orders }, { rows: abandonedRows }] = await Promise.all([
    sql`
      SELECT
        o.*,
        COALESCE(NULLIF(to_jsonb(o)->>'refunded_amount', '')::numeric, 0) as safe_refunded_amount,
        COALESCE(NULLIF(to_jsonb(o)->>'tax_amount', '')::numeric, 0) as safe_tax_amount,
        COALESCE(
          json_agg(
            json_build_object(
              'quantity', oi.quantity,
              'price', oi.price,
              'product_id', oi.product_id,
              'product_name', p.name,
              'cost_per_item', COALESCE(NULLIF(to_jsonb(p)->>'cost_per_item', '')::numeric, 0),
              'tax_rate', COALESCE(NULLIF(to_jsonb(p)->>'tax_rate', '')::numeric, 23)
            )
          ) FILTER (WHERE oi.order_id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.store_id = ${activeStore.id}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    sql`SELECT COUNT(*)::int as count FROM abandoned_carts WHERE store_id = ${activeStore.id}`,
  ]);

  const activeOrders = orders.filter(orderIsRevenue);
  const paidOrders = orders.filter((order: any) => ['paid', 'shipped', 'delivered'].includes(String(order.status || '').toLowerCase()));
  const pendingOrders = orders.filter((order: any) => String(order.status || '').toLowerCase() === 'pending');
  const abandonedCarts = toNumber(abandonedRows[0]?.count);

  let grossRevenue = 0;
  let refunds = 0;
  let productCost = 0;
  let taxAmount = 0;
  const productMap = new Map<string, any>();
  const monthlyMap = new Map<string, any>();

  for (const order of activeOrders) {
    const total = toNumber(order.total);
    const refunded = toNumber(order.safe_refunded_amount) || (String(order.status || '').toLowerCase() === 'refunded' ? total : 0);
    const items = Array.isArray(order.items) ? order.items : [];
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    const key = monthKey(createdAt);
    const month = monthlyMap.get(key) || { month: key, revenue: 0, profit: 0, orders: 0 };

    grossRevenue += total;
    refunds += refunded;
    month.revenue += total - refunded;
    month.orders += 1;

    let orderCost = 0;
    let orderTax = toNumber(order.safe_tax_amount);

    for (const item of items) {
      const quantity = toNumber(item.quantity);
      const price = toNumber(item.price);
      const cost = toNumber(item.cost_per_item);
      const itemRevenue = quantity * price;
      const itemCost = quantity * cost;
      const taxRate = toNumber(item.tax_rate) || 23;

      orderCost += itemCost;
      if (!orderTax) orderTax += itemRevenue * (taxRate / (100 + taxRate));

      const productKey = String(item.product_id || item.product_name || 'produto');
      const product = productMap.get(productKey) || {
        id: productKey,
        name: item.product_name || 'Produto',
        revenue: 0,
        cost: 0,
        quantity: 0,
      };
      product.revenue += itemRevenue;
      product.cost += itemCost;
      product.quantity += quantity;
      productMap.set(productKey, product);
    }

    productCost += orderCost;
    taxAmount += orderTax;
    month.profit += (total - refunded - orderCost - orderTax);
    monthlyMap.set(key, month);
  }

  const netRevenue = grossRevenue - refunds;
  const netProfit = netRevenue - productCost - taxAmount;
  const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
  const conversionBase = paidOrders.length + abandonedCarts;
  const conversionRate = conversionBase > 0 ? (paidOrders.length / conversionBase) * 100 : 0;
  const pendingRecoveryValue = pendingOrders.reduce((sum: number, order: any) => sum + toNumber(order.total), 0);

  const { current, previous } = getCurrentAndPreviousMonth();
  const currentMonth = monthlyMap.get(current)?.revenue || 0;
  const previousMonth = monthlyMap.get(previous)?.revenue || 0;
  const monthlyGrowth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : currentMonth > 0 ? 100 : 0;

  const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  const topProducts = Array.from(productMap.values())
    .map((product) => ({ ...product, profit: product.revenue - product.cost, margin: product.revenue > 0 ? ((product.revenue - product.cost) / product.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return {
    stores,
    selectedStoreId: activeStore.id,
    metrics: {
      grossRevenue,
      netRevenue,
      netProfit,
      productCost,
      taxAmount,
      refunds,
      margin,
      conversionRate,
      ordersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      abandonedCarts,
      pendingRecoveryValue,
      currentMonth,
      previousMonth,
      monthlyGrowth,
    },
    orders,
    monthly,
    topProducts,
    generatedAt: new Date().toISOString(),
  };
}

export async function getFinancialOverviewAction(storeId?: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return getFinancialOverviewForUser(userId, storeId);
}

export function buildFinanceCsv(data: Awaited<ReturnType<typeof getFinancialOverviewForUser>>) {
  const rows = [
    ['Métrica', 'Valor'],
    ['Receita bruta', data.metrics?.grossRevenue ?? 0],
    ['Receita líquida', data.metrics?.netRevenue ?? 0],
    ['Lucro líquido', data.metrics?.netProfit ?? 0],
    ['Custo dos produtos', data.metrics?.productCost ?? 0],
    ['IVA estimado', data.metrics?.taxAmount ?? 0],
    ['Reembolsos', data.metrics?.refunds ?? 0],
    ['Margem', `${(data.metrics?.margin ?? 0).toFixed(2)}%`],
    ['Taxa de conversão', `${(data.metrics?.conversionRate ?? 0).toFixed(2)}%`],
    [],
    ['Encomenda', 'Cliente', 'Estado', 'Total', 'Reembolso', 'Criada em'],
    ...data.orders.map((order: any) => [order.id, order.customer_email || order.customer_name || '', order.status || '', order.total || 0, order.safe_refunded_amount || 0, order.created_at || '']),
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildSimpleFinancePdf(data: Awaited<ReturnType<typeof getFinancialOverviewForUser>>) {
  const lines = [
    'ShopForge - Relatorio Financeiro',
    `Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-PT')}`,
    `Receita liquida: EUR ${(data.metrics?.netRevenue ?? 0).toFixed(2)}`,
    `Lucro liquido: EUR ${(data.metrics?.netProfit ?? 0).toFixed(2)}`,
    `Margem: ${(data.metrics?.margin ?? 0).toFixed(2)}%`,
    `Conversao: ${(data.metrics?.conversionRate ?? 0).toFixed(2)}%`,
    `Reembolsos: EUR ${(data.metrics?.refunds ?? 0).toFixed(2)}`,
    `IVA estimado: EUR ${(data.metrics?.taxAmount ?? 0).toFixed(2)}`,
    `Comparacao mensal: ${(data.metrics?.monthlyGrowth ?? 0).toFixed(2)}%`,
  ];

  const stream = ['BT', '/F1 12 Tf', '50 790 Td', '16 TL', ...lines.map((line) => `(${pdfEscape(line)}) Tj T*`), 'ET'].join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}
