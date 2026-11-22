'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, ChartNoAxesCombined, CheckCircle2, Clock3, Download, Eye, FlaskConical, HeartPulse, Lightbulb, Loader2, MousePointerClick, PackageOpen, Radio, RefreshCw, ShieldCheck, ShoppingBag, ShoppingCart, TrendingUp, Users, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Link from 'next/link';
import type { TrafficOverview, TrafficPeriod } from '@/lib/store-traffic';
import { buildGrowthRecommendations } from '@/lib/traffic-insights';

const number = (value: number) => new Intl.NumberFormat('pt-PT').format(value);
const percent = (part: number, total: number) => total ? (100 * part / total).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + '%' : '—';
const delta = (current: number, previous: number) => previous ? Math.round((current - previous) / previous * 100) : null;
const labels: Record<TrafficPeriod, string> = { 1: '24 horas', 7: '7 dias', 30: '30 dias' };

function useTraffic(storeId: string, period: TrafficPeriod) {
  const [data, setData] = useState<TrafficOverview | null>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(true);
  useEffect(() => {
    let active = true;
    let busy = false;
    setData(null); setError(''); setUpdating(true);
    const load = async () => {
      if (!active || busy || document.visibilityState !== 'visible') return;
      busy = true; setUpdating(true);
      try {
        const response = await fetch('/api/dashboard/traffic?storeId=' + encodeURIComponent(storeId) + '&days=' + period, { cache: 'no-store' });
        if (!response.ok) throw new Error('Não foi possível consultar os dados desta loja.');
        const result: TrafficOverview = await response.json();
        if (active) { setData(result); setError(''); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Ocorreu um erro a atualizar os dados.');
      } finally { busy = false; if (active) setUpdating(false); }
    };
    void load();
    const timer = window.setInterval(() => void load(), 25_000);
    document.addEventListener('visibilitychange', load);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', load); };
  }, [storeId, period]);
  return { data, error, updating };
}

function MiniStat({ title, value, detail, icon: Icon, accent = false }: {
  title: string; value: string; detail: string; icon: typeof Users; accent?: boolean;
}) {
  return <div className="group rounded-[1.4rem] border border-border bg-card-bg p-5 shadow-sm transition hover:border-emerald-500/30 hover:shadow-md">
    <div className="mb-5 flex items-center justify-between gap-2"><span className="text-xs font-bold text-text-secondary">{title}</span><span className={'rounded-xl p-2 ' + (accent ? 'bg-emerald-500/10 text-emerald-500' : 'bg-bg-main text-text-muted')}><Icon className="h-4 w-4" /></span></div>
    <div className="text-3xl font-black tabular-nums tracking-tight text-text-primary">{value}</div>
    <p className="mt-2 text-xs text-text-muted">{detail}</p>
  </div>;
}
function ExportButton({ data }: { data: TrafficOverview }) {
  const download = () => {
    const rows = [['Periodo UTC', 'Visitantes unicos', 'Paginas vistas'], ...data.daily.map(row => [row.date, String(row.visitors), String(row.pageViews)])];
    const csv = '\ufeff' + rows.map(row => row.join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'shopforge-trafego-' + data.period + 'dias.csv'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-secondary transition hover:bg-bg-main"><Download className="h-4 w-4" /> Exportar CSV</button>;
}
function timeline(data: TrafficOverview) {
  const today = new Date(data.generatedAt);
  if (data.period === 1) {
    const byHour = new Map(data.hourly.map(point => [point.hour, point]));
    return Array.from({ length: 24 }, (_, i) => {
      const timestamp = new Date(today.getTime() - (23 - i) * 3600_000);
      const key = timestamp.toISOString().slice(0, 13).replace('T', ' ') + ':00';
      return { label: timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', timeZone: 'UTC' }) + 'h', visitors: byHour.get(key)?.visitors || 0, views: byHour.get(key)?.pageViews || 0 };
    });
  }
  const byDay = new Map(data.daily.map(point => [point.date, point]));
  return Array.from({ length: data.period }, (_, i) => {
    const timestamp = new Date(today.getTime() - (data.period - 1 - i) * 86400000);
    const key = timestamp.toISOString().slice(0, 10);
    return { label: timestamp.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', timeZone: 'UTC' }), visitors: byDay.get(key)?.visitors || 0, views: byDay.get(key)?.pageViews || 0 };
  });
}
const priorityStyle = {
  priority: { icon: Zap, label: 'Ação recomendada', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
  opportunity: { icon: Lightbulb, label: 'Oportunidade', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
  insight: { icon: CheckCircle2, label: 'Acompanhamento', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
} as const;

export default function ForgePilotGrowthLab({ storeId }: { storeId: string }) {
  const [period, setPeriod] = useState<TrafficPeriod>(7);
  const { data, error, updating } = useTraffic(storeId, period);
  const chart = useMemo(() => data ? timeline(data) : [], [data]);
  const insights = useMemo(() => data ? buildGrowthRecommendations(data) : [], [data]);
  const summary = data?.summary;
  const ready = data?.available === true;
  const change = ready && summary ? delta(summary.visitors, summary.previousVisitors) : null;
  const funnel = ready && summary ? [
    { name: 'Visitaram a loja', subtitle: 'Visitantes únicos', value: summary.visitors, icon: Users, color: '#10b981' },
    { name: 'Abriram produtos', subtitle: 'Pessoas que consultaram produtos', value: summary.productViewers, icon: Eye, color: '#22c55e' },
    { name: 'Adicionaram ao carrinho', subtitle: 'Pessoas que demonstraram intenção', value: summary.cartVisitors, icon: ShoppingCart, color: '#0ea5e9' },
    { name: 'Iniciaram checkout', subtitle: 'Pessoas que iniciaram finalização', value: summary.checkoutVisitors, icon: ShoppingBag, color: '#8b5cf6' },
  ] : [];

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#101a32] via-[#162744] to-[#102f2e] p-6 text-white shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-xl">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.2em] text-emerald-300"><FlaskConical className="h-4 w-4" /> ForgePilot Growth Lab</p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Conhece os teus visitantes.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Acompanha o que acontece na tua loja e descobre, com números reais, onde podes tornar a experiência ainda melhor.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/15 bg-white/10 p-1.5">
          {([1, 7, 30] as TrafficPeriod[]).map(value => <button type="button" key={value} onClick={() => setPeriod(value)} aria-pressed={period === value} className={'rounded-xl px-3.5 py-2.5 text-xs font-black transition ' + (period === value ? 'bg-white text-slate-950 shadow' : 'text-slate-200 hover:bg-white/10')}>{labels[value]}</button>)}
        </div>
      </div>
      <div className="relative mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-300"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"><span className={'h-2 w-2 rounded-full ' + (updating ? 'bg-amber-300' : 'bg-emerald-400')} />{updating ? 'A atualizar dados' : 'Dados atualizados'}</span><span>Atualização a cada 25 segundos</span><span>·</span><span>Visitantes com consentimento</span></div>
    </section>

    {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
    {data && !ready ? <section className="rounded-[1.5rem] border border-amber-500/30 bg-card-bg p-7"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-500" /><div><h3 className="text-xl font-black">A recolha de dados ainda não está disponível</h3><p className="mt-2 text-sm text-text-secondary">{data.note}</p><p className="mt-2 text-xs text-text-muted">Os valores não são inventados. Depois da instalação, os gráficos começarão a preencher-se com as visitas consentidas.</p></div></div></section> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat title="Ativos agora" value={ready ? number(summary!.live) : '—'} detail="Atividade nos últimos 5 minutos" icon={Radio} accent />
        <MiniStat title="Visitantes únicos" value={ready ? number(summary!.visitors) : '—'} detail={'Últimas ' + labels[period] + ' · estimativa com consentimento'} icon={Users}/>
        <MiniStat title="Visitas à loja" value={ready ? number(summary!.sessions) : '—'} detail="Sessões iniciadas no período" icon={Activity}/>
        <MiniStat title="Páginas vistas" value={ready ? number(summary!.pageViews) : '—'} detail="Visualizações registadas" icon={Eye}/>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat title="Abriram produtos" value={ready ? number(summary!.productViewers) : '—'} detail={ready ? percent(summary!.productViewers, summary!.visitors) + ' dos visitantes' : 'Sem dados'} icon={PackageOpen}/>
        <MiniStat title="Adicionaram ao carrinho" value={ready ? number(summary!.cartVisitors) : '—'} detail={ready ? percent(summary!.cartVisitors, summary!.visitors) + ' dos visitantes' : 'Sem dados'} icon={ShoppingCart}/>
        <MiniStat title="Iniciaram checkout" value={ready ? number(summary!.checkoutVisitors) : '—'} detail={ready ? percent(summary!.checkoutVisitors, summary!.visitors) + ' dos visitantes' : 'Sem dados'} icon={MousePointerClick}/>
        <MiniStat title="Encomendas pagas" value={ready ? number(summary!.paidOrders) : '—'} detail="Pedidos reais da loja · não atribuídos a visitas" icon={CheckCircle2}/>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,1fr)]">
        <section className="min-w-0 rounded-[1.7rem] border border-border bg-card-bg p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="flex items-center gap-2 text-xl font-black"><ChartNoAxesCombined className="h-5 w-5 text-emerald-500" /> Evolução do tráfego</h3><p className="mt-1 text-xs text-text-muted">Visitantes únicos por intervalo e páginas visualizadas · UTC</p></div>
            {ready && data && <ExportButton data={data} />}
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-text-secondary"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/> Visitantes</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500"/> Páginas vistas</span></div>
          <div className="mt-5 h-[290px] w-full">
            {ready ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{ top: 12, right: 5, left: -20, bottom: 0 }}>
              <defs><linearGradient id="fpgVisitors" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.24}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="fpgViews" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={.13}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} minTickGap={16}/>
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}/>
              <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }} formatter={(value: any, key: any) => [number(Number(value) || 0), key === 'visitors' ? 'Visitantes' : 'Páginas vistas']}/>
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} fill="url(#fpgViews)" isAnimationActive={false} />
              <Area type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={3} fill="url(#fpgVisitors)" isAnimationActive={false} />
            </AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-xl bg-bg-main text-sm text-text-muted">{!data ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Sem dados disponíveis'}</div>}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-text-secondary">Comparação com o período anterior</span>
            {change === null ? <span className="text-xs font-bold text-text-muted">Ainda sem base para comparar</span> : <span className={'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black ' + (change >= 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300')}>{change >= 0 ? <TrendingUp className="h-4 w-4"/> : <ArrowDownRight className="h-4 w-4" />}{change > 0 ? '+' : ''}{change}% visitantes</span>}
          </div>
        </section>
        <section className="rounded-[1.7rem] border border-border bg-card-bg p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-black">Percurso dos visitantes</h3><p className="mt-2 text-xs leading-5 text-text-muted">Pessoas distintas que realizaram cada ação no período. Não é uma contagem de compras concluídas.</p>
          <div className="mt-7 space-y-6">
            {funnel.length ? funnel.map((step, index) => <div key={step.name}>
              <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-xl bg-bg-main p-2 text-text-secondary"><step.icon className="h-4 w-4"/></span><div><p className="text-xs font-black">{step.name}</p><p className="text-[11px] text-text-muted">{step.subtitle}</p></div></div><span className="text-lg font-black tabular-nums">{number(step.value)}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-bg-main"><div className="h-full rounded-full transition-all" style={{ width: (summary!.visitors ? Math.min(100, step.value / summary!.visitors * 100) : 0) + '%', background: step.color }} /></div>
              <p className="mt-1.5 text-right text-[11px] text-text-muted">{index === 0 ? 'Base do percurso' : percent(step.value, summary!.visitors) + ' do total de visitantes'}</p>
            </div>) : <div className="py-20 text-center text-sm text-text-muted">Sem eventos registados.</div>}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[1.7rem] border border-border bg-card-bg p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h3 className="text-xl font-black">Produtos que despertam interesse</h3><p className="mt-1 text-xs text-text-muted">Visualizações e adições ao carrinho registadas</p></div><PackageOpen className="h-5 w-5 text-emerald-500" /></div>
          {data?.topProducts.length ? <div className="space-y-2">{data.topProducts.map((product, i) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-bg-main px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-bg text-xs font-black text-text-muted">{String(i + 1).padStart(2, '0')}</span><span className="truncate text-sm font-bold">{product.name}</span></div><div className="shrink-0 text-right"><p className="text-xs font-black">{number(product.views)} vistas</p><p className="text-[11px] text-text-muted">{number(product.addToCarts)} adições</p></div></div>)}</div> : <div className="flex h-44 flex-col items-center justify-center gap-2 text-sm text-text-muted"><PackageOpen className="h-7 w-7 opacity-40"/>{ready ? 'Ainda sem visualizações de produtos.' : 'A aguardar dados.'}</div>}
          <Link href="/dashboard/products" className="mt-5 inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-300">Gerir produtos <ArrowRight className="h-4 w-4" /></Link>
        </section>
        <section className="rounded-[1.7rem] border border-border bg-card-bg p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500" /><div><h3 className="text-xl font-black">O que podes melhorar</h3><p className="mt-1 text-xs text-text-muted">Sugestões baseadas nos dados disponíveis, não previsões de lucro.</p></div></div>
          <div className="space-y-3">{insights.map((insight, i) => {
            const style = priorityStyle[insight.level]; const Icon = style.icon;
            return <div key={i} className="rounded-xl border border-border bg-bg-main/60 p-4"><div className="flex items-start gap-3"><span className={'rounded-xl p-2 ' + style.color}><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-text-muted">{style.label}</p><h4 className="mt-1 text-sm font-black">{insight.title}</h4><p className="mt-2 text-xs leading-5 text-text-secondary">{insight.description}</p></div></div></div>;
          })}{!data && <p className="py-10 text-sm text-text-muted">A analisar o comportamento da loja...</p>}</div>
        </section>
      </div>
    </>}
    <p className="flex items-start gap-2 rounded-xl border border-border bg-card-bg p-4 text-xs leading-5 text-text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> O Growth Lab mede apenas visitantes que autorizaram estatísticas. Os totais podem ser inferiores ao tráfego real. “Ao vivo” significa atividade nos últimos 5 minutos, não uma ligação permanente. Encomendas pagas são dados comerciais independentes e não devem ser divididas pelo número de visitantes para calcular conversão sem atribuição.</p>
  </div>;
}
