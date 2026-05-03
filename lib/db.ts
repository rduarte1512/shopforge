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

export async function getProductById(id: string) {
  try {
    const { rows } = await sql`SELECT * FROM products WHERE id = ${id}`;
    return rows[0] || null;
  } catch (error) {
    console.error('Database Error [getProductById]:', error);
    return null;
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

// AFFILIATE FUNCTIONS
export async function getAffiliateLinks(storeId: string) {
  try {
    const { rows } = await sql`SELECT * FROM affiliate_links WHERE store_id = ${storeId} ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database Error [getAffiliateLinks]:', error);
    return [];
  }
}

export async function createAffiliateLink(link: {
  store_id: string;
  name: string;
  percentage: number;
  code: string;
  active: boolean;
}) {
  try {
    const { rows } = await sql`
      INSERT INTO affiliate_links (store_id, name, percentage, code, active)
      VALUES (${link.store_id}, ${link.name}, ${link.percentage}, ${link.code}, ${link.active})
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createAffiliateLink]:', error);
    throw error;
  }
}

export async function deleteAffiliateLink(id: string) {
  try {
    await sql`DELETE FROM affiliate_links WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Database Error [deleteAffiliateLink]:', error);
    throw error;
  }
}

export async function toggleAffiliateLinkActive(id: string, active: boolean) {
  try {
    const { rows } = await sql`
      UPDATE affiliate_links SET active = ${active} WHERE id = ${id} RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [toggleAffiliateLinkActive]:', error);
    throw error;
  }
}

export async function getAffiliateCommissions(linkId: string) {
  try {
    const { rows } = await sql`
      SELECT c.*, row_to_json(o) as orders
      FROM affiliate_commissions c
      JOIN orders o ON c.order_id = o.id
      WHERE c.affiliate_link_id = ${linkId}
      ORDER BY c.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Database Error [getAffiliateCommissions]:', error);
    return [];
  }
}

// COUPON FUNCTIONS
export async function getCoupons(storeId: string) {
  try {
    const { rows } = await sql`SELECT * FROM coupons WHERE store_id = ${storeId} ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database Error [getCoupons]:', error);
    return [];
  }
}

export async function createCoupon(coupon: any) {
  try {
    const { rows } = await sql`
      INSERT INTO coupons (store_id, code, discount_type, discount_value, min_purchase, max_uses, expiry_date, active)
      VALUES (${coupon.store_id}, ${coupon.code}, ${coupon.discount_type}, ${coupon.discount_value}, ${coupon.min_purchase}, ${coupon.max_uses}, ${coupon.expiry_date}, ${coupon.active})
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createCoupon]:', error);
    throw error;
  }
}

export async function updateCoupon(id: string, coupon: any) {
  try {
    const { rows } = await sql`
      UPDATE coupons 
      SET 
        code = ${coupon.code},
        discount_type = ${coupon.discount_type},
        discount_value = ${coupon.discount_value},
        min_purchase = ${coupon.min_purchase},
        max_uses = ${coupon.max_uses},
        expiry_date = ${coupon.expiry_date},
        active = ${coupon.active}
      WHERE id = ${id}
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [updateCoupon]:', error);
    throw error;
  }
}

export async function deleteCoupon(id: string) {
  try {
    await sql`DELETE FROM coupons WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Database Error [deleteCoupon]:', error);
    throw error;
  }
}

// PROMOTION FUNCTIONS
export async function getPromotions(storeId: string) {
  try {
    const { rows } = await sql`SELECT * FROM promotions WHERE store_id = ${storeId} ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database Error [getPromotions]:', error);
    return [];
  }
}

export async function createPromotion(promo: any) {
  try {
    const { rows } = await sql`
      INSERT INTO promotions (store_id, title, subtitle, description, image_url, link_type, link_value, position, active)
      VALUES (${promo.store_id}, ${promo.title}, ${promo.subtitle}, ${promo.description}, ${promo.image_url}, ${promo.link_type}, ${promo.link_value}, ${promo.position}, ${promo.active})
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createPromotion]:', error);
    throw error;
  }
}

export async function updatePromotion(id: string, promo: any) {
  try {
    const { rows } = await sql`
      UPDATE promotions 
      SET 
        title = ${promo.title},
        subtitle = ${promo.subtitle},
        description = ${promo.description},
        image_url = ${promo.image_url},
        link_type = ${promo.link_type},
        link_value = ${promo.link_value},
        position = ${promo.position},
        active = ${promo.active}
      WHERE id = ${id}
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [updatePromotion]:', error);
    throw error;
  }
}

export async function deletePromotion(id: string) {
  try {
    await sql`DELETE FROM promotions WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Database Error [deletePromotion]:', error);
    throw error;
  }
}

// SHIPPING FUNCTIONS
export async function getShippingMethods(storeId: string) {
  try {
    const { rows } = await sql`SELECT * FROM shipping_methods WHERE store_id = ${storeId} ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database Error [getShippingMethods]:', error);
    return [];
  }
}

export async function createShippingMethod(method: any) {
  try {
    const { rows } = await sql`
      INSERT INTO shipping_methods (store_id, name, description, cost, min_order_for_free, delivery_time, active)
      VALUES (${method.store_id}, ${method.name}, ${method.description}, ${method.cost}, ${method.min_order_for_free}, ${method.delivery_time}, ${method.active})
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createShippingMethod]:', error);
    throw error;
  }
}

export async function updateShippingMethod(id: string, method: any) {
  try {
    const { rows } = await sql`
      UPDATE shipping_methods 
      SET 
        name = ${method.name},
        description = ${method.description},
        cost = ${method.cost},
        min_order_for_free = ${method.min_order_for_free},
        delivery_time = ${method.delivery_time},
        active = ${method.active}
      WHERE id = ${id}
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [updateShippingMethod]:', error);
    throw error;
  }
}

export async function deleteShippingMethod(id: string) {
  try {
    await sql`DELETE FROM shipping_methods WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Database Error [deleteShippingMethod]:', error);
    throw error;
  }
}

// STORE CUSTOMIZATION
export async function updateStoreCustomization(id: string, customization: any) {
  try {
    const { rows } = await sql`
      UPDATE stores 
      SET customization = ${JSON.stringify(customization)}
      WHERE id = ${id}
      RETURNING *;
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [updateStoreCustomization]:', error);
    throw error;
  }
}

export async function trackAffiliateClick(linkId: string, sessionId: string, details: any) {
  try {
    await sql`
      INSERT INTO affiliate_clicks (affiliate_link_id, session_id, user_agent, referrer, country)
      VALUES (${linkId}, ${sessionId}, ${details.userAgent}, ${details.referrer}, ${details.country})
    `;
    
    await sql`
      UPDATE affiliate_links 
      SET click_count = click_count + 1 
      WHERE id = ${linkId}
    `;
    return true;
  } catch (error) {
    console.error('Database Error [trackAffiliateClick]:', error);
    return false;
  }
}

export async function createAffiliateCommission(linkId: string, orderId: string, amount: number, percentage: number) {
  try {
    const { rows } = await sql`
      INSERT INTO affiliate_commissions (affiliate_link_id, order_id, amount, percentage_used)
      VALUES (${linkId}, ${orderId}, ${amount}, ${percentage})
      RETURNING *;
    `;
    
    await sql`
      UPDATE affiliate_links 
      SET 
        conversion_count = conversion_count + 1,
        total_commission = total_commission + ${amount}
      WHERE id = ${linkId}
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error [createAffiliateCommission]:', error);
    throw error;
  }
}
