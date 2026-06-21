'use client';

import { getAutomationDashboardAction, seedDefaultAutomationsAction, toggleAutomationAction } from '@/lib/marketing-automation-actions';
import { Loader2, PlayCircle, RefreshCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AutomationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load(storeId?: string) {
    setLoading(true);
    const result = await getAutomationDashboardAction(storeId || localStorage.getItem('selectedStoreId'));
    setData(result);
    if (result.selectedStoreId) localStorage.setItem('selectedStoreId', result.selectedStoreId);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function createDefaults() {
    if (!data?.selectedStoreId) return;
    setSaving(true);
    await seedDefaultAutomationsAction(data.selectedStoreId);
    await load(data.selectedStoreId);
    setSaving(false);
  }

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-950 rounded-[40px] p-8 text-white shadow-2xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-3">Marketing automático</p>
            <h1 className="text-4xl font-black tracking-tight">Automações de marketing</h1>
            <p className="text-slate-300 font-medium mt-3">Cria fluxos para carrinhos, pós-compra, clientes VIP, clientes inativos e encomendas pendentes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {data?.stores?.length > 0 && <select value={data.selectedStoreId || ''} onChange={(e) => load(e.target.value)} className="bg-white text-slate-950 rounded-2xl px-4 py-3 text-sm font-black border-none">{data.stores.map((store: any) => <option key={store.id} value={store.id}>{store.name}</option>)}</select>}
            <button onClick={() => load(data.selectedStoreId)} className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white font-black flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Atualizar</button>
            <button onClick={createDefaults} disabled={saving} className="px-4 py-3 rounded-2xl bg-emerald-400 text-slate-950 font-black flex items-center gap-2 border-none cursor-pointer disabled:opacity-60"><PlayCircle className="w-4 h-4" /> Criar padrões</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card-bg border border-border rounded-[28px] p-5 shadow-premium"><p className="text-xs font-black uppercase text-text-muted">Automações ativas</p><p className="text-3xl font-black text-text-primary mt-2">{data?.summary?.active || 0}</p></div>
        <div className="bg-card-bg border border-border rounded-[28px] p-5 shadow-premium"><p className="text-xs font-black uppercase text-text-muted">Carrinhos abandonados</p><p className="text-3xl font-black text-text-primary mt-2">{data?.summary?.abandonedCarts || 0}</p></div>
        <div className="bg-card-bg border border-border rounded-[28px] p-5 shadow-premium"><p className="text-xs font-black uppercase text-text-muted">Pedidos pendentes</p><p className="text-3xl font-black text-text-primary mt-2">{data?.summary?.pendingOrders || 0}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(data?.automations || []).map((automation: any) => (
          <div key={automation.id} className="bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[32px] shadow-premium p-6">
            <div className="flex justify-between gap-4 items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">{automation.audience}</p>
                <h2 className="text-xl font-black text-text-primary mt-1">{automation.name}</h2>
                <p className="text-sm font-bold text-text-muted mt-2">{automation.subject}</p>
                <p className="text-xs font-bold text-text-muted mt-2">Delay: {automation.delay_minutes} min</p>
              </div>
              <button onClick={async () => { await toggleAutomationAction(automation.id, !automation.active); await load(data.selectedStoreId); }} className="border-none bg-transparent cursor-pointer text-primary">{automation.active ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-text-muted" />}</button>
            </div>
          </div>
        ))}
      </div>

      {(data?.automations || []).length === 0 && <div className="bg-card-bg border border-border rounded-[32px] p-12 text-center shadow-premium"><h2 className="text-2xl font-black text-text-primary">Sem automações ainda</h2><p className="text-sm font-bold text-text-muted mt-2">Clica em Criar padrões para adicionar as automações recomendadas.</p></div>}
    </div>
  );
}
