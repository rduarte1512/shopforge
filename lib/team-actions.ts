'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

const businessPlans = ['BUSINESS', 'ENTERPRISE'];

function normalizeRole(role: string) {
  return ['admin', 'manager', 'support'].includes(role) ? role : 'support';
}

function defaultPermissions(role: string) {
  if (role === 'admin') return { stores: true, products: true, orders: true, customers: true, finance: true, marketing: true, team: true, support: true };
  if (role === 'manager') return { stores: false, products: true, orders: true, customers: true, finance: true, marketing: true, team: false, support: true };
  return { stores: false, products: false, orders: true, customers: true, finance: false, marketing: false, team: false, support: true };
}

async function getOwnedStores(userId: string) {
  const { rows } = await sql`SELECT * FROM stores WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows;
}

async function getProfile(userId: string) {
  const { rows } = await sql`SELECT * FROM profiles WHERE id = ${userId} LIMIT 1`;
  return rows[0] || null;
}

async function logAction(storeId: string, actorUserId: string, actorEmail: string, action: string, entityType: string, entityId: string, metadata: any = {}) {
  await sql`
    INSERT INTO activity_logs (store_id, actor_user_id, actor_email, action, entity_type, entity_id, metadata)
    VALUES (${storeId}, ${actorUserId}, ${actorEmail}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(metadata)})
  `;
}

export async function getTeamWorkspaceAction(storeId?: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [stores, profile] = await Promise.all([getOwnedStores(userId), getProfile(userId)]);
  const selectedStore = storeId ? stores.find((s: any) => String(s.id) === String(storeId)) || stores[0] : stores[0];
  const unlocked = businessPlans.includes(String(profile?.subscription_tier || 'STARTER'));

  if (!selectedStore) return { stores: [], selectedStoreId: null, unlocked, members: [], invites: [], logs: [] };

  try {
    const [{ rows: members }, { rows: invites }, { rows: logs }] = await Promise.all([
      sql`SELECT * FROM team_members WHERE owner_user_id = ${userId} AND store_id = ${selectedStore.id} ORDER BY created_at DESC`,
      sql`SELECT * FROM team_invites WHERE owner_user_id = ${userId} AND store_id = ${selectedStore.id} ORDER BY created_at DESC`,
      sql`SELECT * FROM activity_logs WHERE store_id = ${selectedStore.id} ORDER BY created_at DESC LIMIT 30`,
    ]);
    return { stores, selectedStoreId: selectedStore.id, unlocked, members, invites, logs };
  } catch (error) {
    console.error('Team workspace error:', error);
    return { stores, selectedStoreId: selectedStore.id, unlocked, members: [], invites: [], logs: [], needsSetup: true };
  }
}

export async function inviteTeamMemberAction(data: any) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) throw new Error('Unauthorized');

  const profile = await getProfile(userId);
  if (!businessPlans.includes(String(profile?.subscription_tier || 'STARTER'))) throw new Error('A equipa está disponível apenas nos planos Business e Enterprise.');

  const stores = await getOwnedStores(userId);
  const store = stores.find((s: any) => String(s.id) === String(data.storeId));
  if (!store) throw new Error('Loja inválida.');

  const role = normalizeRole(String(data.role || 'support'));
  const permissions = data.permissions || defaultPermissions(role);
  const email = String(data.email || '').trim().toLowerCase();
  const name = String(data.name || '').trim();
  if (!email) throw new Error('Email obrigatório.');

  const { rows: memberRows } = await sql`
    INSERT INTO team_members (store_id, owner_user_id, member_email, name, role, permissions, status, invited_by)
    VALUES (${store.id}, ${userId}, ${email}, ${name || email}, ${role}, ${JSON.stringify(permissions)}, 'invited', ${userId})
    RETURNING *
  `;

  const { rows: inviteRows } = await sql`
    INSERT INTO team_invites (store_id, owner_user_id, email, role, permissions)
    VALUES (${store.id}, ${userId}, ${email}, ${role}, ${JSON.stringify(permissions)})
    RETURNING *
  `;

  await logAction(store.id, userId, user?.primaryEmailAddress?.emailAddress || '', 'Convidou colaborador', 'team_member', memberRows[0].id, { email, role });
  revalidatePath('/dashboard/team');
  return { member: memberRows[0], invite: inviteRows[0] };
}

export async function updateTeamMemberAction(memberId: string, data: any) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) throw new Error('Unauthorized');

  const role = normalizeRole(String(data.role || 'support'));
  const permissions = data.permissions || defaultPermissions(role);

  const { rows } = await sql`
    UPDATE team_members
    SET role = ${role}, permissions = ${JSON.stringify(permissions)}, status = COALESCE(${data.status}, status), updated_at = now()
    WHERE id = ${memberId} AND owner_user_id = ${userId}
    RETURNING *
  `;

  if (!rows[0]) throw new Error('Colaborador não encontrado.');
  await logAction(rows[0].store_id, userId, user?.primaryEmailAddress?.emailAddress || '', 'Atualizou permissões', 'team_member', memberId, { role });
  revalidatePath('/dashboard/team');
  return rows[0];
}

export async function removeTeamMemberAction(memberId: string) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) throw new Error('Unauthorized');

  const { rows } = await sql`DELETE FROM team_members WHERE id = ${memberId} AND owner_user_id = ${userId} RETURNING *`;
  if (rows[0]) await logAction(rows[0].store_id, userId, user?.primaryEmailAddress?.emailAddress || '', 'Removeu colaborador', 'team_member', memberId, { email: rows[0].member_email });
  revalidatePath('/dashboard/team');
  return true;
}
