import { sql } from '@vercel/postgres';
import { SUBSCRIPTION_PLANS } from './plans';

export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export type SubscriptionStatus = 'active' | 'expired' | 'trialing' | 'none';
export type BillingCycle = 'monthly' | 'yearly';

export interface ServerSubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
}

export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CLIENT';
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
}

export const SERVER_SUBSCRIPTION_PLANS: ServerSubscriptionPlan[] = SUBSCRIPTION_PLANS.map(p=>({id:p.id,name:p.name,description:p.description,monthlyPrice:p.price,features:[p.tokens+' tokens ForgePilot por mês',...p.features]}));

export function isValidSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && SERVER_SUBSCRIPTION_PLANS.some((plan) => plan.id === value);
}

export function getServerPlan(planId: unknown) {
  if (!isValidSubscriptionTier(planId)) return null;
  return SERVER_SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function normalizeBillingCycle(value: unknown): BillingCycle {
  return value === 'yearly' ? 'yearly' : 'monthly';
}

export function getCheckoutAmountCents(plan: ServerSubscriptionPlan, billingCycle: BillingCycle) {
  if (plan.monthlyPrice <= 0) return 0;
  const total = billingCycle === 'yearly' ? plan.monthlyPrice * 12 * 0.8 : plan.monthlyPrice;
  return Math.round(total * 100);
}

export function getDisplayedMonthlyPrice(plan: ServerSubscriptionPlan, billingCycle: BillingCycle) {
  return billingCycle === 'yearly' ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
}

function cleanText(value: string | null | undefined, fallback = '') {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : fallback;
}

export function mapProfileRowToAuthUser(row: any): AuthUserProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    name: String(row.name ?? ''),
    role: row.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
    subscriptionTier: isValidSubscriptionTier(row.subscription_tier) ? row.subscription_tier : 'STARTER',
    subscriptionStatus: ['active', 'expired', 'trialing', 'none'].includes(row.subscription_status) ? row.subscription_status : 'none',
  };
}

export async function getProfileById(userId: string) {
  const { rows } = await sql`SELECT * FROM profiles WHERE id = ${userId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function ensureProfileFromAuth(params: { userId: string; email?: string | null; name?: string | null }) {
  const email = cleanText(params.email, `${params.userId}@shopforge.local`);
  const name = cleanText(params.name, email.split('@')[0] || 'Cliente');

  const { rows } = await sql`
    INSERT INTO profiles (id, email, name, role, subscription_tier, subscription_status)
    VALUES (${params.userId}, ${email}, ${name}, 'CLIENT', 'STARTER', 'active')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
    RETURNING *;
  `;
  return rows[0];
}

export async function activateSubscription(params: { userId: string; email?: string | null; name?: string | null; tier: SubscriptionTier }) {
  const email = cleanText(params.email, `${params.userId}@shopforge.local`);
  const name = cleanText(params.name, email.split('@')[0] || 'Cliente');

  const { rows } = await sql`
    INSERT INTO profiles (id, email, name, role, subscription_tier, subscription_status)
    VALUES (${params.userId}, ${email}, ${name}, 'CLIENT', ${params.tier}, 'active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      subscription_tier = EXCLUDED.subscription_tier,
      subscription_status = 'active'
    RETURNING *;
  `;
  return rows[0];
}

export async function setSubscriptionStatus(userId: string, status: SubscriptionStatus) {
  const { rows } = await sql`
    UPDATE profiles
    SET subscription_status = ${status}
    WHERE id = ${userId}
    RETURNING *;
  `;
  return rows[0] ?? null;
}
