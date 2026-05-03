import { auth, currentUser } from '@clerk/nextjs/server';
import { getMyStoresAction, getStoreProductsAction, syncUserAction } from '@/lib/actions';
import { getSelectedStoreId } from '@/lib/dashboard-actions';
import { redirect } from 'next/navigation';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/login');
  }

  // Fetch data in parallel on the server
  const [_, stores, cookieStoreId] = await Promise.all([
    syncUserAction(),
    getMyStoresAction(),
    getSelectedStoreId()
  ]);

  let initialProducts: any[] = [];
  let selectedStoreId: string = cookieStoreId ?? '';

  if (stores && stores.length > 0) {
    const activeStoreId = stores.find(s => s.id === selectedStoreId)?.id ?? stores[0].id;
    selectedStoreId = activeStoreId;
    initialProducts = await getStoreProductsAction(activeStoreId);
  }

  return (
    <ProductsClient 
      user={JSON.parse(JSON.stringify(user))} 
      initialProducts={initialProducts} 
      selectedStoreId={selectedStoreId} 
    />
  );
}
