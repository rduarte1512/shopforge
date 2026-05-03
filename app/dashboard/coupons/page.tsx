import { auth } from '@clerk/nextjs/server';
import { getMyStoresAction, getCouponsAction, syncUserAction } from '@/lib/actions';
import { redirect } from 'next/navigation';
import CouponsClient from './CouponsClient';

export default async function CouponsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  // Fetch data in parallel on the server
  const [_, stores] = await Promise.all([
    syncUserAction(),
    getMyStoresAction()
  ]);

  let initialCoupons: any[] = [];
  let selectedStoreId: string = '';

  if (stores && stores.length > 0) {
    selectedStoreId = stores[0].id;
    initialCoupons = await getCouponsAction(selectedStoreId);
  }

  return (
    <CouponsClient 
      initialCoupons={initialCoupons} 
      selectedStoreId={selectedStoreId}
    />
  );
}
