'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  createProfile, 
  getStores, 
  createStore,
  deleteStore,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProducts,
  getOrders,
  updateOrderStatus
} from './db';
import { revalidatePath } from 'next/cache';

// PROFILE ACTIONS
export async function syncUserAction() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;
  
  try {
    const profile = await createProfile(user.id, email, name);
    return profile;
  } catch (error) {
    console.error('Error syncing user:', error);
    return null;
  }
}

// STORE ACTIONS
export async function getMyStoresAction() {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    return await getStores(userId);
  } catch (error) {
    console.error('Error getting stores:', error);
    return [];
  }
}

export async function createStoreAction(formData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const store = await createStore({
      ...formData,
      user_id: userId
    });
    revalidatePath('/dashboard/stores');
    return store;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

export async function deleteStoreAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    await deleteStore(id, userId);
    revalidatePath('/dashboard/stores');
    return true;
  } catch (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
}

export async function getStoreOrdersAction(storeId: string, startDate?: string, endDate?: string) {
  try {
    return await getOrders(storeId, startDate, endDate);
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const order = await updateOrderStatus(id, status);
    revalidatePath('/dashboard/orders');
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// PRODUCT ACTIONS
export async function getStoreProductsAction(storeId: string) {
  try {
    return await getProducts(storeId);
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function addProductAction(formData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const product = await createProduct(formData);
    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export async function updateProductAction(id: string, formData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const product = await updateProduct(id, formData);
    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProductAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    await deleteProduct(id);
    revalidatePath('/dashboard/products');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// AFFILIATE ACTIONS
export async function getAffiliateLinksAction(storeId: string) {
  try {
    const { getAffiliateLinks } = await import('./db');
    return await getAffiliateLinks(storeId);
  } catch (error) {
    console.error('Error getting affiliate links:', error);
    return [];
  }
}

export async function createAffiliateLinkAction(data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { createAffiliateLink } = await import('./db');
    const result = await createAffiliateLink(data);
    revalidatePath('/dashboard/affiliates');
    return result;
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    throw error;
  }
}

export async function deleteAffiliateLinkAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { deleteAffiliateLink } = await import('./db');
    await deleteAffiliateLink(id);
    revalidatePath('/dashboard/affiliates');
    return true;
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    throw error;
  }
}

export async function toggleAffiliateLinkAction(id: string, active: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { toggleAffiliateLinkActive } = await import('./db');
    const result = await toggleAffiliateLinkActive(id, active);
    revalidatePath('/dashboard/affiliates');
    return result;
  } catch (error) {
    console.error('Error toggling affiliate link:', error);
    throw error;
  }
}

export async function getAffiliateCommissionsAction(linkId: string) {
  try {
    const { getAffiliateCommissions } = await import('./db');
    return await getAffiliateCommissions(linkId);
  } catch (error) {
    console.error('Error getting affiliate commissions:', error);
    return [];
  }
}

// COUPON ACTIONS
export async function getCouponsAction(storeId: string) {
  try {
    const { getCoupons } = await import('./db');
    return await getCoupons(storeId);
  } catch (error) {
    console.error('Error getting coupons:', error);
    return [];
  }
}

export async function createCouponAction(data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { createCoupon } = await import('./db');
    const result = await createCoupon(data);
    revalidatePath('/dashboard/coupons');
    return result;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

export async function updateCouponAction(id: string, data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { updateCoupon } = await import('./db');
    const result = await updateCoupon(id, data);
    revalidatePath('/dashboard/coupons');
    return result;
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
}

export async function deleteCouponAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { deleteCoupon } = await import('./db');
    await deleteCoupon(id);
    revalidatePath('/dashboard/coupons');
    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
}

// PROMOTION ACTIONS
export async function getPromotionsAction(storeId: string) {
  try {
    const { getPromotions } = await import('./db');
    return await getPromotions(storeId);
  } catch (error) {
    console.error('Error getting promotions:', error);
    return [];
  }
}

export async function createPromotionAction(data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { createPromotion } = await import('./db');
    const result = await createPromotion(data);
    revalidatePath('/dashboard/promotions');
    return result;
  } catch (error) {
    console.error('Error creating promotion:', error);
    throw error;
  }
}

export async function updatePromotionAction(id: string, data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { updatePromotion } = await import('./db');
    const result = await updatePromotion(id, data);
    revalidatePath('/dashboard/promotions');
    return result;
  } catch (error) {
    console.error('Error updating promotion:', error);
    throw error;
  }
}

export async function deletePromotionAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { deletePromotion } = await import('./db');
    await deletePromotion(id);
    revalidatePath('/dashboard/promotions');
    return true;
  } catch (error) {
    console.error('Error deleting promotion:', error);
    throw error;
  }
}

// SHIPPING ACTIONS
export async function getShippingMethodsAction(storeId: string) {
  try {
    const { getShippingMethods } = await import('./db');
    return await getShippingMethods(storeId);
  } catch (error) {
    console.error('Error getting shipping methods:', error);
    return [];
  }
}

export async function createShippingMethodAction(data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { createShippingMethod } = await import('./db');
    const result = await createShippingMethod(data);
    revalidatePath('/dashboard/shipping');
    return result;
  } catch (error) {
    console.error('Error creating shipping method:', error);
    throw error;
  }
}

export async function updateShippingMethodAction(id: string, data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { updateShippingMethod } = await import('./db');
    const result = await updateShippingMethod(id, data);
    revalidatePath('/dashboard/shipping');
    return result;
  } catch (error) {
    console.error('Error updating shipping method:', error);
    throw error;
  }
}

export async function deleteShippingMethodAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { deleteShippingMethod } = await import('./db');
    await deleteShippingMethod(id);
    revalidatePath('/dashboard/shipping');
    return true;
  } catch (error) {
    console.error('Error deleting shipping method:', error);
    throw error;
  }
}

// STORE CUSTOMIZATION
export async function updateStoreCustomizationAction(id: string, customization: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { updateStoreCustomization } = await import('./db');
    const result = await updateStoreCustomization(id, customization);
    revalidatePath(`/dashboard/stores/${id}/customize`);
    return result;
  } catch (error) {
    console.error('Error updating store customization:', error);
    throw error;
  }
}

// EMAIL ACTIONS
export async function getStoreEmailSettingsAction(storeId: string) {
  try {
    const { getStoreEmailSettings } = await import('./email');
    return await getStoreEmailSettings(storeId);
  } catch (error) {
    console.error('Error getting email settings:', error);
    return null;
  }
}

export async function updateStoreEmailSettingsAction(settings: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { updateStoreEmailSettings } = await import('./email');
    const result = await updateStoreEmailSettings(settings);
    revalidatePath('/dashboard/email');
    return result;
  } catch (error) {
    console.error('Error updating email settings:', error);
    throw error;
  }
}

export async function getEmailTemplatesAction(storeId: string) {
  try {
    const { getEmailTemplates } = await import('./email');
    return await getEmailTemplates(storeId);
  } catch (error) {
    console.error('Error getting email templates:', error);
    return [];
  }
}

export async function upsertEmailTemplateAction(template: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  try {
    const { upsertEmailTemplate } = await import('./email');
    const result = await upsertEmailTemplate(template);
    revalidatePath('/dashboard/email/templates');
    return result;
  } catch (error) {
    console.error('Error upserting email template:', error);
    throw error;
  }
}

// STOREFRONT ACTIONS (Public)
export async function getStorefrontDataAction(domain: string) {
  try {
    const { getStoreByDomain, getProducts, getPromotions } = await import('./db');
    const store = await getStoreByDomain(domain);
    if (!store) return null;

    const [products, promotions] = await Promise.all([
      getProducts(store.id),
      getPromotions(store.id)
    ]);

    return {
      store,
      products: products.filter((p: any) => p.is_active !== false),
      promotions: promotions.filter((p: any) => p.active !== false)
    };
  } catch (error) {
    console.error('Error getting storefront data:', error);
    return null;
  }
}

// CHECKOUT ACTIONS
export async function createOrderAction(orderData: any, items: any[]) {
  try {
    const { sql } = await import('@vercel/postgres');
    
    // 1. Inserir a encomenda
    const { rows: orderRows } = await sql`
      INSERT INTO orders (
        store_id, customer_name, customer_email, status, total, subtotal, 
        shipping_cost, discount_amount, coupon_id, shipping_method_id, 
        currency, payment_method_id, payment_method_type, payment_instructions,
        affiliate_link_id
      ) VALUES (
        ${orderData.store_id}, ${orderData.customer_name}, ${orderData.customer_email}, 
        ${orderData.status}, ${orderData.total}, ${orderData.subtotal}, 
        ${orderData.shipping_cost}, ${orderData.discount_amount}, ${orderData.coupon_id}, 
        ${orderData.shipping_method_id}, ${orderData.currency}, ${orderData.payment_method_id}, 
        ${orderData.payment_method_type}, ${orderData.payment_instructions},
        ${orderData.affiliate_link_id}
      ) RETURNING id
    `;
    
    const orderId = orderRows[0].id;

    // 2. Inserir os itens da encomenda
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${orderId}, ${item.product_id}, ${item.quantity}, ${item.price})
      `;
    }

    // 3. Incrementar contadores se necessário
    if (orderData.coupon_id) {
      await sql`UPDATE coupons SET used_count = used_count + 1 WHERE id = ${orderData.coupon_id}`;
    }

    return { id: orderId };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function checkCouponAction(storeId: string, code: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`
      SELECT * FROM coupons 
      WHERE store_id = ${storeId} 
      AND code = ${code.toUpperCase()} 
      AND active = true 
      AND (expiry_date IS NULL OR expiry_date > NOW())
      LIMIT 1
    `;
    return rows[0];
  } catch (error) {
    console.error('Error checking coupon:', error);
    return null;
  }
}

export async function getAffiliateByCodeAction(storeId: string, code: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`
      SELECT id FROM affiliate_links 
      WHERE store_id = ${storeId} 
      AND code = ${code.toUpperCase()} 
      AND active = true 
      LIMIT 1
    `;
    return rows[0];
  } catch (error) {
    console.error('Error getting affiliate by code:', error);
    return null;
  }
}

export async function getStorefrontProductsBulkAction(productIds: string[]) {
  try {
    const { sql } = await import('@vercel/postgres');
    if (productIds.length === 0) return [];
    
    const rows: any[] = [];
    for (const id of productIds) {
      const result = await sql`SELECT * FROM products WHERE id = ${id}`;
      if (result.rows[0]) rows.push(result.rows[0]);
    }
    return rows;
  } catch (error) {
    console.error('Error getting storefront products bulk:', error);
    return [];
  }
}

export async function getStorefrontProductAction(productId: string) {
  try {
    const { getProductById } = await import('./db');
    return await getProductById(productId);
  } catch (error) {
    console.error('Error getting storefront product:', error);
    return null;
  }
}
