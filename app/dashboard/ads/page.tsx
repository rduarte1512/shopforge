
import {auth} from '@clerk/nextjs/server';
import {accountPlan} from '@/lib/plan-access';
import {hasFeature} from '@/lib/plans';
import {getSelectedStoreId} from '@/lib/dashboard-actions';
import {getMyStoresAction} from '@/lib/actions';
import {getAdsWorkspace} from '@/lib/forgeads-actions';
import ForgeAdsClient from './ForgeAdsClient';
export default async function Page(){
 const {userId}=await auth();if(!userId)return null;
 const plan=await accountPlan(userId);if(!hasFeature(plan.id,'active','ads'))return <div className="p-8 text-text-primary">ForgeAds disponível a partir do Professional.</div>;
 const [stores,selected]=await Promise.all([getMyStoresAction(),getSelectedStoreId()]);const store=stores.find(s=>s.id===selected)||stores[0];
 if(!store)return <div className="p-8">Cria uma loja para começar a anunciar.</div>;
 try{const data=await getAdsWorkspace(store.id);return <ForgeAdsClient key={store.id} storeId={store.id} storeName={store.name} initial={data}/>}catch{return <section className="rounded-3xl border border-border bg-card-bg p-8"><h1 className="text-3xl font-black">ForgeAds</h1><p className="mt-3 text-text-secondary">O centro de anúncios ainda não está disponível. Confirma a migração ForgeAds e a ligação à base de dados.</p></section>}
}
