'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export const REMEMBERED_SHOPFORGE_ACCOUNT_KEY = 'shopforge:last-account';

export type RememberedShopForgeAccount = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  updatedAt: string;
};

export function RememberClerkAccount() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
    const name = user.fullName || user.firstName || user.username || email || 'Conta ShopForge';

    if (!email) return;

    const rememberedAccount: RememberedShopForgeAccount = {
      id: user.id,
      name,
      email,
      imageUrl: user.imageUrl || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(REMEMBERED_SHOPFORGE_ACCOUNT_KEY, JSON.stringify(rememberedAccount));
    } catch {
      // Ignore storage errors.
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
