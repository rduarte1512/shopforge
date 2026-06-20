import type { SubscriptionStatus, SubscriptionTier } from './subscription-db';

export async function syncClerkSubscriptionMetadata(params: {
  userId: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  role?: 'ADMIN' | 'CLIENT';
}) {
  try {
    const clerkModule = await import('@clerk/nextjs/server');
    const rawClient = (clerkModule as any).clerkClient;
    const client = typeof rawClient === 'function' ? await rawClient() : rawClient;

    if (!client?.users?.updateUserMetadata) return;

    await client.users.updateUserMetadata(params.userId, {
      publicMetadata: {
        subscriptionTier: params.subscriptionTier,
        subscriptionStatus: params.subscriptionStatus ?? 'active',
        ...(params.role ? { role: params.role } : {}),
      },
    });
  } catch (error) {
    console.error('Clerk metadata sync error:', error);
  }
}
