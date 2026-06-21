'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@vercel/postgres';

function cleanText(value: unknown, fallback = '') {
  const cleaned = String(value ?? '').trim();
  return cleaned || fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'loja-online';
}

export async function updateStoreSettingsAction(storeId: string, data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const name = cleanText(data?.name, 'Loja sem nome');
  const domain = slugify(cleanText(data?.domain, name));
  const description = cleanText(data?.description);
  const theme = data?.theme === 'dark' ? 'dark' : 'light';
  const primaryColor = cleanText(data?.primaryColor || data?.primary_color, '#008060');
  const baseCurrency = cleanText(data?.baseCurrency || data?.base_currency, 'EUR').toUpperCase();

  const settings = {
    phone: cleanText(data?.phone),
    email: cleanText(data?.email),
    address: cleanText(data?.address),
    businessHours: cleanText(data?.businessHours),
    currency: cleanText(data?.currency, baseCurrency).toUpperCase(),
    currencySymbol: cleanText(data?.currencySymbol, '€'),
    returnPolicy: cleanText(data?.returnPolicy),
    termsAndConditions: cleanText(data?.termsAndConditions),
    privacyPolicy: cleanText(data?.privacyPolicy),
    lowStockThreshold: Number(data?.lowStockThreshold || 10),
    notifyLowStock: Boolean(data?.notifyLowStock),
    logoUrl: cleanText(data?.logoUrl),
    bannerUrl: cleanText(data?.bannerUrl),
    faviconUrl: cleanText(data?.faviconUrl),
    secondaryColor: cleanText(data?.secondaryColor, '#2D3748'),
    metaTitle: cleanText(data?.metaTitle),
    metaDescription: cleanText(data?.metaDescription),
    notifyNewOrder: Boolean(data?.notifyNewOrder),
    notifyOrderStatus: Boolean(data?.notifyOrderStatus),
    paymentMethods: Array.isArray(data?.paymentMethods) ? data.paymentMethods : [],
  };

  const { rows } = await sql`
    UPDATE stores
    SET
      name = ${name},
      domain = ${domain},
      description = ${description},
      theme = ${theme},
      primary_color = ${primaryColor},
      base_currency = ${baseCurrency},
      customization = COALESCE(customization, '{}'::jsonb) || ${JSON.stringify({ settings })}::jsonb
    WHERE id = ${storeId}
    AND user_id = ${userId}
    RETURNING *
  `;

  if (!rows[0]) {
    throw new Error('Loja não encontrada ou sem permissão.');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');

  return rows[0];
}
