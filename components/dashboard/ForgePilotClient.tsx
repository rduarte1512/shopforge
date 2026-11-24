'use client';

import { useAuth } from '@/lib/auth-context';
import { hasFeature,featureForForgeTab } from '@/lib/plans';
import PlanUpgrade from './PlanUpgrade';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import ForgeTokenWallet from './ForgeTokenWallet';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, BadgeCheck, BrainCircuit, Check, CheckCircle2, ChevronRight, Clock3, Eye, FlaskConical, History, Lightbulb, Loader2, Package, Palette, RotateCcw, ShieldCheck, Sparkles, TrendingUp, WandSparkles, X } from 'lucide-react';
import {
  applyForgePilotImprovementAction,
  getForgePilotOverviewAction,
  previewForgePilotImprovementAction,
  restoreForgePilotHistoryAction,
  saveForgePilotBrandAction,
  suggestForgePilotBrandWithAIAction,
} from '@/lib/forgepilot-actions';
import type { ForgePilotBrand, ImprovementId } from '@/lib/forgepilot-engine';
import AdaptiveStorefront from '@/components/storefront/AdaptiveStorefront';
import ForgePilotGrowthLab from '@/components/dashboard/ForgePilotGrowthLab';
import ForgePilotCopilot from '@/components/dashboard/ForgePilotCopilot';
import ForgePilotCommand, { type CommandMode } from '@/components/dashboard/ForgePilotCommand';
import { forgePilotAuditDimensions } from '@/lib/forgepilot-missions';

type Overview = NonNullable<Awaited<ReturnType<typeof getForgePilotOverviewAction>>>;
type Tab = CommandMode | 'copilot' | 'insights' | 'brand' | 'history' | 'growth';
const commandTabs: CommandMode[] = ['overview','actions','intelligence','autopilot','experiments','marketing','business'];
function isCommandTab(tab: Tab): tab is CommandMode { return commandTabs.includes(tab as CommandMode); }
type Preview = { id: ImprovementId; title: string; customization: any; version: string };
const currency = (amount: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(amount) || 0);
const noOp = () => {};
const impactText: Record<string, string> = { high: 'Prioridade alta', medium: 'Recomendado', low: 'Pequena melhoria' };
const impactClass: Record<string, string> = {
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-400/10 dark:text-orange-200',
  medium: 'bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200',
  low: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
};

function RealStorePreview({ overview, customization }: { overview: Overview; customization: any }) {
  const store = { ...overview.store, customization };
  if (customization?.layoutEngine !== 'adaptive-v1') {
    const sections = Array.isArray(customization.sections) ? customization.sections : [];
    const hero = sections.find((section: any) => section.type === 'hero');
    const trust = sections.find((section: any) => section.type === 'trust');
    const faq = sections.find((section: any) => section.type === 'faq');
    const colors = customization.colors || {};
    return (
      <div className="min-h-[470px] px-6 py-8" style={{ background: colors.background || '#ffffff', color: colors.text || '#0f172a' }}>
        <p className="mb-8 text-sm font-black">{overview.store.name}</p>
        <div className="mb-10 max-w-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.15em]" style={{ color: colors.accent || '#008060' }}>Bem-vindo à nossa loja</p>
          <h3 className="text-3xl font-black leading-tight">{hero?.content?.title || overview.store.name}</h3>
          <p className="mt-3 text-sm opacity-70">{hero?.content?.subtitle || customization.hero?.subtitle || overview.store.description}</p>
          <span className="mt-5 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: colors.accent || '#008060' }}>{hero?.content?.buttonText || 'Explorar produtos'}</span>
        </div>
        <h4 className="mb-4 text-lg font-bold">A nossa coleção</h4>
        <div className="grid grid-cols-2 gap-3">
          {overview.products.slice(0, 4).map((product: any) => (
            <div key={product.id} className="rounded-xl border border-current/10 p-3">
              <div className="mb-2 aspect-[4/3] rounded-lg bg-current/5" />
              <p className="truncate text-xs font-semibold">{product.name}</p>
              <p className="mt-1 text-xs">{currency(product.price)}</p>
            </div>
          ))}
          {!overview.products.length && <p className="col-span-2 text-xs opacity-70">Ainda não existem produtos.</p>}
        </div>
        {trust && <section className="mt-8"><h4 className="font-bold">{trust.content?.title}</h4><p className="mt-2 text-xs opacity-70">{(trust.content?.items || []).join(' · ')}</p></section>}
        {faq && <section className="mt-6"><h4 className="font-bold">{faq.content?.title}</h4><p className="mt-2 text-xs opacity-70">{faq.content?.items?.[0]?.question}</p></section>}
      </div>
    );
  }
  return (
    <div className="pointer-events-none select-none">
      <AdaptiveStorefront
        store={store} customization={customization} products={overview.products}
        promotions={[]} formatPrice={currency} currency="EUR" setCurrency={noOp}
        availableCurrencies={['EUR']} addItem={noOp}
        comparisonIds={[]} isInComparison={() => false}
        addProduct={noOp} removeProduct={noOp} clearComparison={noOp}
      />
    </div>
  );
}

export default function ForgePilotClient({ initial }: { initial: Overview | null }) {
  const {user}=useAuth();
  const [overview, setOverview] = useState<Overview | null>(initial);
  const [tab, setTab] = useState<Tab>('copilot');
  const feature=featureForForgeTab(tab);
  const locked=feature&&!hasFeature(user?.subscriptionTier,user?.subscriptionStatus,feature);
  const [actionBrief,setActionBrief]=useState('');
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && (commandTabs.includes(requested as CommandMode) || ['copilot','growth','brand','history','insights'].includes(requested))) setTab(requested as Tab);
  }, []);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState<ForgePilotBrand>(initial?.brand || { audience: '', positioning: '', tone: '', tagline: '' });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  async function refresh() {
    if (!overview) return;
    const updated = await getForgePilotOverviewAction(overview.store.id);
    if (updated) {
      setOverview(updated);
      setDraft(updated.brand);
    }
  }
  async function handlePreview(id: ImprovementId) {
    if (!overview || loading) return;
    setError(null); setNotice(null); setLoading(id);
    try {
      const result = await previewForgePilotImprovementAction(overview.store.id, id);
      setPreview({ ...result, id });
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível preparar a melhoria.'); }
    finally { setLoading(null); }
  }
  async function handleApply() {
    if (!overview || !preview || loading) return;
    setLoading('apply'); setError(null);
    try {
      await applyForgePilotImprovementAction(overview.store.id, preview.id, preview.version);
      setPreview(null);
      await refresh();
      setNotice('Melhoria aplicada! Podes repor a versão anterior no Histórico.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Ocorreu um erro ao aplicar a melhoria.'); }
    finally { setLoading(null); }
  }
  async function handleSuggestBrand() {
    if (!overview || loading) return;
    setLoading('ai-brand'); setError(null); setNotice(null);
    try {
      const suggestion = await suggestForgePilotBrandWithAIAction(overview.store.id);
      setDraft(suggestion.brand);
      setNotice(suggestion.notice);
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível obter uma sugestão.'); }
    finally { setLoading(null); }
  }
  async function handleBrandSave() {
    if (!overview || loading) return;
    setLoading('brand'); setError(null); setNotice(null);
    try {
      await saveForgePilotBrandAction(overview.store.id, draft, overview.version);
      await refresh();
      setNotice('Identidade guardada! As sugestões futuras terão esta identidade em conta.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível guardar a identidade.'); }
    finally { setLoading(null); }
  }
  async function handleRestore(id: string) {
    if (!overview || loading) return;
    setLoading('restore'); setError(null); setNotice(null);
    try {
      await restoreForgePilotHistoryAction(overview.store.id, id, overview.version);
      await refresh();
      setConfirmRestore(null);
      setNotice('Versão anterior reposta com sucesso.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível repor a versão.'); }
    finally { setLoading(null); }
  }

  if (!overview) {
    return <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card-bg p-10 text-center">
      <BrainCircuit className="mx-auto mb-5 h-14 w-14 text-emerald-500" />
      <h1 className="text-3xl font-black">O teu ForgePilot começa aqui</h1>
      <p className="mx-auto mt-3 max-w-md text-text-secondary">Cria a tua primeira loja para receber um diagnóstico personalizado e propostas de melhoria.</p>
      <Link href="/dashboard/stores" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white">Criar a minha loja <ArrowRight className="h-4 w-4" /></Link>
    </div>;
  }
  const { store, audit, products, brand, history } = overview;
  const done = audit.checks.filter(item => item.passed).length;
  const navigation: Array<{ id: Tab; title: string; icon: typeof Sparkles }> = [
    { id: 'overview', title: 'Visão geral', icon: Activity },
    { id: 'copilot', title: 'Copilot & Missions', icon: BrainCircuit },
    { id: 'actions', title: 'Action Engine', icon: WandSparkles },
    { id: 'intelligence', title: 'Intelligence', icon: TrendingUp },
    { id: 'autopilot', title: 'Autopilot', icon: ShieldCheck },
    { id: 'experiments', title: 'Experiments', icon: FlaskConical },
    { id: 'marketing', title: 'Marketing Studio', icon: Sparkles },
    { id: 'business', title: 'Business Intelligence', icon: Package },
    { id: 'insights', title: 'Oportunidades', icon: Lightbulb },
    { id: 'brand', title: 'Identidade', icon: Palette },
    { id: 'history', title: 'Histórico', icon: History },
    { id: 'growth', title: 'Growth Lab', icon: FlaskConical },
  ];
  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card-bg p-5 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><BrainCircuit className="h-7 w-7"/></div><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">ShopForge Intelligence</p><h1 className="text-2xl font-black">ForgePilot Command Center</h1><p className="mt-1 text-xs text-text-muted">Loja selecionada · {store.name}</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={()=>setTab('copilot')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"><BrainCircuit className="h-4 w-4"/> Copilot</button><Link href={'/s/'+store.domain} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold"><ArrowUpRight className="h-4 w-4"/> Abrir loja</Link></div>
      </header>
      <ForgeTokenWallet/>

      {!locked && tab === 'insights' && <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Produtos na loja', value: audit.productCount, icon: Package, detail: 'Catálogo atual' },
          { label: 'Produtos com fotografia', value: audit.imageCount + ' / ' + audit.productCount, icon: Eye, detail: 'Imagens próprias registadas' },
          { label: 'Oportunidades encontradas', value: audit.recommendations.length, icon: TrendingUp, detail: 'Sugestões concretas' },
        ].map(item => <div key={item.label} className="flex items-center gap-4 rounded-[1.5rem] border border-border bg-card-bg p-5 shadow-sm">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><item.icon className="h-5 w-5" /></div>
          <div><p className="text-xs font-semibold text-text-secondary">{item.label}</p><p className="mt-1 text-2xl font-black text-text-primary">{item.value}</p><p className="text-[11px] text-text-muted">{item.detail}</p></div>
        </div>)}
      </div>}

      {!locked && tab === 'insights' && <section className="rounded-[1.5rem] border border-border bg-card-bg p-5 sm:p-6"><h2 className="mb-4 text-base font-black">Diagnóstico por dimensão</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{forgePilotAuditDimensions(audit).map(dimension => <div key={dimension.id}><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-bold text-text-secondary">{dimension.label}</span><span className="text-xs font-black tabular-nums">{dimension.score}%</span></div><div className="h-2 overflow-hidden rounded-full bg-bg-main"><div className="h-full rounded-full bg-emerald-500" style={{ width: dimension.score + '%' }}/></div><p className="mt-1.5 text-[10px] text-text-muted">{dimension.achieved}/{dimension.total} pontos técnicos</p></div>)}</div><p className="mt-4 text-[11px] text-text-muted">Estas dimensões medem critérios de preparação; não são previsões de conversão.</p></section>}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start rounded-2xl border border-border bg-card-bg p-3 xl:sticky xl:top-4">
          <p className="px-3 pb-3 pt-1 text-[10px] font-black uppercase tracking-[.18em] text-text-muted">Centro de operações</p>
          <nav className="flex gap-1 overflow-x-auto xl:flex-col" aria-label="Secções do ForgePilot" role="tablist">
          {navigation.map(item=><button key={item.id} role="tab" aria-selected={tab===item.id} type="button" onClick={()=>{setTab(item.id);setError(null);setNotice(null);}} className={'flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-bold transition xl:shrink '+(tab===item.id?'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300':'text-text-secondary hover:bg-bg-main hover:text-text-primary')}><item.icon className="h-4 w-4 shrink-0"/><span>{item.title}</span>{featureForForgeTab(item.id)&&!hasFeature(user?.subscriptionTier,user?.subscriptionStatus,featureForForgeTab(item.id)!)&&<LockKeyhole className="ml-auto h-3.5 w-3.5 shrink-0"/>}{tab===item.id&&<ChevronRight className="ml-auto h-3.5 w-3.5"/>}</button>)}
          </nav>
          <div className="mt-3 hidden border-t border-border px-3 pt-4 xl:block"><p className="text-[10px] font-black uppercase text-text-muted">Preparação básica</p><p className="mt-1 text-xl font-black tabular-nums">{audit.score}/100</p><p className="mt-1 text-[11px] text-text-muted">{done} verificações concluídas</p></div>
        </aside>
        <main className="min-w-0 space-y-5">
      {locked&&feature&&<PlanUpgrade feature={feature}/>}
      {!locked && isCommandTab(tab) && <ForgePilotCommand key={store.id} storeId={store.id} domain={store.domain} mode={tab} brief={actionBrief} onRefresh={refresh} onNavigate={setTab}/>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5 shrink-0" /> {notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-200">{error} <button onClick={() => { setError(null); void refresh(); }} className="ml-2 underline">Atualizar</button></div>}

      {!locked && tab === 'insights' && <>
        <section className="rounded-[1.5rem] border border-border bg-card-bg p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start gap-3"><span className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-lg font-black">Uma evolução de cada vez</h2><p className="mt-1 text-xs leading-5 text-text-secondary">Não precisas de conhecimentos técnicos para aplicar as sugestões.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[{ n: '01', title: 'Descobre', copy: 'Analisa as prioridades da tua loja.' }, { n: '02', title: 'Compara', copy: 'Vê o antes e o depois.' }, { n: '03', title: 'Decide', copy: 'Publica ou volta atrás quando quiseres.' }].map(step => <div key={step.n} className="flex gap-3 rounded-xl bg-bg-main p-4"><span className="text-sm font-black text-emerald-600 dark:text-emerald-300">{step.n}</span><div><p className="text-sm font-black">{step.title}</p><p className="mt-1 text-xs leading-5 text-text-muted">{step.copy}</p></div></div>)}
          </div>
        </section>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            <div><h2 className="text-xl font-black">Melhorias recomendadas</h2><p className="mt-1 text-sm text-text-secondary">Baseadas no conteúdo e nas configurações da tua loja, não em previsões de vendas.</p></div>
            {audit.recommendations.length === 0 ? <div className="rounded-[1.5rem] border border-border bg-card-bg p-8 text-center"><BadgeCheck className="mx-auto mb-3 h-9 w-9 text-emerald-500" /><h3 className="text-lg font-black">Boa base para começar!</h3><p className="mt-2 text-sm text-text-secondary">As verificações atuais passaram. Continua a melhorar a qualidade dos produtos e a acompanhar os clientes.</p></div> :
            audit.recommendations.map((item, i) => <article key={item.id} className="group rounded-[1.5rem] border border-border bg-card-bg p-5 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-white">{String(i + 1).padStart(2, '0')}</div>
                <div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap items-center gap-2"><span className={'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ' + impactClass[item.impact]}>{impactText[item.impact]}</span><span className="text-[11px] font-semibold text-text-muted">{item.category}</span></div>
                  <h3 className="text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{item.reason}</p>
                  <div className="mt-5">
                    {item.action ? <button disabled={Boolean(loading)} onClick={() => void handlePreview(item.action as ImprovementId)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                      {loading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}{item.actionLabel}<ChevronRight className="h-4 w-4" />
                    </button> : <Link href={item.manualHref || '/dashboard/stores'} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-bg-main">{item.actionLabel}<ArrowUpRight className="h-4 w-4" /></Link>}
                  </div>
                </div>
              </div>
            </article>)}
          </div>
          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-border bg-card-bg p-5">
              <h3 className="mb-4 flex items-center gap-2 font-black"><Activity className="h-4 w-4 text-emerald-500" /> Análise da loja</h3>
              <div className="space-y-4">{audit.checks.map(check => <div key={check.key} className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2"><CheckCircle2 className={'mt-0.5 h-4 w-4 shrink-0 ' + (check.passed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} /><p className="text-xs font-medium text-text-secondary">{check.title}</p></div><span className="shrink-0 text-xs font-black tabular-nums">{check.points}/{check.max}</span>
              </div>)}</div>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-text-muted">{audit.note}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-900 p-6 text-white"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Palette className="h-5 w-5 text-emerald-300" /></div><h3 className="text-lg font-black">A personalidade da tua marca</h3><p className="mt-2 text-sm text-slate-300">{brand.tagline}</p><button onClick={() => setTab('brand')} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-300">Personalizar identidade <ArrowRight className="h-4 w-4" /></button></div>
          </aside>
        </div>
      </>}

      {tab === 'copilot' && <ForgePilotCopilot storeId={store.id} storeName={store.name} audit={audit} version={overview.version} activeMission={store.customization?.forgepilot?.activeMission} busy={Boolean(loading)} onPreview={id => void handlePreview(id)} onMissionSaved={refresh} onOpenGrowth={() => setTab('growth')} onPrepareChanges={brief => {setActionBrief(brief);setTab('actions');}} />}

      {!locked && tab === 'brand' && <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[1.5rem] border border-border bg-card-bg p-6 sm:p-8">
          <div className="mb-6"><h2 className="text-2xl font-black">Brand DNA</h2><p className="mt-2 text-sm text-text-secondary">Diz ao ForgePilot quem é a tua marca. A identidade guardada ajuda a orientar as próximas recomendações. Não altera a loja publicada sem aprovação.</p>
            <button onClick={() => void handleSuggestBrand()} disabled={Boolean(loading)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/15 disabled:opacity-50 dark:text-emerald-200">
              {loading === 'ai-brand' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Sugerir identidade com IA
            </button><p className="mt-2 text-xs text-text-muted">A proposta aparece nos campos para reveres. Nada é guardado automaticamente.</p></div>
          <div className="space-y-5">{([
            ['audience', 'Para quem vendes?', 'Ex.: Pessoas que procuram acessórios de pesca resistentes.'],
            ['positioning', 'O que torna a tua loja especial?', 'Explica a proposta da marca numa frase.'],
            ['tone', 'Como queres falar com os clientes?', 'Ex.: Profissional, jovem, descontraído.'],
            ['tagline', 'Mensagem principal da marca', 'Uma frase curta e memorável.'],
          ] as Array<[keyof ForgePilotBrand, string, string]>).map(([key, title, helper]) => <label key={key} className="block">
            <span className="text-sm font-black">{title}</span><span className="mt-1 block text-xs text-text-muted">{helper}</span>
            <textarea rows={key === 'positioning' ? 3 : 2} maxLength={240} value={draft[key]} onChange={event => setDraft(prev => ({ ...prev, [key]: event.target.value }))} className="mt-2 w-full resize-y rounded-2xl border border-border bg-bg-main px-4 py-3 text-sm text-text-primary outline-none transition focus:border-emerald-500" />
          </label>)}</div>
          <button disabled={Boolean(loading)} onClick={() => void handleBrandSave()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{loading === 'brand' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar identidade</button>
        </div>
        <div className="self-start overflow-hidden rounded-[1.5rem] border border-border bg-card-bg">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 text-white">
            <span className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Pré-visualização da marca</span>
            <h3 className="mt-8 text-3xl font-black">{store.name}</h3><p className="mt-3 text-base text-slate-200">{draft.tagline}</p>
            <span className="mt-6 inline-block rounded-full border border-white/20 px-3 py-1 text-xs">{draft.tone}</span>
          </div>
          <div className="p-5"><h4 className="font-black">O teu posicionamento</h4><p className="mt-2 text-sm leading-6 text-text-secondary">{draft.positioning}</p><h4 className="mt-5 font-black">O teu público</h4><p className="mt-2 text-sm leading-6 text-text-secondary">{draft.audience}</p></div>
        </div>
      </section>}

      {!locked && tab === 'history' && <section className="rounded-[1.5rem] border border-border bg-card-bg p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-2xl font-black"><History className="h-6 w-6 text-emerald-500" /> Histórico de melhorias</h2>
        <p className="mt-2 text-sm text-text-secondary">Guarda-se automaticamente uma cópia antes de cada alteração feita no ForgePilot. Podes regressar a uma versão anterior.</p>
        {!history.length ? <div className="mt-7 rounded-xl bg-bg-main p-7 text-center text-sm text-text-secondary">Ainda não guardaste melhorias com o ForgePilot.</div> :
        <div className="mt-6 divide-y divide-border">{history.map((item: { id: string; label: string; date: string }) => <div key={item.id} className="flex flex-col justify-between gap-3 py-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"><Clock3 className="h-5 w-5" /></div><div><h3 className="font-black">{item.label}</h3><p className="mt-1 text-xs text-text-muted">Versão anterior a esta alteração · {new Date(item.date).toLocaleString('pt-PT')}</p></div></div>
          {confirmRestore === item.id ? <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-text-secondary">Repor esta versão?</span><button disabled={Boolean(loading)} onClick={() => void handleRestore(item.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">{loading === 'restore' ? 'A repor...' : 'Sim, repor'}</button><button onClick={() => setConfirmRestore(null)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold">Cancelar</button></div> :
          <button onClick={() => setConfirmRestore(item.id)} className="inline-flex items-center gap-2 self-start rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-bg-main"><RotateCcw className="h-4 w-4" /> Repor versão</button>}
        </div>)}</div>}
      </section>}

      {!locked && tab === 'growth' && <ForgePilotGrowthLab storeId={store.id} />}
      </main></div>

      {preview && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="Comparar melhoria da loja">
        <div className="flex max-h-[94vh] w-full max-w-[1450px] flex-col overflow-hidden rounded-[1.5rem] bg-card-bg shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5"><div><p className="mb-1 text-xs font-black uppercase tracking-wider text-emerald-500">Evolution Studio · Antes de publicar</p><h2 className="text-lg font-black sm:text-xl">{preview.title}</h2><p className="text-xs text-text-secondary">Compara as versões. A tua loja não foi alterada.</p></div><button aria-label="Fechar pré-visualização" onClick={() => { setPreview(null); setError(null); }} className="rounded-xl border border-border p-2 hover:bg-bg-main"><X className="h-5 w-5" /></button></div>
          {error && <p role="alert" className="mx-5 mt-3 rounded-lg bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600">{error}</p>}
          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto bg-bg-main p-4 md:grid-cols-2">
            {[{ title: 'Versão atual', config: store.customization }, { title: 'Melhoria proposta', config: preview.customization }].map((option, index) => <section key={option.title} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card-bg shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="text-sm font-black">{option.title}</h3>{index === 1 && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">Proposta</span>}</div>
              <div className="h-[380px] overflow-y-auto overflow-x-hidden bg-white sm:h-[450px]"><div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '138.8889%' }}><RealStorePreview overview={overview} customization={option.config} /></div></div>
            </section>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4"><p className="max-w-md text-xs leading-5 text-text-secondary">Esta é uma pré-visualização do design e não uma simulação de vendas. Podes desfazer alterações através do Histórico.</p><div className="flex gap-2"><button disabled={Boolean(loading)} onClick={() => setPreview(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Cancelar</button><button disabled={Boolean(loading)} onClick={() => void handleApply()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{loading === 'apply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Aplicar melhoria</button></div></div>
        </div>
      </div>}
    </div>
  );
}
