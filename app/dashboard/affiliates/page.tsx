import { auth } from '@clerk/nextjs/server';
import { getMyStoresAction, getAffiliateLinksAction, syncUserAction } from '@/lib/actions';
import { getSelectedStoreId } from '@/lib/dashboard-actions';
import { redirect } from 'next/navigation';
import AffiliatesClient from './AffiliatesClient';

export default async function AffiliatesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  // Fetch data in parallel on the server
  const [_, stores, cookieStoreId] = await Promise.all([
    syncUserAction(),
    getMyStoresAction(),
    getSelectedStoreId()
  ]);

  let initialLinks: any[] = [];
  let selectedStoreId: string = cookieStoreId ?? '';

  if (stores && stores.length > 0) {
    const activeStoreId = stores.find(s => s.id === selectedStoreId)?.id ?? stores[0].id;
    selectedStoreId = activeStoreId;
    initialLinks = await getAffiliateLinksAction(activeStoreId);
  }

  return (
    <AffiliatesClient 
      initialLinks={initialLinks} 
      stores={stores}
      selectedStoreId={selectedStoreId}
    />
  );
}
