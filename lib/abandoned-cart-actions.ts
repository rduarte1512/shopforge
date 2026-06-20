'use server';

import { revalidatePath } from 'next/cache';

async function tableExists(sql: any, tableName: string) {
  const { rows } = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ) as exists
  `;

  return Boolean(rows?.[0]?.exists);
}

export async function saveAbandonedCartAction(data: any) {
  try {
    const { sql } = await import('@vercel/postgres');
    const exists = await tableExists(sql, 'abandoned_carts');

    if (!exists) {
      return { success: false, needsSetup: true };
    }

    const items = Array.isArray(data?.items) ? data.items : [];

    if (!data?.store_id || !data?.session_id || items.length === 0) {
      return { success: false };
    }

    const itemCount = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);

    await sql`
      INSERT INTO abandoned_carts (
        store_id,
        session_id,
        customer_email,
        customer_name,
        items,
        item_count,
        status,
        last_activity_at,
        recovered_at
      ) VALUES (
        ${data.store_id},
        ${data.session_id},
        ${data.customer_email || null},
        ${data.customer_name || null},
        ${JSON.stringify(items)},
        ${itemCount},
        'open',
        NOW(),
        NULL
      )
      ON CONFLICT (store_id, session_id) DO UPDATE SET
        customer_email = COALESCE(EXCLUDED.customer_email, abandoned_carts.customer_email),
        customer_name = COALESCE(EXCLUDED.customer_name, abandoned_carts.customer_name),
        items = EXCLUDED.items,
        item_count = EXCLUDED.item_count,
        status = 'open',
        last_activity_at = NOW(),
        recovered_at = NULL
    `;

    return { success: true };
  } catch (error) {
    console.error('Error saving abandoned cart:', error);
    return { success: false };
  }
}

export async function recoverAbandonedCartAction(storeId: string, sessionId: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const exists = await tableExists(sql, 'abandoned_carts');

    if (!exists || !storeId || !sessionId) {
      return { success: false };
    }

    await sql`
      UPDATE abandoned_carts
      SET status = 'recovered', recovered_at = NOW(), updated_at = NOW()
      WHERE store_id = ${storeId}
      AND session_id = ${sessionId}
    `;

    revalidatePath('/dashboard/abandoned-carts');
    return { success: true };
  } catch (error) {
    console.error('Error recovering abandoned cart:', error);
    return { success: false };
  }
}

export async function deleteAbandonedCartBySessionAction(storeId: string, sessionId: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const exists = await tableExists(sql, 'abandoned_carts');

    if (!exists || !storeId || !sessionId) {
      return { success: false };
    }

    await sql`
      DELETE FROM abandoned_carts
      WHERE store_id = ${storeId}
      AND session_id = ${sessionId}
    `;

    revalidatePath('/dashboard/abandoned-carts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting abandoned cart by session:', error);
    return { success: false };
  }
}

export async function getAbandonedCartsAction(storeId: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const exists = await tableExists(sql, 'abandoned_carts');

    if (!exists) {
      return { success: false, needsSetup: true, carts: [] };
    }

    if (!storeId) {
      return { success: true, carts: [] };
    }

    const { rows } = await sql`
      SELECT *
      FROM abandoned_carts
      WHERE store_id = ${storeId}
      ORDER BY last_activity_at DESC
    `;

    return { success: true, carts: rows };
  } catch (error) {
    console.error('Error getting abandoned carts:', error);
    return { success: false, carts: [] };
  }
}

export async function deleteAbandonedCartAction(id: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    await sql`DELETE FROM abandoned_carts WHERE id = ${id}`;
    revalidatePath('/dashboard/abandoned-carts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting abandoned cart:', error);
    return { success: false, error: 'Não foi possível eliminar o carrinho.' };
  }
}
