'use server';

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
