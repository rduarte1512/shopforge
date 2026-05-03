import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  syncUserAction, 
  getMyStoresAction, 
  getStoreProductsAction, 
  getStoreOrdersAction 
} from '@/lib/actions';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardOverview() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/login');
  }

  // Fetch initial data in parallel on the server
  // 1. Sync user and 2. Get stores
  const [_, stores] = await Promise.all([
    syncUserAction(),
    getMyStoresAction()
  ]);

  let products: any[] = [];
  let orders: any[] = [];
  let selectedStoreId: string | null = null;

  if (stores.length > 0) {
    // In a server component, we can't access localStorage.
    // The client will handle the stored selection if needed, but for the initial paint
    // we use the first store.
    selectedStoreId = stores[0].id;

    // Fetch store specific data in parallel
    const [storeProducts, storeOrders] = await Promise.all([
      getStoreProductsAction(selectedStoreId),
      getStoreOrdersAction(selectedStoreId)
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
