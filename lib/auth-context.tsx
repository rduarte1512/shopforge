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

    const fallbackUser: AuthUser = {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? '',
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || 'Cliente',
      role: 'CLIENT',
      subscriptionTier: 'STARTER',
      subscriptionStatus: 'active',
    };

    setLoading(true);

    try {
      const response = await fetch('/api/profile', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Profile request failed');
      }

      const data = await response.json();
      setUser(data.user ?? fallbackUser);
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
