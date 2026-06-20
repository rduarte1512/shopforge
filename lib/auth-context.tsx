'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CLIENT';
  subscriptionTier: 'STARTER' | 'GROWTH' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  subscriptionStatus: 'active' | 'expired' | 'trialing' | 'none';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isSubscriptionTier(value: unknown): value is AuthUser['subscriptionTier'] {
  return ['STARTER', 'GROWTH', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(String(value));
}

function isSubscriptionStatus(value: unknown): value is AuthUser['subscriptionStatus'] {
  return ['active', 'expired', 'trialing', 'none'].includes(String(value));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!isLoaded) return;

    if (!clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const clerkTier = clerkUser.publicMetadata?.subscriptionTier;
    const clerkStatus = clerkUser.publicMetadata?.subscriptionStatus;

    const fallbackUser: AuthUser = {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? '',
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || 'Cliente',
      role: clerkUser.publicMetadata?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
      subscriptionTier: isSubscriptionTier(clerkTier) ? clerkTier : 'STARTER',
      subscriptionStatus: isSubscriptionStatus(clerkStatus) ? clerkStatus : 'active',
    };

    setLoading(true);

    try {
      const response = await fetch('/api/profile', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Profile request failed');
      }

      const data = await response.json();
      const profileUser = data.user ?? fallbackUser;
      setUser(profileUser);

      if (
        profileUser?.subscriptionTier &&
        clerkUser.publicMetadata?.subscriptionTier !== profileUser.subscriptionTier &&
        typeof (clerkUser as any).reload === 'function'
      ) {
        await (clerkUser as any).reload();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  }, [clerkUser, isLoaded]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
