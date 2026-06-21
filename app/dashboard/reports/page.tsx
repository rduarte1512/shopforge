'use client';

import { getFinancialOverviewAction } from '@/lib/finance-actions';
import { Calculator, Download, FileText, Loader2, Percent, Receipt, RefreshCcw, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

function eur(value: any) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
}

function pct(value: any) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function Card({ title, value, note, icon: Icon }: any) {
  return (
    <div className="bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[28px] p-6 shadow-premium">
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-text-muted">{title}</p>
          <p className="text-3xl font-black text-text-primary mt-3">{value}</p>
          <p className="text-xs font-bold text-text-muted mt-2">{note}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(id?: string) {
    setRefreshing(true);
    try {
      const result = await getFinancialOverviewAction(id || storeId || null);
      setData(result);
      setStoreId(result.selectedStoreId || '');
      if (result.selectedStoreId) localStorage.setItem('selectedStoreId', result.selectedStoreId);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load(localStorage.getItem('selectedStoreId') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!data?.stores?.length) {
    return (
      <div className="bg-card-bg rounded-[32px] border border-border p-12 text-center shadow-premium">
        <Receipt className="w-14 h-14 text-text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-black text-text-primary">Ainda não existem lojas para analisar</h1>
        <p className="text-sm text-text-muted mt-2 font-medium">Cria uma loja para ativares a área financeira.</p>
      </div>
    );
  }

  const m = data.metrics || {};
  const exportCsv = `/api/reports/export?format=csv&storeId=${storeId}`;
  const exportPdf = `/api/reports/export?format=pdf&storeId=${storeId}`;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-950 rounded-[40px] p-8 md:p-10 text-white shadow-2xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-emerald-300 text-xs font-black uppercase tracking-widest mb-5">
              <Calculator className="w-4 h-4" /> Área financeira completa
            </div>
            <h1 className="text-4xl md:text-5xl font-[950] tracking-tight">Finanças, lucro e margem</h1>
            <p className="text-slate-300 font-medium mt-3 max-w-2xl">Receita líquida, custos, IVA, reembolsos, conversão, exportação e comparação mensal.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={storeId} onChange={(e) => load(e.target.value)} className="bg-white text-slate-950 rounded-2xl px-4 py-3 text-sm font-black border-none">
              {data.stores.map((store: any) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            <button onClick={() => load()} className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white font-black flex items-center gap-2">
              <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <a href={exportCsv} className="px-4 py-3 rounded-2xl bg-emerald-400 text-slate-950 font-black flex items-center gap-2"><Download className="w-4 h-4" /> CSV</a>
            <a href={exportPdf} className="px-4 py-3 rounded-2xl bg-white text-slate-950 font-black flex items-center gap-2"><FileText className="w-4 h-4" /> PDF</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card title="Receita líquida" value={eur(m.netRevenue)} note="Após reembolsos" icon={TrendingUp} />
        <Card title="Lucro líquido" value={eur(m.netProfit)} note="Receita - custos - IVA" icon={Calculator} />
        <Card title="Margem" value={pct(m.margin)} note="Rentabilidade real" icon={Percent} />
        <Card title="Conversão" value={pct(m.conversionRate)} note={`${m.paidOrdersCount || 0} pagos / ${m.abandonedCarts || 0} carrinhos`} icon={Receipt} />
        <Card title="Custo dos produtos" value={eur(m.productCost)} note="Com base nos itens vendidos" icon={Calculator} />
        <Card title="Reembolsos" value={eur(m.refunds)} note="Valor devolvido" icon={Receipt} />
        <Card title="IVA estimado" value={eur(m.taxAmount)} note="Taxa por produto quando existe" icon={Receipt} />
        <Card title="Comparação mensal" value={pct(m.monthlyGrowth)} note={`${eur(m.currentMonth)} este mês`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[32px] shadow-premium overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-black text-text-primary">Produtos mais rentáveis</h2>
            <p className="text-xs font-bold text-text-muted mt-1">Receita, custo e margem por produto.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-bg-gray/70 text-text-muted uppercase text-[11px] font-black tracking-widest">
                <tr><th className="text-left p-4">Produto</th><th className="text-left p-4">Qtd.</th><th className="text-left p-4">Receita</th><th className="text-left p-4">Custo</th><th className="text-left p-4">Lucro</th><th className="text-left p-4">Margem</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-bg-gray/60">
                    <td className="p-4 font-black text-text-primary">{product.name}</td>
                    <td className="p-4 font-bold text-text-secondary">{product.quantity}</td>
                    <td className="p-4 font-bold">{eur(product.revenue)}</td>
                    <td className="p-4 font-bold text-rose-500">{eur(product.cost)}</td>
                    <td className="p-4 font-black text-emerald-600">{eur(product.profit)}</td>
                    <td className="p-4 font-black">{pct(product.margin)}</td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-text-muted font-bold">Ainda sem produtos vendidos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[32px] shadow-premium p-6 space-y-5">
          <h2 className="text-xl font-black text-text-primary">Recuperação automática</h2>
          <div className="rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-400/20 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Encomendas pendentes</p>
            <p className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-2">{eur(m.pendingRecoveryValue)}</p>
            <p className="text-xs font-bold text-amber-800/70 dark:text-amber-100/70 mt-2">Liga isto às automações para recuperar pagamentos pendentes.</p>
          </div>
          {data.monthly.slice(-5).map((month: any) => (
            <div key={month.month} className="flex items-center justify-between p-4 rounded-2xl bg-bg-gray/70 border border-border">
              <div><p className="font-black text-text-primary">{month.month}</p><p className="text-xs font-bold text-text-muted">{month.orders} encomenda(s)</p></div>
              <div className="text-right"><p className="font-black text-text-primary">{eur(month.revenue)}</p><p className="text-xs font-bold text-emerald-600">{eur(month.profit)} lucro</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
