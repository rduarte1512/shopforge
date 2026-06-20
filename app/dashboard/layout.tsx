import { auth, currentUser } from '@clerk/nextjs/server';
import { getMyStoresAction, syncUserAction } from '@/lib/actions';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/login');
  }

  const [profile, stores] = await Promise.all([
    syncUserAction(),
    getMyStoresAction()
  ]);

  const clientUser = JSON.parse(JSON.stringify(user));

  if (profile?.subscription_tier) {
    clientUser.publicMetadata = {
      ...(clientUser.publicMetadata ?? {}),
      subscriptionTier: profile.subscription_tier,
      subscriptionStatus: profile.subscription_status ?? 'active',
      role: profile.role ?? 'CLIENT',
    };
  }

  return (
    <DashboardLayoutClient user={clientUser} initialStores={stores}>
      {children}
    </DashboardLayoutClient>
  );
}
