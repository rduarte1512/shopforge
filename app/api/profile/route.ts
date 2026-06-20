import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureProfileFromAuth, mapProfileRowToAuthUser } from '@/lib/subscription-db';
import { syncClerkSubscriptionMetadata } from '@/lib/clerk-metadata';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || null;

    const profile = await ensureProfileFromAuth({ userId, email, name });
    const user = mapProfileRowToAuthUser(profile);

    await syncClerkSubscriptionMetadata({
      userId,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      role: user.role,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Não foi possível carregar o perfil' },
      { status: 500 }
    );
  }
}
