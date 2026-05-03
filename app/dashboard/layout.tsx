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

  // Fetch data in parallel on the server
  const [_, stores] = await Promise.all([
    syncUserAction(),
    getMyStoresAction()
  ]);

  return (
    <DashboardLayoutClient user={JSON.parse(JSON.stringify(user))} initialStores={stores}>
      {children}
    </DashboardLayoutClient>
  );
}
