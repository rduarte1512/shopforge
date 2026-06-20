'use server';

const ORDER_COLUMN_VALUES: Record<string, (orderData: any) => any> = {
  store_id: (orderData) => orderData.store_id,
  customer_name: (orderData) => orderData.customer_name,
  customer_email: (orderData) => orderData.customer_email,
  status: (orderData) => orderData.status || 'pending',
  total: (orderData) => Number(orderData.total) || 0,
  subtotal: (orderData) => Number(orderData.subtotal) || 0,
  shipping_cost: (orderData) => Number(orderData.shipping_cost) || 0,
  discount_amount: (orderData) => Number(orderData.discount_amount) || 0,
  coupon_id: (orderData) => orderData.coupon_id || null,
  shipping_method_id: (orderData) => orderData.shipping_method_id || null,
  currency: (orderData) => orderData.currency || 'EUR',
  payment_method_id: (orderData) => orderData.payment_method_id || null,
  payment_method_type: (orderData) => orderData.payment_method_type || null,
  payment_instructions: (orderData) => orderData.payment_instructions || null,
  affiliate_link_id: (orderData) => orderData.affiliate_link_id || null,
};

const ORDER_ITEM_COLUMN_VALUES: Record<string, (item: any, orderId: string) => any> = {
  order_id: (_item, orderId) => orderId,
  product_id: (item) => item.product_id || null,
  quantity: (item) => Number(item.quantity) || 1,
  price: (item) => Number(item.price) || 0,
};

async function tryPrepareCheckoutSchema(sql: any) {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0.00`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id UUID`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_type TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_instructions TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_link_id UUID`;
  } catch (error) {
    console.warn('Checkout schema auto-prepare skipped:', error);
  }
}

async function getTableColumns(sql: any, tableName: string) {
  const { rows } = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ${tableName}
  `;

  return new Set(rows.map((row: any) => row.column_name));
}

function buildInsertQuery(tableName: string, columns: string[]) {
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`;
}

export async function createStorefrontOrderAction(orderData: any, items: any[]) {
  try {
    const { sql } = await import('@vercel/postgres');

    if (!orderData?.store_id || !orderData?.customer_name || !orderData?.customer_email) {
      return { success: false, error: 'Faltam dados do cliente ou da loja.' };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'O carrinho está vazio.' };
    }

    await tryPrepareCheckoutSchema(sql);

    const orderColumnsAvailable = await getTableColumns(sql, 'orders');
    const orderColumns = Object.keys(ORDER_COLUMN_VALUES).filter((column) => orderColumnsAvailable.has(column));

    const requiredOrderColumns = ['store_id', 'customer_name', 'customer_email', 'total', 'subtotal'];
    const missingRequired = requiredOrderColumns.filter((column) => !orderColumnsAvailable.has(column));

    if (missingRequired.length > 0) {
      return {
        success: false,
        error: `A tabela de encomendas não está pronta. Faltam colunas: ${missingRequired.join(', ')}.`
      };
    }

    const orderValues = orderColumns.map((column) => ORDER_COLUMN_VALUES[column](orderData));
    const { rows: orderRows } = await sql.query(buildInsertQuery('orders', orderColumns), orderValues);
    const orderId = orderRows?.[0]?.id;

    if (!orderId) {
      return { success: false, error: 'Não foi possível criar a encomenda.' };
    }

    const itemColumnsAvailable = await getTableColumns(sql, 'order_items');
    const itemColumns = Object.keys(ORDER_ITEM_COLUMN_VALUES).filter((column) => itemColumnsAvailable.has(column));

    if (!itemColumnsAvailable.has('order_id')) {
      return { success: false, error: 'A tabela dos itens da encomenda não está configurada.' };
    }

    for (const item of items) {
      const itemValues = itemColumns.map((column) => ORDER_ITEM_COLUMN_VALUES[column](item, orderId));
      await sql.query(buildInsertQuery('order_items', itemColumns), itemValues);
    }

    if (orderData.coupon_id && orderColumnsAvailable.has('coupon_id')) {
      try {
        await sql`UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE id = ${orderData.coupon_id}`;
      } catch (error) {
        console.warn('Coupon counter update skipped:', error);
      }
    }

    return { success: true, id: orderId };
  } catch (error) {
    console.error('Error creating storefront order:', error);
    return {
      success: false,
      error: 'Não foi possível guardar a encomenda. Verifica a ligação à base de dados e tenta novamente.'
    };
  }
}
