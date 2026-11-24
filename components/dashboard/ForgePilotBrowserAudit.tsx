'use client';
import {useEffect,useRef,useState} from 'react';
import {ExternalLink,Loader2,MonitorSmartphone,RefreshCw} from 'lucide-react';
type Report={width:number;overflow:number;h1:number;images:number;missingAlt:number;brokenImages:number;smallButtons:number;interactive:number;navigationMs:number|null;paintMs:number|null;measuredAt:string};
const sizes={mobile:390,desktop:1280};
function inspect(frame:HTMLIFrameElement,width:number):Report{
  const doc=frame.contentDocument,win=frame.contentWindow;
  if(!doc||!win||!doc.body)throw Error('Não foi possível ler a página.');
  const rect=(e:Element)=>e.getBoundingClientRect();
  const shown=(e:Element)=>{const r=rect(e);const s=win.getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
  const images=Array.from(doc.images).filter(shown);
  const controls=Array.from(doc.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')).filter(shown);
  const nav=win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
  const paint=win.performance.getEntriesByName('first-contentful-paint')[0];
  return {width:doc.documentElement.clientWidth||width,overflow:Math.max(0,doc.documentElement.scrollWidth-doc.documentElement.clientWidth),h1:Array.from(doc.querySelectorAll('h1')).filter(shown).length,images:images.length,missingAlt:images.filter(i=>!i.hasAttribute('alt')).length,brokenImages:images.filter(i=>i.complete&&i.naturalWidth===0&&!!i.currentSrc).length,smallButtons:controls.filter(e=>{const r=rect(e);return r.width<24||r.height<24;}).length,interactive:controls.length,navigationMs:nav&&nav.loadEventEnd>0?Math.round(nav.loadEventEnd):null,paintMs:paint?Math.round(paint.startTime):null,measuredAt:new Date().toISOString()};
}
export default function ForgePilotBrowserAudit({domain}:{domain:string}){
  const [device,setDevice]=useState<keyof typeof sizes>('mobile');
  const [run,setRun]=useState(0);
  const [report,setReport]=useState<Report|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const frame=useRef<HTMLIFrameElement>(null);
  const generation=useRef(0);
  const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const source='/s/'+encodeURIComponent(domain);
  const width=sizes[device];
  useEffect(()=>()=>{generation.current++;if(timeout.current)clearTimeout(timeout.current);},[]);
  function start(next=device){generation.current++;if(timeout.current)clearTimeout(timeout.current);setDevice(next);setReport(null);setError('');setBusy(true);setRun(x=>x+1);timeout.current=setTimeout(()=>{generation.current++;setBusy(false);setError('A página demorou demasiado a carregar. Abre a loja para confirmar se está disponível.');},20000);}
  function onLoaded(){
    const id=generation.current;
    // Wait for client-rendered catalog content. Only the same-origin public storefront is inspected.
    const begin=Date.now();
    const attempt=()=>{
      if(id!==generation.current||!frame.current)return;
      try{
        const doc=frame.current.contentDocument;
        if(frame.current.contentWindow?.location.pathname!==source)throw Error('Página redirecionada');
        const ready=doc?.querySelector('h1')||doc?.querySelector('main');
        if(!ready&&Date.now()-begin<10000){setTimeout(attempt,500);return;}
        if(!doc?.body||!ready)throw Error('A loja não apresentou conteúdo suficiente.');
        const result=inspect(frame.current,width);
        if(timeout.current)clearTimeout(timeout.current);
        setReport(result);setBusy(false);
      }catch{if(timeout.current)clearTimeout(timeout.current);setError('A loja não pôde ser analisada neste navegador. Confirma a página pública e tenta novamente.');setBusy(false);}
    };
    setTimeout(attempt,1000);
  }
  return <section className="rounded-[1.4rem] border border-border bg-card-bg p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600"><MonitorSmartphone className="h-4 w-4"/> Auditoria visual real</p><h2 className="mt-2 text-xl font-black">Testa a loja no navegador</h2><p className="mt-2 max-w-2xl text-sm text-text-secondary">Verifica o layout renderizado em largura mobile ou desktop, imagens e elementos interativos. Medição local, sem dados fictícios.</p></div><a className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600" href={source} target="_blank" rel="noreferrer">Abrir loja <ExternalLink className="h-3.5 w-3.5"/></a></div>
    <div className="mt-5 flex flex-wrap gap-2">{(['mobile','desktop'] as const).map(d=><button key={d} type="button" disabled={busy} onClick={()=>start(d)} className={'rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 '+(device===d?'border-emerald-500 bg-emerald-500/10':'border-border')}>{d==='mobile'?'Mobile · 390 px':'Desktop · 1280 px'}</button>)}<button type="button" disabled={busy} onClick={()=>start()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>} {busy?'A medir...':'Executar auditoria'}</button></div>
    {run>0&&<div className="mt-4 overflow-x-auto rounded-xl border border-border bg-bg-main p-3"><iframe ref={frame} key={run} title={'Loja pública em '+device} src={source+'?forgepilot-audit=1'} onLoad={onLoaded} width={width} height={580} className="mx-auto block border-0 bg-white" style={{width,maxWidth:'none',pointerEvents:'none'}} tabIndex={-1}/></div>}
    {error&&<p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
    {report&&<><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
      ['Overflow horizontal',report.overflow+' px',report.overflow===0?'Sem overflow detetado':'Revê elementos demasiado largos'],
      ['Cabeçalhos H1',String(report.h1),report.h1===1?'Um título principal visível':'Revê a hierarquia da página'],
      ['Imagens sem atributo alt',String(report.missingAlt)+' / '+report.images,'Não avalia a qualidade do texto alternativo'],
      ['Imagens com erro',String(report.brokenImages),'Imagens visíveis já terminadas'],
      ['Alvos pequenos',report.smallButtons+' / '+report.interactive,'Largura ou altura inferior a 24 px; não é uma avaliação WCAG completa'],
      ['First Contentful Paint',report.paintMs===null?'—':report.paintMs+' ms','Métrica desta navegação local'],
      ['Tempo de carregamento',report.navigationMs===null?'—':report.navigationMs+' ms','Evento load, não tempo total de interação'],
    ].map(([title,value,detail])=><article key={title} className="rounded-xl border border-border bg-bg-main p-4"><p className="text-xs font-bold text-text-muted">{title}</p><p className="mt-1 text-xl font-black tabular-nums">{value}</p><p className="mt-2 text-xs text-text-secondary">{detail}</p></article>)}</div><p className="mt-3 text-xs text-text-muted">Medido em {report.width}px · {new Date(report.measuredAt).toLocaleString('pt-PT')}. A largura simula um viewport, não um telemóvel físico. Os tempos dependem da rede, cache e dispositivo. Não é Lighthouse nem uma auditoria completa de acessibilidade.</p></>}
  </section>;
}
