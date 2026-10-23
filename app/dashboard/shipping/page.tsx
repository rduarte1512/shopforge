import { auth } from '@clerk/nextjs/server';
import { getMyStoresAction, getShippingMethodsAction, syncUserAction } from '@/lib/actions';
import { getSelectedStoreId } from '@/lib/dashboard-actions';
import { redirect } from 'next/navigation';
import ShippingClient from './ShippingClient';

export default async function ShippingPage() {
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

  let initialMethods: any[] = [];
  let selectedStoreId: string = cookieStoreId ?? '';

  if (stores && stores.length > 0) {
    selectedStoreId = stores.find((store: any) => store.id === cookieStoreId)?.id || stores[0].id;
    initialMethods = await getShippingMethodsAction(selectedStoreId);
  }

  return (
    <ShippingClient 
      initialMethods={initialMethods} 
      selectedStoreId={selectedStoreId}
    />
  );
}
