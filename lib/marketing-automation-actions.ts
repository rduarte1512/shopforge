'use server';

import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

const DEFAULT_AUTOMATIONS = [
  { type: 'abandoned_cart_1h', name: 'Carrinho abandonado 1h depois', trigger_event: 'abandoned_cart', delay_minutes: 60, audience: 'abandoned_cart', subject: 'Ainda queres terminar a tua compra?', body: 'Olá {{name}}, guardámos o teu carrinho. Volta à loja e termina a encomenda antes que o stock acabe.', coupon_code: '' },
  { type: 'post_purchase', name: 'Email pós-compra', trigger_event: 'order_paid', delay_minutes: 30, audience: 'buyers', subject: 'Obrigado pela tua compra!', body: 'A tua encomenda foi recebida. Vamos tratar de tudo e avisamos quando sair para entrega.', coupon_code: '' },
  { type: 'vip_coupon', name: 'Cupão para cliente VIP', trigger_event: 'vip_customer', delay_minutes: 0, audience: 'vip', subject: 'Tens um presente VIP', body: 'Como és um dos melhores clientes, aqui está um cupão especial para a próxima compra.', coupon_code: 'VIP10' },
  { type: 'inactive_customers', name: 'Campanha para clientes inativos', trigger_event: 'inactive_customer', delay_minutes: 43200, audience: 'inactive', subject: 'Temos novidades para ti', body: 'Já passou algum tempo desde a tua última visita. Descobre as novidades e aproveita uma oferta especial.', coupon_code: 'VOLTA10' },
  { type: 'pending_order_recovery', name: 'Recuperação de encomendas pendentes', trigger_event: 'order_pending', delay_minutes: 1440, audience: 'pending_orders', subject: 'A tua encomenda ainda está pendente', body: 'Reparámos que a tua encomenda ainda não foi concluída. Precisas de ajuda para terminar o pagamento?', coupon_code: '' },
];

async function ownedStores(userId: string) {
  const { rows } = await sql`SELECT * FROM stores WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows;
}

export async function getAutomationDashboardAction(storeId?: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const stores = await ownedStores(userId);
  const store = storeId ? stores.find((s: any) => String(s.id) === String(storeId)) || stores[0] : stores[0];
  if (!store) return { stores: [], selectedStoreId: null, automations: [], summary: null };

  try {
    const [{ rows: automations }, { rows: pendingRows }, { rows: cartRows }, { rows: customerRows }] = await Promise.all([
      sql`SELECT * FROM marketing_automations WHERE store_id = ${store.id} ORDER BY created_at DESC`,
      sql`SELECT COUNT(*)::int as count, COALESCE(SUM(total), 0)::numeric as value FROM orders WHERE store_id = ${store.id} AND status = 'pending'`,
      sql`SELECT COUNT(*)::int as count FROM abandoned_carts WHERE store_id = ${store.id}`,
      sql`SELECT COUNT(*)::int as count FROM store_customers WHERE store_id = ${store.id}`,
    ]);
    return { stores, selectedStoreId: store.id, automations, summary: { active: automations.filter((a: any) => a.active).length, pendingOrders: Number(pendingRows[0]?.count || 0), pendingValue: Number(pendingRows[0]?.value || 0), abandonedCarts: Number(cartRows[0]?.count || 0), customers: Number(customerRows[0]?.count || 0) } };
  } catch (error) {
    console.error('Automation dashboard error:', error);
    return { stores, selectedStoreId: store.id, automations: [], summary: null, needsSetup: true };
  }
}

export async function seedDefaultAutomationsAction(storeId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const stores = await ownedStores(userId);
  const store = stores.find((s: any) => String(s.id) === String(storeId));
  if (!store) throw new Error('Loja inválida.');

  for (const automation of DEFAULT_AUTOMATIONS) {
    await sql`
      INSERT INTO marketing_automations (store_id, type, name, trigger_event, delay_minutes, audience, subject, body, coupon_code, active)
      SELECT ${store.id}, ${automation.type}, ${automation.name}, ${automation.trigger_event}, ${automation.delay_minutes}, ${automation.audience}, ${automation.subject}, ${automation.body}, ${automation.coupon_code}, true
      WHERE NOT EXISTS (SELECT 1 FROM marketing_automations WHERE store_id = ${store.id} AND type = ${automation.type})
    `;
  }

  await sql`
    INSERT INTO activity_logs (store_id, actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (${store.id}, ${userId}, 'Criou automações padrão', 'marketing_automation', ${store.id}, ${JSON.stringify({ count: DEFAULT_AUTOMATIONS.length })})
  `;

  revalidatePath('/dashboard/automations');
  return true;
}

export async function updateAutomationAction(id: string, data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const { rows } = await sql`
    UPDATE marketing_automations a
    SET name = COALESCE(${data.name}, a.name), subject = COALESCE(${data.subject}, a.subject), body = COALESCE(${data.body}, a.body), delay_minutes = COALESCE(${data.delay_minutes}, a.delay_minutes), coupon_code = COALESCE(${data.coupon_code}, a.coupon_code), active = COALESCE(${data.active}, a.active), updated_at = now()
    WHERE a.id = ${id} AND EXISTS (SELECT 1 FROM stores s WHERE s.id = a.store_id AND s.user_id = ${userId})
    RETURNING *
  `;
  revalidatePath('/dashboard/automations');
  return rows[0];
}

export async function toggleAutomationAction(id: string, active: boolean) {
  return updateAutomationAction(id, { active });
}
