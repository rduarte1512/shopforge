import { auth } from '@clerk/nextjs/server';
import { getMyStoresAction, getPromotionsAction, syncUserAction } from '@/lib/actions';
import { redirect } from 'next/navigation';
import PromotionsClient from './PromotionsClient';

export default async function PromotionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  // Fetch data in parallel on the server
  const [_, stores] = await Promise.all([
    syncUserAction(),
    getMyStoresAction()
  ]);

  let initialBanners: any[] = [];
  let selectedStoreId: string = '';

  if (stores && stores.length > 0) {
    selectedStoreId = stores[0].id;
    initialBanners = await getPromotionsAction(selectedStoreId);
  }

  return (
    <PromotionsClient 
      initialBanners={initialBanners} 
      selectedStoreId={selectedStoreId}
    />
  );
}
