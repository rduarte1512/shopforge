'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Bot, BrainCircuit, Check, CheckCircle2, ChevronRight, Clock3, Eye, FlaskConical, Loader2, MessageSquare, Palette, Package, RotateCcw, Send, ShieldCheck, ShoppingCart, Sparkles, Trash2, UserRound } from 'lucide-react';
import {
  clearForgePilotChatHistoryAction,
  getForgePilotChatHistoryAction,
  runForgePilotCopilotAction,
  setForgePilotMissionAction,
  type ForgePilotChatEntry,
} from '@/lib/forgepilot-copilot-actions';
import { FORGEPILOT_MISSIONS, isForgePilotMissionId, planForgePilotMission, type ForgePilotMissionId, type MissionPlan } from '@/lib/forgepilot-missions';
import type { ForgePilotAudit, ImprovementId } from '@/lib/forgepilot-engine';

const choices = [
  { id: 'conversion', icon: ShoppingCart, hint: 'Facilitar a compra', gradient: 'from-emerald-500/15 to-teal-500/5' },
  { id: 'design', icon: Palette, hint: 'Uma loja mais apelativa', gradient: 'from-violet-500/15 to-fuchsia-500/5' },
  { id: 'catalog', icon: Package, hint: 'Melhores fichas de produto', gradient: 'from-amber-500/15 to-orange-500/5' },
  { id: 'traffic', icon: FlaskConical, hint: 'Dados em vez de suposições', gradient: 'from-sky-500/15 to-indigo-500/5' },
] as const;
type Props = {
  storeId: string;
  storeName: string;
  audit: ForgePilotAudit;
  version: string;
  activeMission?: string;
  busy: boolean;
  onPreview: (id: ImprovementId) => void;
  onMissionSaved: () => Promise<void>;
  onOpenGrowth: () => void;
};
export default function ForgePilotCopilot({ storeId, storeName, audit, version, activeMission, busy, onPreview, onMissionSaved, onOpenGrowth }: Props) {
  const [goal, setGoal] = useState<ForgePilotMissionId>(isForgePilotMissionId(activeMission) ? activeMission : 'conversion');
  const [replyPlan, setReplyPlan] = useState<MissionPlan | null>(null);
  const [messages, setMessages] = useState<ForgePilotChatEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [savingMission, setSavingMission] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const plan = useMemo(() => replyPlan?.id === goal ? replyPlan : planForgePilotMission(goal, audit), [goal, audit, replyPlan]);
  const progress = plan.total ? Math.round(plan.completed / plan.total * 100) : 100;

  useEffect(() => {
    setGoal(isForgePilotMissionId(activeMission) ? activeMission : 'conversion');
    setReplyPlan(null);
  }, [storeId, activeMission]);
  useEffect(() => {
    let valid = true;
    setLoadingHistory(true);
    setMessages([]);
    void getForgePilotChatHistoryAction(storeId).then(history => {
      if (valid) setMessages(history);
    }).catch(() => {
      if (valid) setNotice('O histórico ainda não está disponível. Podes continuar a usar o assistente.');
    }).finally(() => {
      if (valid) setLoadingHistory(false);
    });
    return () => { valid = false; };
  }, [storeId]);

  async function ask(raw: string, selected: ForgePilotMissionId = goal) {
    const text = raw.trim();
    if (sending || text.length < 3 || text.length > 700) return;
    setSending(true); setError(''); setNotice(''); setQuestion('');
    try {
      const result = await runForgePilotCopilotAction(storeId, text, selected);
      setReplyPlan(result.mission);
      const date = new Date().toISOString();
      setMessages(items => [...items, { id: 'user-' + Date.now(), role: 'user' as const, content: text, date }, { id: 'assistant-' + Date.now(), role: 'assistant' as const, content: result.answer, date }].slice(-24));
      if (!result.saved) setNotice('A resposta está disponível, mas não foi possível guardá-la no histórico.');
    } catch (err) {
      setQuestion(text);
      setError(err instanceof Error ? err.message : 'O assistente não conseguiu responder.');
    } finally { setSending(false); }
  }
  async function startMission() {
    if (savingMission || sending || busy) return;
    setSavingMission(true); setError(''); setNotice('');
    try {
      await setForgePilotMissionAction(storeId, goal, version);
      await onMissionSaved();
      setNotice('Missão guardada para esta loja. Podes trabalhar nas tarefas uma de cada vez.');
      // A análise usa dados atuais e não altera a loja.
      await ask('Ajuda-me a começar a missão: ' + FORGEPILOT_MISSIONS[goal].title, goal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ativar a missão.');
    } finally { setSavingMission(false); }
  }
  async function clearHistory() {
    if (!confirmClear || clearing) return;
    setClearing(true); setError('');
    try {
      await clearForgePilotChatHistoryAction(storeId);
      setMessages([]); setConfirmClear(false); setNotice('Histórico de conversa eliminado desta loja.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível limpar a conversa.');
    } finally { setClearing(false); }
  }

  return <div className="space-y-6">
    <section className="rounded-[1.7rem] border border-border bg-card-bg p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300"><BrainCircuit className="h-6 w-6" /></span>
          <div><p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-600 dark:text-emerald-300">ForgePilot Missions</p><h2 className="mt-1 text-2xl font-black text-text-primary">Escolhe o teu objetivo</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">O ForgePilot cria um plano a partir da tua loja. Tu decides quais as alterações a publicar.</p></div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> Sem publicação automática</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {choices.map(choice => {
          const Icon = choice.icon;
          const id = choice.id as ForgePilotMissionId;
          return <button type="button" key={id} onClick={() => { setGoal(id); setReplyPlan(null); setError(''); }} aria-pressed={goal === id} className={'group min-h-[160px] rounded-2xl border bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ' + choice.gradient + (goal === id ? ' border-emerald-500 ring-2 ring-emerald-500/15' : ' border-border')}>
            <div className="flex items-center justify-between"><span className="rounded-xl bg-card-bg/80 p-2.5 text-text-primary"><Icon className="h-5 w-5" /></span>{goal === id ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}</div>
            <h3 className="mt-5 text-sm font-black text-text-primary">{FORGEPILOT_MISSIONS[id].title}</h3>
            <p className="mt-1 text-xs text-text-secondary">{choice.hint}</p>
          </button>;
        })}
      </div>
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-bg-main p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-black text-text-primary">{plan.title}</h3>{activeMission === goal && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">Missão ativa</span>}</div>
          <p className="mt-1 text-xs leading-5 text-text-secondary">{plan.description}</p>
          <div className="mt-3 flex items-center gap-3"><div className="h-2 max-w-sm flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: progress + '%' }}/></div><span className="text-xs font-bold tabular-nums text-text-secondary">{plan.completed}/{plan.total} verificações</span></div>
        </div>
        <button type="button" onClick={() => void startMission()} disabled={savingMission || sending || busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50">{savingMission ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{activeMission === goal ? 'Atualizar plano' : 'Ativar esta missão'}<ArrowRight className="h-4 w-4" /></button>
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-[1.7rem] border border-border bg-card-bg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600"><Bot className="h-5 w-5" /></span><div><h3 className="font-black">Conversa com o Copilot</h3><p className="text-[11px] text-text-muted">Contexto: {storeName}</p></div></div>
          <div className="flex items-center gap-2">{confirmClear ? <><span className="text-[11px] text-text-muted">Eliminar mensagens?</span><button type="button" onClick={() => void clearHistory()} disabled={clearing} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white">Eliminar</button><button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold">Cancelar</button></> : <button type="button" onClick={() => setConfirmClear(true)} disabled={!messages.length} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-text-secondary disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /> Limpar</button>}</div>
        </div>
        <div aria-live="polite" className="max-h-[540px] min-h-[330px] flex-1 space-y-4 overflow-y-auto bg-bg-main/50 px-4 py-5 sm:px-6">
          {!messages.length && !loadingHistory && <div className="space-y-4">
            <div className="flex items-start gap-3"><span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600"><Bot className="h-4 w-4" /></span><div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-card-bg p-4 text-sm leading-6 text-text-secondary shadow-sm"><p className="font-black text-text-primary">Olá! Sou o teu ForgePilot.</p><p className="mt-1">Posso analisar o estado da tua loja, explicar oportunidades e preparar um plano seguro para avançares.</p></div></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {['Quais são os maiores problemas da minha loja?', 'Como posso melhorar a experiência mobile?', 'O que devo melhorar nos produtos?', 'O que mostram os meus visitantes?'].map(example => <button key={example} type="button" disabled={sending} onClick={() => void ask(example)} className="rounded-xl border border-border bg-card-bg p-3 text-left text-xs font-semibold text-text-secondary transition hover:border-emerald-500/40 hover:text-text-primary">{example}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>)}
            </div>
          </div>}
          {loadingHistory && <p className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> A carregar conversa...</p>}
          {messages.map(item => <div key={item.id} className={'flex items-start gap-2.5 ' + (item.role === 'user' ? 'flex-row-reverse' : '')}>
            <span className={'shrink-0 rounded-xl p-2 ' + (item.role === 'user' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white' : 'bg-emerald-500/10 text-emerald-600')}>{item.role === 'user' ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</span>
            <div className={'max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ' + (item.role === 'user' ? 'rounded-tr-sm bg-slate-800 text-white' : 'rounded-tl-sm bg-card-bg text-text-secondary')}>{item.content}</div>
          </div>)}
          {sending && <div className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> O ForgePilot está a analisar...</div>}
        </div>
        {error && <p role="alert" className="mx-4 mt-3 rounded-lg bg-rose-500/10 p-3 text-xs font-semibold text-rose-600">{error}</p>}
        {notice && <p role="status" className="mx-4 mt-3 rounded-lg bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-200">{notice}</p>}
        <form onSubmit={event => { event.preventDefault(); void ask(question); }} className="border-t border-border p-4 sm:p-5">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-bg-main p-2 focus-within:border-emerald-500">
            <textarea aria-label="Pergunta ao ForgePilot" value={question} onChange={event => setQuestion(event.target.value)} maxLength={700} rows={2} placeholder="Ex.: Como posso tornar a minha loja mais profissional?" onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void ask(question); } }} className="min-h-[60px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"/>
            <button type="submit" title="Enviar mensagem" disabled={sending || question.trim().length < 3} className="mb-1 rounded-xl bg-emerald-600 p-3 text-white transition hover:bg-emerald-700 disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
          </div>
          <p className="mt-2 flex items-center justify-between gap-2 text-[11px] text-text-muted"><span>IA assistiva · As alterações exigem aprovação</span><span>{question.length}/700</span></p>
        </form>
      </section>

      <section className="overflow-hidden rounded-[1.7rem] border border-border bg-card-bg shadow-sm">
        <div className="border-b border-border px-5 py-5 sm:px-6"><div className="flex items-center justify-between gap-2"><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-emerald-600">Plano de ação</p><h3 className="mt-1 text-xl font-black">{plan.title}</h3></div><span className="rounded-xl bg-bg-main px-3 py-2 text-xs font-black tabular-nums">{plan.steps.filter(s => s.status === 'todo').length} por fazer</span></div><p className="mt-2 text-xs leading-5 text-text-secondary">{plan.evidence}</p></div>
        <div className="max-h-[610px] space-y-3 overflow-y-auto p-4 sm:p-5">
          {plan.steps.map((step, i) => <div key={step.id} className={'rounded-2xl border p-4 ' + (step.status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-bg-main/50')}>
            <div className="flex items-start gap-3">
              <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ' + (step.status === 'done' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-card-bg text-text-secondary')}>{step.status === 'done' ? <Check className="h-4 w-4" /> : String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><h4 className="text-sm font-black">{step.title}</h4>{step.status === 'done' && <span className="text-[10px] font-bold text-emerald-600">Concluído</span>}</div><p className="text-xs leading-5 text-text-secondary">{step.reason}</p>
              {step.status !== 'done' && <div className="mt-3">
                {step.action ? <button type="button" disabled={busy || sending} onClick={() => onPreview(step.action as ImprovementId)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Eye className="h-3.5 w-3.5" /> Ver antes de aplicar <ChevronRight className="h-3.5 w-3.5" /></button> :
                step.id.startsWith('traffic-') ? <button type="button" onClick={onOpenGrowth} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card-bg px-3 py-2 text-xs font-bold"><FlaskConical className="h-3.5 w-3.5" /> Abrir Growth Lab</button> :
                step.manualHref ? <Link href={step.manualHref} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card-bg px-3 py-2 text-xs font-bold">Resolver na loja <ArrowRight className="h-3.5 w-3.5" /></Link> : null}
              </div>}
              </div>
            </div>
          </div>)}
          <div className="rounded-xl border border-dashed border-border p-4"><p className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" /> O controlo é sempre teu</p><p className="mt-1 text-xs leading-5 text-text-muted">As tarefas concluídas refletem verificações técnicas. Não são prova de aumento de vendas. As melhorias podem ser revertidas no Histórico.</p></div>
        </div>
      </section>
    </div>
  </div>;
}
