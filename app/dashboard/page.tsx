import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  syncUserAction, 
  getMyStoresAction, 
  getStoreProductsAction, 
  getStoreOrdersAction 
} from '@/lib/actions';
import { getSelectedStoreId } from '@/lib/dashboard-actions';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardOverview() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/login');
  }

  // Fetch initial data in parallel on the server
  const [_, stores, cookieStoreId] = await Promise.all([
    syncUserAction(),
    getMyStoresAction(),
    getSelectedStoreId()
  ]);

  let products: any[] = [];
  let orders: any[] = [];
  let selectedStoreId: string | null = cookieStoreId;

  if (stores.length > 0) {
    // Determine which store to load data for
    const activeStoreId = stores.find(s => s.id === selectedStoreId)?.id || stores[0].id;
    selectedStoreId = activeStoreId;

    // Fetch store specific data in parallel
    const [storeProducts, storeOrders] = await Promise.all([
      getStoreProductsAction(activeStoreId),
      getStoreOrdersAction(activeStoreId)
    ]);
    
    products = storeProducts;
    orders = storeOrders;
  }

  return (
    <DashboardClient 
      user={JSON.parse(JSON.stringify(user))} 
      stores={stores}
      products={products}
      orders={orders}
      selectedStoreId={selectedStoreId}
    />
  );
}
