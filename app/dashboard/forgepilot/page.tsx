import { getSelectedStoreId } from '@/lib/dashboard-actions';
import { getMyStoresAction } from '@/lib/actions';
import { getForgePilotOverviewAction } from '@/lib/forgepilot-actions';
import ForgePilotClient from '@/components/dashboard/ForgePilotClient';

export default async function ForgePilotPage() {
  const [stores, selectedStoreId] = await Promise.all([getMyStoresAction(), getSelectedStoreId()]);
  const activeStoreId = stores.find(store => store.id === selectedStoreId)?.id || stores[0]?.id || null;
  const overview = activeStoreId ? await getForgePilotOverviewAction(activeStoreId) : null;
  return <ForgePilotClient key={activeStoreId || 'empty'} initial={overview} />;
}
