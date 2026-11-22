'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ChartNoAxesCombined, Eye, Radio, RefreshCw, Users, WandSparkles } from 'lucide-react';
import type { TrafficOverview } from '@/lib/store-traffic';

const number = (n: number) => new Intl.NumberFormat('pt-PT').format(n);
async function getTraffic(storeId: string, days: number): Promise<TrafficOverview> {
  const response = await fetch('/api/dashboard/traffic?storeId=' + encodeURIComponent(storeId) + '&days=' + days, { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível consultar as estatísticas.');
  return response.json();
}

export default function TrafficPulse({ storeId }: { storeId: string }) {
  const [today, setToday] = useState<TrafficOverview | null>(null);
  const [week, setWeek] = useState<TrafficOverview | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    setToday(null); setWeek(null); setError('');
    const refresh = async () => {
      if (!active || inFlight || document.visibilityState !== 'visible') return;
      inFlight = true; setRefreshing(true);
      try {
        const [day, seven] = await Promise.all([getTraffic(storeId, 1), getTraffic(storeId, 7)]);
        if (active) { setToday(day); setWeek(seven); setError(''); }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Falha ao atualizar.'); }
      finally { inFlight = false; if (active) setRefreshing(false); }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 20_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
  }, [storeId]);

  const available = today?.available && week?.available;
  const tiles = [
    { title: 'Visitantes ativos', value: today?.summary.live, icon: Radio, subtitle: 'Últimos 5 minutos', live: true },
    { title: 'Visitantes únicos', value: today?.summary.visitors, icon: Users, subtitle: 'Últimas 24 horas' },
    { title: 'Visitas à loja', value: week?.summary.sessions, icon: Activity, subtitle: 'Últimos 7 dias' },
    { title: 'Páginas consultadas', value: week?.summary.pageViews, icon: Eye, subtitle: 'Últimos 7 dias' },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101c31] p-5 text-white shadow-xl sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.22em] text-emerald-300"><ChartNoAxesCombined className="h-4 w-4" /> ShopForge Live Analytics</p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">O movimento da tua loja</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">Percebe quantas pessoas estão na loja agora e como evoluem as visitas.</p>
        </div>
        <Link href="/dashboard/forgepilot?tab=growth" className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20"><WandSparkles className="h-4 w-4" /> Explorar Growth Lab <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(tile => <div key={tile.title} className="rounded-[1.4rem] border border-white/10 bg-white/[.055] px-5 py-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold text-slate-300">{tile.title}</p><tile.icon className={'h-4 w-4 ' + (tile.live ? 'text-emerald-300' : 'text-slate-400')} /></div>
          <div className="flex items-center gap-2"><strong className="text-3xl font-black tabular-nums tracking-tight">{!today || !week ? '—' : available ? number(tile.value || 0) : '—'}</strong>{tile.live && available && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />ao vivo</span>}</div>
          <p className="mt-2 text-xs text-slate-400">{tile.subtitle}</p>
        </div>)}
      </div>
      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><RefreshCw className={'h-3.5 w-3.5 ' + (refreshing ? 'animate-spin' : '')} /> Atualização automática a cada 20 segundos</span>
        <span>{error || (today && !today.available ? today.note : 'Apenas visitantes que aceitaram estatísticas · sem dados de identificação')}</span>
      </div>
    </section>
  );
}
