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

  const [profile, stores, cookieStoreId] = await Promise.all([
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
    <ProductsClient 
      user={clientUser} 
      initialProducts={initialProducts} 
      selectedStoreId={selectedStoreId} 
    />
  );
}
