'use server';

import { cookies } from 'next/headers';

export async function setSelectedStoreCookie(storeId: string) {
  const cookieStore = await cookies();
  cookieStore.set('selectedStoreId', storeId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
}

export async function getSelectedStoreId() {
  const cookieStore = await cookies();
  return cookieStore.get('selectedStoreId')?.value || null;
}
