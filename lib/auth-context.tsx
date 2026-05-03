'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { getProfile } from './db';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      if (isLoaded && clerkUser) {
        // In a real app, you'd fetch this from your Neon database
        // For now, we'll try to get it from our db helper if possible, 
        // or just mock it based on Clerk data
        try {
          // This is a client component, so we can't call getProfile directly if it uses @vercel/postgres
          // We would need a server action. For now, let's just use Clerk data.
          setUser({
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0].emailAddress,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            role: 'CLIENT',
            subscriptionTier: (clerkUser.publicMetadata.subscriptionTier as any) || 'STARTER',
            subscriptionStatus: 'active'
          });
        } catch (error) {
          console.error('Error setting user profile:', error);
        } finally {
          setLoading(false);
        }
      } else if (isLoaded) {
        setUser(null);
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [clerkUser, isLoaded]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
