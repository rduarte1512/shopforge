'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Check,Eye,Loader2,Plus,Sparkles,Trash2} from 'lucide-react';
import {applyForgePilotBatchAction,generateForgePilotBatchAction,previewForgePilotBatchAction} from '@/lib/forgepilot-batch-actions';
import {CHANGE_LABELS,type ChangeInput,type ChangeKind} from '@/lib/forgepilot-pro';
import type {BatchPreview} from '@/lib/forgepilot-batch';
const field='w-full rounded-xl border border-border bg-bg-main px-3 py-2 text-sm outline-none focus:border-emerald-500';
const primary='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40';
const secondary='inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-bg-main disabled:opacity-40';
export default function ForgePilotBatch({storeId,brief,products,onApplied}:{storeId:string;brief:string;products:{id:string;name:string}[];onApplied:()=>Promise<void>}){
  const [objective,setObjective]=useState(brief);
  const [changes,setChanges]=useState<ChangeInput[]>([]);
  const [summary,setSummary]=useState('');
  const [preview,setPreview]=useState<BatchPreview|null>(null);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  useEffect(()=>{if(brief){setObjective(brief);setPreview(null);}},[brief]);
  const revise=(next:ChangeInput[])=>{setChanges(next);setPreview(null);setError('');setNotice('');};
  async function run(key:string,fn:()=>Promise<void>){
    if(busy)return;setBusy(key);setError('');setNotice('');
    try{await fn();}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy('');}
  }
  return <section className="space-y-4 rounded-[1.4rem] border border-emerald-500/25 bg-card-bg p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Action Engine · Propostas em lote</span><h2 className="mt-1 text-xl font-black">Um objetivo, várias melhorias</h2><p className="mt-1 text-sm text-text-secondary">Prepara até seis alterações. Nada é publicado até aprovares a proposta completa.</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">{changes.length}/6 alterações</span></div>
    <label className="block text-xs font-bold">Objetivo<textarea className={field+' mt-2'} rows={3} value={objective} maxLength={700} disabled={!!busy} onChange={e=>{setObjective(e.target.value);setPreview(null);}} placeholder="Ex.: Torna a loja mais premium, melhora o título do banner e as descrições dos produtos."/></label>
    <div className="flex flex-wrap gap-2"><button className={primary} disabled={!!busy||objective.trim().length<3} onClick={()=>void run('generate',async()=>{const p=await generateForgePilotBatchAction(storeId,objective);revise(p.changes);setSummary(p.summary);})}>{busy==='generate'?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>} Gerar plano com IA</button><button className={secondary} disabled={!!busy||changes.length>=6} onClick={()=>revise([...changes,{kind:'hero',value:''}])}><Plus className="h-4 w-4"/> Adicionar manualmente</button></div>
    {summary&&<p className="rounded-xl bg-bg-main p-3 text-sm text-text-secondary">{summary}</p>}
    {changes.map((c,i)=><div key={i} className="space-y-3 rounded-xl border border-border bg-bg-main/50 p-4">
      <div className="flex items-center justify-between"><span className="text-xs font-black text-text-muted">ALTERAÇÃO {i+1}</span><button type="button" aria-label={'Remover alteração '+(i+1)} disabled={!!busy} onClick={()=>revise(changes.filter((_,j)=>i!==j))}><Trash2 className="h-4 w-4 text-text-muted hover:text-rose-500"/></button></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Tipo<select className={field+' mt-1'} disabled={!!busy} value={c.kind} onChange={e=>{const kind=e.target.value as ChangeKind;revise(changes.map((x,j)=>j===i?{kind,value:'',...(kind.startsWith('product-')?{targetId:products[0]?.id||''}:{})}:x));}}>{Object.entries(CHANGE_LABELS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      {c.kind.startsWith('product-')&&<label className="text-xs font-bold">Produto<select className={field+' mt-1'} disabled={!!busy} value={c.targetId||''} onChange={e=>revise(changes.map((x,j)=>j===i?{...x,targetId:e.target.value}:x))}><option value="">Selecionar</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</div>
      <label className="block text-xs font-bold">Novo valor<textarea className={field+' mt-1'} rows={c.kind==='product-description'?4:2} maxLength={c.kind==='product-description'?1800:c.kind==='accent'?7:120} disabled={!!busy} value={c.value} onChange={e=>revise(changes.map((x,j)=>j===i?{...x,value:e.target.value}:x))}/></label>
    </div>)}
    {!!changes.length&&<button className={primary} disabled={!!busy||changes.some(c=>!c.value.trim()||c.kind.startsWith('product-')&&!c.targetId)} onClick={()=>void run('preview',async()=>{setPreview(await previewForgePilotBatchAction(storeId,changes));})}>{busy==='preview'?<Loader2 className="h-4 w-4 animate-spin"/>:<Eye className="h-4 w-4"/>} Rever proposta completa</button>}
    {preview&&<div className="space-y-3 rounded-2xl border border-emerald-500/30 p-4"><h3 className="font-black">Confirma todas as alterações</h3>{preview.items.map((item,i)=><div key={i} className="border-b border-border pb-3"><p className="mb-2 text-sm font-bold">{item.label}</p><div className="grid gap-2 sm:grid-cols-2">{[['Antes',item.before],['Depois',item.after]].map(([label,value])=><div key={label} className="min-w-0 rounded-lg bg-bg-main p-3"><p className="text-xs font-bold text-text-muted">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{value||'Sem conteúdo'}</p></div>)}</div></div>)}<p className="text-xs text-text-muted">A operação é atómica: todas as alterações são aplicadas ou nenhuma é aplicada. Para reverter alterações de design, começa pelas mais recentes.</p><div className="flex flex-wrap gap-2"><button className={primary} disabled={!!busy} onClick={()=>void run('apply',async()=>{const r=await applyForgePilotBatchAction(storeId,preview.items.map(i=>i.input),preview.version);setPreview(null);setChanges([]);setSummary('');setNotice(r.count+' alterações publicadas.');await onApplied();})}>{busy==='apply'?<Loader2 className="h-4 w-4 animate-spin"/>:<Check className="h-4 w-4"/>} Aprovar e publicar {preview.items.length} alterações</button><button className={secondary} disabled={!!busy} onClick={()=>setPreview(null)}>Continuar a editar</button></div></div>}
    {error&&<p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600">{notice}</p>}
  </section>;
}
