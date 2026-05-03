import { auth } from '@clerk/nextjs/server';
import { getMyStoresAction, getStoreOrdersAction, syncUserAction } from '@/lib/actions';
import { getSelectedStoreId } from '@/lib/dashboard-actions';
import { redirect } from 'next/navigation';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
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

  let initialOrders: any[] = [];
  let selectedStoreId: string = cookieStoreId ?? '';

  if (stores && stores.length > 0) {
    const activeStoreId = stores.find(s => s.id === selectedStoreId)?.id ?? stores[0].id;
    selectedStoreId = activeStoreId;
    initialOrders = await getStoreOrdersAction(activeStoreId);
  }

  return (
    <CustomersClient 
      initialOrders={initialOrders} 
    />
  );
}
