import { sql } from '@vercel/postgres';

export async function getProfile(userId: string) {
  try {
    const { rows } = await sql`SELECT * FROM profiles WHERE id = ${userId} LIMIT 1`;
    return rows[0];
  } catch (error) {
    console.error('Database Error [getProfile]:', error);
    return null;
  }
}

export async function createProfile(userId: string, email: string, name: string) {
  try {
    const { rows } = await sql`
      INSERT INTO profiles (id, email, name, role, subscription_tier, subscription_status)
      VALUES (${userId}, ${email}, ${name}, 'CLIENT', 'STARTER', 'active')
      ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createProfile]:', error);
    throw error;
  }
}

export async function getStores(userId: string) {
  try {
    const { rows } = await sql`SELECT * FROM stores WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database Error [getStores]:', error);
    return [];
  }
}

export async function createStore(store: {
  user_id: string;
  name: string;
  domain: string;
  description: string;
  theme: string;
  primary_color: string;
  base_currency: string;
}) {
  try {
    const { rows } = await sql`
      INSERT INTO stores (user_id, name, domain, description, theme, primary_color, base_currency)
      VALUES (${store.user_id}, ${store.name}, ${store.domain}, ${store.description}, ${store.theme}, ${store.primary_color}, ${store.base_currency})
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createStore]:', error);
    throw error;
  }
}

export async function deleteStore(id: string, userId: string) {
  try {
    await sql`DELETE FROM stores WHERE id = ${id} AND user_id = ${userId}`;
    return true;
  } catch (error) {
    console.error('Database Error [deleteStore]:', error);
    throw error;
  }
}

export async function getStoreByDomain(domain: string) {
  try {
    const { rows } = await sql`SELECT * FROM stores WHERE domain = ${domain} LIMIT 1`;
    return rows[0];
  } catch (error) {
    console.error('Database Error [getStoreByDomain]:', error);
    return null;
  }
}

export async function getProducts(storeId: string) {
  try {
    const { rows } = await sql`SELECT * FROM products WHERE store_id = ${storeId} ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database Error [getProducts]:', error);
    return [];
  }
}

export async function createProduct(product: {
  store_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
}) {
  try {
    const { rows } = await sql`
      INSERT INTO products (store_id, name, description, price, stock, image_url, category)
      VALUES (${product.store_id}, ${product.name}, ${product.description}, ${product.price}, ${product.stock}, ${product.image_url}, ${product.category})
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createProduct]:', error);
    throw error;
  }
}

export async function updateProduct(id: string, product: Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
}>) {
  try {
    const { rows } = await sql`
      UPDATE products 
      SET 
        name = COALESCE(${product.name}, name),
        description = COALESCE(${product.description}, description),
        price = COALESCE(${product.price}, price),
        stock = COALESCE(${product.stock}, stock),
        image_url = COALESCE(${product.image_url}, image_url),
        category = COALESCE(${product.category}, category)
      WHERE id = ${id}
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [updateProduct]:', error);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    await sql`DELETE FROM products WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Database Error [deleteProduct]:', error);
    throw error;
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    const { rows } = await sql`
      UPDATE orders 
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [updateOrderStatus]:', error);
    throw error;
  }
}

export async function getOrders(storeId: string, startDate?: string, endDate?: string) {
  try {
    if (startDate && endDate) {
      const { rows } = await sql`
        SELECT o.*, 
        (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as items
        FROM orders o 
        WHERE o.store_id = ${storeId} 
        AND o.created_at >= ${startDate} 
        AND o.created_at <= ${endDate}
        ORDER BY o.created_at DESC
      `;
      return rows;
    }
    const { rows } = await sql`
      SELECT o.*, 
      (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o 
      WHERE o.store_id = ${storeId} 
      ORDER BY o.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Database Error [getOrders]:', error);
    return [];
  }
}
