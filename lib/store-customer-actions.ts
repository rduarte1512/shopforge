'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const candidate = scryptSync(password, salt, 64);

  if (hashBuffer.length !== candidate.length) return false;
  return timingSafeEqual(hashBuffer, candidate);
}

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

async function ensureStoreCustomersTable(sql: any) {
  const exists = await tableExists(sql, 'store_customers');
  if (!exists) return false;

  return true;
}

function publicCustomer(row: any) {
  if (!row) return null;

  return {
    id: row.id,
    store_id: row.store_id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
}

function makeRewardCode(email: string) {
  const prefix = normalizeEmail(email).split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase() || 'CLIENTE';
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${suffix}`;
}

export async function registerStoreCustomerAction(data: any) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);

    if (!ready) {
      return { success: false, needsSetup: true, error: 'Falta criar a tabela de contas da loja.' };
    }

    const storeId = String(data?.store_id || '');
    const name = String(data?.name || '').trim();
    const email = normalizeEmail(data?.email);
    const password = String(data?.password || '');

    if (!storeId || !name || !email || password.length < 6) {
      return { success: false, error: 'Preenche nome, email e uma password com pelo menos 6 caracteres.' };
    }

    const passwordHash = hashPassword(password);

    const { rows } = await sql`
      INSERT INTO store_customers (store_id, name, email, password_hash)
      VALUES (${storeId}, ${name}, ${email}, ${passwordHash})
      ON CONFLICT (store_id, email) DO NOTHING
      RETURNING id, store_id, name, email, created_at
    `;

    if (!rows[0]) {
      return { success: false, error: 'Já existe uma conta com este email nesta loja.' };
    }

    return { success: true, customer: publicCustomer(rows[0]) };
  } catch (error) {
    console.error('Error registering store customer:', error);
    return { success: false, error: 'Não foi possível criar a conta.' };
  }
}

export async function loginStoreCustomerAction(data: any) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);

    if (!ready) {
      return { success: false, needsSetup: true, error: 'Falta criar a tabela de contas da loja.' };
    }

    const storeId = String(data?.store_id || '');
    const email = normalizeEmail(data?.email);
    const password = String(data?.password || '');

    if (!storeId || !email || !password) {
      return { success: false, error: 'Preenche email e password.' };
    }

    const { rows } = await sql`
      SELECT id, store_id, name, email, password_hash, created_at
      FROM store_customers
      WHERE store_id = ${storeId}
      AND email = ${email}
      LIMIT 1
    `;

    const customer = rows[0];

    if (!customer || !verifyPassword(password, customer.password_hash)) {
      return { success: false, error: 'Email ou password incorretos.' };
    }

    return { success: true, customer: publicCustomer(customer) };
  } catch (error) {
    console.error('Error logging store customer:', error);
    return { success: false, error: 'Não foi possível iniciar sessão.' };
  }
}

export async function getStoreCustomerAction(storeId: string, customerId: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);
    if (!ready || !storeId || !customerId) return null;

    const { rows } = await sql`
      SELECT id, store_id, name, email, created_at
      FROM store_customers
      WHERE store_id = ${storeId}
      AND id = ${customerId}
      LIMIT 1
    `;

    return publicCustomer(rows[0]);
  } catch (error) {
    console.error('Error getting store customer:', error);
    return null;
  }
}

export async function getStoreCustomersAction(storeId: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);

    if (!ready) {
      return { success: false, needsSetup: true, customers: [] };
    }

    if (!storeId) {
      return { success: true, customers: [] };
    }

    const rewardsReady = await tableExists(sql, 'store_customer_rewards');

    const { rows } = await sql`
      SELECT
        sc.id,
        sc.store_id,
        sc.name,
        sc.email,
        sc.created_at,
        sc.updated_at,
        COUNT(o.id)::int AS total_orders,
        COALESCE(SUM(o.total), 0)::float AS total_spent,
        MAX(o.created_at) AS last_order_at
      FROM store_customers sc
      LEFT JOIN orders o
        ON o.store_id = sc.store_id
        AND LOWER(o.customer_email) = LOWER(sc.email)
      WHERE sc.store_id = ${storeId}
      GROUP BY sc.id
      ORDER BY sc.created_at DESC
    `;

    let rewardsByCustomer: Record<string, any[]> = {};

    if (rewardsReady) {
      const rewardRows = await sql`
        SELECT *
        FROM store_customer_rewards
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
      `;

      rewardsByCustomer = rewardRows.rows.reduce((acc: Record<string, any[]>, reward: any) => {
        const key = reward.customer_id;
        acc[key] = acc[key] || [];
        acc[key].push(reward);
        return acc;
      }, {});
    }

    return {
      success: true,
      rewardsNeedsSetup: !rewardsReady,
      customers: rows.map((customer: any) => ({
        ...customer,
        rewards: rewardsByCustomer[customer.id] || [],
      })),
    };
  } catch (error) {
    console.error('Error listing store customers:', error);
    return { success: false, customers: [], error: 'Não foi possível carregar as contas.' };
  }
}

export async function updateStoreCustomerDetailsAction(storeId: string, customerId: string, data: any) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);

    if (!ready) return { success: false, needsSetup: true, error: 'Falta criar a tabela de contas da loja.' };
    if (!storeId || !customerId) return { success: false, error: 'Cliente inválido.' };

    const name = String(data?.name || '').trim();
    const email = normalizeEmail(data?.email);

    if (!name || !email) return { success: false, error: 'Nome e email são obrigatórios.' };

    const { rows } = await sql`
      UPDATE store_customers
      SET name = ${name}, email = ${email}, updated_at = NOW()
      WHERE id = ${customerId}
      AND store_id = ${storeId}
      RETURNING id, store_id, name, email, created_at, updated_at
    `;

    revalidatePath('/dashboard/store-accounts');
    return { success: true, customer: rows[0] };
  } catch (error: any) {
    console.error('Error updating store customer:', error);
    if (String(error?.message || '').includes('duplicate')) {
      return { success: false, error: 'Já existe uma conta com este email nesta loja.' };
    }
    return { success: false, error: 'Não foi possível editar a conta.' };
  }
}

export async function deleteStoreCustomerAction(storeId: string, customerId: string) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);

    if (!ready) return { success: false, needsSetup: true, error: 'Falta criar a tabela de contas da loja.' };
    if (!storeId || !customerId) return { success: false, error: 'Cliente inválido.' };

    await sql`
      DELETE FROM store_customers
      WHERE id = ${customerId}
      AND store_id = ${storeId}
    `;

    revalidatePath('/dashboard/store-accounts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting store customer:', error);
    return { success: false, error: 'Não foi possível eliminar a conta.' };
  }
}

export async function createStoreCustomerRewardAction(storeId: string, customerId: string, data: any) {
  try {
    const { sql } = await import('@vercel/postgres');
    const ready = await ensureStoreCustomersTable(sql);
    const rewardsReady = await tableExists(sql, 'store_customer_rewards');

    if (!ready) return { success: false, needsSetup: true, error: 'Falta criar a tabela de contas da loja.' };
    if (!storeId || !customerId) return { success: false, error: 'Cliente inválido.' };

    const customerResult = await sql`
      SELECT id, store_id, name, email
      FROM store_customers
      WHERE id = ${customerId}
      AND store_id = ${storeId}
      LIMIT 1
    `;

    const customer = customerResult.rows[0];
    if (!customer) return { success: false, error: 'Cliente não encontrado.' };

    const rewardType = String(data?.reward_type || 'discount');
    const title = String(data?.title || (rewardType === 'discount' ? 'Desconto especial' : 'Prémio especial')).trim();
    const description = String(data?.description || '').trim();
    const discountType = String(data?.discount_type || 'percentage');
    const discountValue = Number(data?.discount_value || 10);
    const code = String(data?.code || makeRewardCode(customer.email)).toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 32);

    let couponId = null;

    if (rewardType === 'discount') {
      const couponRows = await sql`
        INSERT INTO coupons (store_id, code, discount_type, discount_value, min_purchase, max_uses, active)
        VALUES (${storeId}, ${code}, ${discountType}, ${discountValue}, ${Number(data?.min_purchase || 0)}, ${Number(data?.max_uses || 1)}, true)
        ON CONFLICT (store_id, code) DO UPDATE SET
          discount_type = EXCLUDED.discount_type,
          discount_value = EXCLUDED.discount_value,
          min_purchase = EXCLUDED.min_purchase,
          max_uses = EXCLUDED.max_uses,
          active = true
        RETURNING id
      `;
      couponId = couponRows.rows[0]?.id || null;
    }

    let reward = {
      id: null,
      store_id: storeId,
      customer_id: customerId,
      reward_type: rewardType,
      title,
      description,
      coupon_id: couponId,
      coupon_code: rewardType === 'discount' ? code : null,
      created_at: new Date().toISOString(),
    } as any;

    if (rewardsReady) {
      const rewardRows = await sql`
        INSERT INTO store_customer_rewards (store_id, customer_id, reward_type, title, description, coupon_id, coupon_code)
        VALUES (${storeId}, ${customerId}, ${rewardType}, ${title}, ${description || null}, ${couponId}, ${rewardType === 'discount' ? code : null})
        RETURNING *
      `;
      reward = rewardRows.rows[0];
    }

    revalidatePath('/dashboard/store-accounts');
    revalidatePath('/dashboard/coupons');
    return { success: true, reward, coupon_code: rewardType === 'discount' ? code : null, rewardsNeedsSetup: !rewardsReady };
  } catch (error: any) {
    console.error('Error creating store customer reward:', error);
    return { success: false, error: 'Não foi possível criar o prémio/desconto.' };
  }
}
