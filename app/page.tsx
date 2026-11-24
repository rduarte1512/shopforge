"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Activity, ArrowRight, ArrowUpRight, BarChart3, Bot, Check, ChevronDown, CreditCard, FlaskConical, Globe, LayoutDashboard, Mail, Menu, Mic, MousePointerClick, Package, Palette, PanelRightOpen, Radio, Rocket, RotateCcw, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Store, Target, TrendingUp, Users, Wallet, WandSparkles, X, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/store';
import LandingAssistant from '@/components/landing/LandingAssistant';

const shell = 'mx-auto w-full max-w-[1240px] px-5 sm:px-8';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#a3f5b5] px-6 py-3.5 font-semibold text-[#092519] transition hover:bg-[#c5ffd1] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#49b878] motion-reduce:transform-none';
const nav = [{label:'Plataforma',href:'#features'},{label:'ForgePilot',href:'#forgepilot'},{label:'Growth Lab',href:'#growth'},{label:'Experimentar IA',href:'#assistant'},{label:'Preçário',href:'#pricing'}];

function Reveal({children, className = '', delay = 0}: {children: ReactNode; className?: string; delay?: number}) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : {opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.12}} transition={{duration:reduce?0:0.55,delay:reduce?0:delay,ease:'easeOut'}}>{children}</motion.div>;
}
function Eyebrow({children,light=false}:{children:ReactNode;light?:boolean}) {
  return <div className={'mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] '+(light?'text-[#a3f5b5]':'text-[#13704b]')}><span className="h-2 w-2 rounded-full bg-current"/>{children}</div>;
}
function Brand({dark=false}:{dark?:boolean}) {
  return <Link href="/" aria-label="ShopForge — início" className={'inline-flex items-center gap-2.5 font-bold tracking-[-0.04em] text-xl '+(dark?'text-[#14251c]':'text-[#f3f8f4]')}><span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#a3f5b5] text-[#103923]"><ShoppingBag size={21} strokeWidth={2.1}/></span>ShopForge<span className="text-[#48ac74]">.</span></Link>;
}

const demoTabs = [
  {name:'Dashboard',icon:LayoutDashboard,heading:'O teu negócio, num só lugar',sub:'Visão geral · últimos 7 dias'},
  {name:'ForgePilot',icon:Bot,heading:'A próxima melhoria começa aqui',sub:'Command Center · recomendações'},
  {name:'Growth Lab',icon:FlaskConical,heading:'Percebe onde perdes clientes',sub:'Funil de conversão · últimos 7 dias'},
  {name:'Editor de loja',icon:Palette,heading:'Uma loja com a tua identidade',sub:'Editor visual · pré-visualização'}
] as const;
const funnel = [{name:'Visitantes',n:'1 240',width:100},{name:'Viram produtos',n:'860',width:69},{name:'Carrinho',n:'184',width:15},{name:'Checkout',n:'92',width:7.5}];

function MiniChart({animate=true}:{animate?:boolean}) {
  const reduce=useReducedMotion();
  return <div className="flex h-24 items-end gap-1.5 sm:h-32 sm:gap-2" aria-label="Gráfico ilustrativo de evolução de vendas" role="img">
    {[24,38,32,47,39,58,49,68,61,75,65,89,76,100].map((h,i)=><div key={i} className="flex h-full flex-1 items-end rounded-t-sm bg-[#e6ede8]"><motion.div initial={reduce||!animate?false:{height:0}} animate={{height:h+'%'}} transition={{duration:reduce?0:0.6,delay:reduce?0:i*0.025}} className="w-full rounded-t-sm bg-gradient-to-t from-[#2c9967] to-[#9ae5ae]"/></div>)}
  </div>;
}
function Funnel({dark=false}:{dark?:boolean}) {
  const reduce=useReducedMotion();
  return <div className="space-y-3">{funnel.map((f,i)=><div key={f.name}><div className={'mb-1.5 flex justify-between text-xs font-medium '+(dark?'text-[#d5e5da]':'text-[#42584a]')}><span>{f.name}</span><span className="tabular-nums font-semibold">{f.n}</span></div><div className={'h-2.5 overflow-hidden rounded-full '+(dark?'bg-white/10':'bg-[#e5eee8]')}><motion.div initial={reduce?false:{width:0}} whileInView={{width:f.width+'%'}} viewport={{once:true}} transition={{duration:reduce?0:0.7,delay:reduce?0:i*0.1}} className={'h-full rounded-full '+(dark?'bg-[#a3f5b5]':'bg-[#258858]')}/></div></div>)}</div>;
}

function ProductDemo() {
  const [tab,setTab]=useState(0);
  const reduce=useReducedMotion();
  return <div className="relative mx-auto max-w-[1080px]">
    <div aria-hidden="true" className="absolute -inset-5 rounded-[36px] bg-[#65d898]/10 blur-3xl"/>
    <div className="relative overflow-hidden rounded-[23px] border border-[#ffffff26] bg-[#f7faf7] text-[#172b20] shadow-[0_30px_100px_-30px_#000]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e9e3] bg-[#ffffff] px-4 py-3 sm:px-6"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f1a19a]"/><span className="h-2.5 w-2.5 rounded-full bg-[#e9cb77]"/><span className="h-2.5 w-2.5 rounded-full bg-[#80c899]"/><span className="ml-2 text-xs font-semibold text-[#506459]">ShopForge / Studio</span></div><span className="rounded-full bg-[#e5eee8] px-2.5 py-1 text-[10px] font-bold text-[#4b6253]">Demonstração ilustrativa</span></div>
      <div className="grid sm:grid-cols-[175px_1fr] lg:grid-cols-[205px_1fr]">
        <div className="flex gap-1 overflow-x-auto border-b border-[#e1e9e3] bg-[#edf3ee] p-2 sm:flex-col sm:gap-2 sm:border-b-0 sm:border-r sm:p-4">
          <div className="mb-4 hidden items-center gap-2 rounded-xl border border-[#dbe7df] bg-[#ffffff] p-3 sm:flex"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#173b2a] text-[#a3f5b5]"><Store size={16}/></span><div className="min-w-0"><p className="truncate text-xs font-bold">Studio North</p><p className="text-[10px] text-[#607467]">Loja de exemplo</p></div></div>
          {demoTabs.map((t,i)=><button key={t.name} type="button" aria-pressed={tab===i} onClick={()=>setTab(i)} className={'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-[#258858] '+(tab===i?'bg-[#173b2a] text-[#d8ffe1]':'text-[#506459] hover:bg-[#dce9df]')}><t.icon size={16}/>{t.name}</button>)}
        </div>
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={reduce?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={reduce?undefined:{opacity:0,y:-5}} transition={{duration:reduce?0:0.2}} className="min-h-[310px] sm:min-h-[340px]">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><p className="mb-1 text-[11px] font-medium text-[#607467]">{demoTabs[tab].sub}</p><h2 className="text-lg font-bold tracking-tight sm:text-2xl">{demoTabs[tab].heading}</h2></div>{tab===0&&<span className="flex items-center gap-1.5 rounded-full bg-[#dff3e4] px-3 py-1 text-[11px] font-bold text-[#24633e]"><span className="h-2 w-2 rounded-full bg-[#2b9e61] motion-safe:animate-pulse"/> 12 online · exemplo</span>}</div>
              {tab===0&&<><div className="grid grid-cols-3 gap-2 sm:gap-3">{[['Vendas','€2 480'],['Pedidos','48'],['Visitantes','1 240']].map(([k,v])=><div key={k} className="min-w-0 rounded-xl border border-[#e0e8e2] bg-[#ffffff] p-2.5 sm:p-4"><p className="text-[10px] font-medium text-[#66776b] sm:text-xs">{k}</p><p className="mt-2 text-base font-bold tracking-tight sm:text-2xl">{v}</p></div>)}</div><div className="mt-3 rounded-xl border border-[#e0e8e2] bg-[#ffffff] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">Evolução das vendas</span><BarChart3 size={16} className="text-[#258858]"/></div><MiniChart/></div></>}
              {tab===1&&<div className="grid gap-3 md:grid-cols-[1.25fr_1fr]"><div className="rounded-2xl border border-[#dce8df] bg-[#ffffff] p-4"><span className="flex items-center gap-2 text-xs font-bold text-[#13704b]"><Sparkles size={16}/> Copilot</span><div className="my-3 rounded-xl bg-[#eff5f0] p-3 text-xs leading-relaxed">Como posso melhorar a minha loja?</div><div className="rounded-xl border border-[#cde5d4] p-3 text-xs leading-relaxed"><b>Começa pela página de produto.</b><p className="mt-1 text-[#506459]">Revê a descrição, as fotografias e a proposta de valor antes de testar um novo título.</p></div><div className="mt-3 flex items-center justify-between rounded-lg bg-[#edf3ee] px-3 py-2 text-[11px] text-[#506459]">Escreve a tua pergunta <Mic size={15}/></div></div><div className="space-y-2">{[['Action Engine','Pré-visualizar alteração'],['Autopilot','Monitorizar oportunidades'],['Experiments','Comparar dois títulos']].map(([k,v])=><div key={k} className="rounded-xl border border-[#e0e8e2] bg-[#ffffff] p-3"><p className="text-xs font-bold">{k}</p><p className="mt-1 text-[11px] text-[#607467]">{v}</p></div>)}</div></div>}
              {tab===2&&<div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-[#e0e8e2] bg-[#ffffff] p-4"><p className="mb-4 text-xs font-bold">Jornada do visitante</p><Funnel/></div><div className="rounded-xl border border-[#e0e8e2] bg-[#ffffff] p-4"><p className="mb-4 flex items-center gap-2 text-xs font-bold text-[#13704b]"><Target size={16}/> Oportunidade</p><p className="text-lg font-bold leading-tight">Melhora a passagem para o carrinho.</p><p className="mt-2 text-xs leading-relaxed text-[#506459]">Neste exemplo, muitos visitantes consultam produtos, mas poucos adicionam artigos ao carrinho.</p><div className="mt-4 rounded-lg bg-[#e7f4e9] p-3 text-xs text-[#24633e]">Sugestão: rever informações de entrega e chamada para ação.</div></div></div>}
              {tab===3&&<div className="grid grid-cols-[1fr_2fr] gap-2 sm:gap-4"><div className="space-y-2 rounded-xl border border-[#e0e8e2] bg-[#ffffff] p-3"><p className="text-xs font-bold">Secções</p>{['Cabeçalho','Banner','Produtos','Rodapé'].map(k=><div key={k} className="rounded-lg bg-[#edf3ee] p-2 text-[11px] text-[#506459]">{k}</div>)}<div className="flex flex-wrap gap-1.5 pt-2">{['#263b30','#dbe4d4','#c78f6c'].map(c=><span key={c} className="h-5 w-5 rounded-full" style={{backgroundColor:c}}/>)}</div></div><div className="overflow-hidden rounded-xl border border-[#e0e8e2] bg-[#ffffff]"><div className="flex justify-between p-3 text-[10px] font-bold"><span>STUDIO NORTH</span><ShoppingBag size={14}/></div><div className="relative overflow-hidden bg-[#dce7da] p-4 sm:p-6"><div className="absolute -right-4 -top-7 h-40 w-40 rounded-full border-[24px] border-[#b3c9b0] opacity-70"/><div className="relative max-w-[170px]"><p className="text-[9px] uppercase tracking-widest">Nova coleção</p><p className="mt-2 text-lg font-bold leading-tight sm:text-2xl">O essencial, reinventado.</p><span className="mt-3 inline-block rounded bg-[#263b30] px-2 py-1.5 text-[9px] text-[#f1f5ef]">Descobrir coleção</span></div></div><div className="grid grid-cols-3 gap-2 p-3">{['#e6d7c8','#c6d7c7','#e4e8dd'].map((c,i)=><div key={c}><div className="grid aspect-square place-items-center rounded-lg" style={{backgroundColor:c}}><Package className="h-5 w-5 text-[#607467]" strokeWidth={1.2}/></div><p className="mt-1 text-[9px]">Artigo {i+1}</p></div>)}</div></div></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
    <p className="mt-4 text-center text-xs text-[#53685a]">Experimenta os quatro separadores. Todos os dados são fictícios.</p>
  </div>;
}

const platform = [
  {icon:WandSparkles,title:'Criação de lojas com IA',copy:'Transforma uma ideia num ponto de partida com estrutura, produtos, textos e identidade adaptados à tua marca.'},
  {icon:Palette,title:'Editor visual sem código',copy:'Personaliza layouts, secções, cores, imagens e temas. Mantém o controlo sobre o resultado final.'},
  {icon:ShoppingCart,title:'Encomendas e checkout',copy:'Organiza pedidos, clientes, carrinhos, métodos de pagamento e opções de envio numa experiência integrada.'},
  {icon:Package,title:'Catálogo e inventário',copy:'Gere produtos, preços, stock, categorias e informação de cada artigo.'},
  {icon:Mail,title:'Marketing e automações',copy:'Prepara promoções, cupões, campanhas de email, recuperação de carrinhos e programas de afiliados.'},
  {icon:Globe,title:'Gestão de várias lojas',copy:'Acompanha diferentes marcas, equipas, configurações e relatórios a partir do mesmo painel.'},
];
const pilot = [
  {icon:Bot,title:'Copilot & Missions',copy:'Conversa sobre a tua loja e transforma recomendações em missões organizadas.'},
  {icon:WandSparkles,title:'Action Engine',copy:'Prepara alterações com IA, compara antes e depois, aprova ou reverte.'},
  {icon:Target,title:'Shop Intelligence',copy:'Descobre problemas e oportunidades através de diagnósticos e auditorias com evidências.'},
  {icon:ShieldCheck,title:'Autopilot',copy:'Monitorização diária de stock, conteúdo e tráfego. Gera alertas sem publicar alterações sozinho.'},
  {icon:FlaskConical,title:'Experiments',copy:'Testa variantes de títulos com tráfego real e acompanha os resultados.'},
  {icon:Sparkles,title:'Marketing Studio',copy:'Gera propostas para anúncios Meta e Google, SEO, emails e redes sociais.'},
  {icon:Wallet,title:'Business Intelligence',copy:'Consulta receitas, custos e margens e simula o impacto dos descontos.'},
  {icon:Palette,title:'Identidade e histórico',copy:'Afina a marca e acompanha as alterações registadas no ForgePilot.'},
];
const faqs = [
  ['Preciso de saber programar?','Não. Podes criar e personalizar uma loja com o editor visual ou começar com a geração por IA, conforme o plano.'],
  ['O ForgePilot altera a minha loja sem autorização?','O Action Engine permite preparar e rever propostas antes de as aplicar. O Autopilot monitoriza e gera alertas, sem publicar alterações ou enviar campanhas automaticamente.'],
  ['O Growth Lab mostra dados reais?','No painel, acompanha o tráfego registado, visitantes recentes e etapas do funil. Os dados dependem da recolha disponível e do consentimento aplicável. Nesta página, os exemplos são ilustrativos.'],
  ['Posso usar a voz no assistente?','Sim, em navegadores compatíveis com reconhecimento de voz. O ditado é convertido em texto que podes rever antes de enviar.'],
  ['Posso gerir mais do que uma loja?','Sim. O número de lojas e produtos depende do plano escolhido. Consulta o preçário para comparar os limites.'],
  ['Como funcionam os pagamentos?','Podes configurar os métodos de pagamento disponibilizados pela tua loja. A disponibilidade e a execução dependem da configuração e das integrações utilizadas.'],
];



function LaunchStudio(){
  const reduce=useReducedMotion();
  const [run,setRun]=useState(0);
  const [complete,setComplete]=useState(false);
  const steps=['Estrutura da loja','Catálogo e identidade','Pré-visualização'];
  return <div className="relative mx-auto max-w-[1060px]">
    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[#506459]"><span className="font-semibold">ShopForge / Editor de loja</span><span>Experiência ilustrativa</span></div>
    <div className="overflow-hidden rounded-xl border border-[#c9d5cd] bg-[#f8faf8] shadow-[0_40px_90px_-45px_#2b4935]">
      <div className="flex items-center justify-between border-b border-[#dbe4dd] bg-[#ffffff] px-3 py-3 sm:px-5"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#245439] text-white"><ShoppingBag size={15}/></span><span className="text-xs font-bold sm:text-sm">ShopForge Studio</span></div><div className="flex items-center gap-2"><span className="hidden text-xs text-[#53685a] sm:block">Loja de exemplo</span><span className="rounded-md bg-[#245439] px-2.5 py-1.5 text-[10px] font-semibold text-white">Pré-visualização</span></div></div>
      <div className="grid sm:grid-cols-[190px_1fr] lg:grid-cols-[225px_1fr]">
        <div className="border-b border-[#dbe4dd] bg-[#f0f4f0] p-4 sm:border-b-0 sm:border-r sm:p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#53685a]">Construção da loja</p>
          <div key={run} className="grid grid-cols-3 gap-1.5 sm:grid-cols-1 sm:gap-2">{steps.map((s,i)=><motion.div key={s} initial={reduce?false:{opacity:.35}} animate={{opacity:1}} transition={{delay:reduce?0:i*.45,duration:reduce?0:.35}} className="flex min-w-0 items-center gap-2 rounded-md border border-[#dce5dd] bg-[#ffffff] px-2 py-2.5 text-[10px] font-medium sm:text-xs"><Check size={14} className="shrink-0 text-[#286346]"/><span>{s}</span></motion.div>)}</div>
          <div className="mt-5 hidden space-y-3 border-t border-[#dbe4dd] pt-4 sm:block"><p className="text-xs font-semibold">Secções</p>{['Cabeçalho','Banner','Coleção','Rodapé'].map(s=><div key={s} className="flex items-center gap-2 text-xs text-[#53685a]"><span className="h-2 w-2 rounded-sm border border-[#8fa498]"/>{s}</div>)}</div>
        </div>
        <div className="min-w-0 p-3 sm:p-5 lg:p-7">
          <motion.div key={run} initial={reduce?false:{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} transition={{delay:reduce?0:.45,duration:reduce?0:.65}} className="overflow-hidden border border-[#d8ddd3] bg-[#f9f8f1]">
            <div className="flex items-center justify-between border-b border-[#e1e3d9] px-4 py-3 sm:px-6"><span className="text-base font-bold tracking-[.24em] text-[#232f26]">NORTH</span><span className="hidden text-[10px] text-[#435247] sm:block">Coleção &nbsp;&nbsp; Sobre a marca</span><ShoppingBag size={15} className="text-[#435247]"/></div>
            <div className="relative isolate grid min-h-[170px] grid-cols-[1.05fr_.95fr] overflow-hidden bg-[#dce7d5] sm:min-h-[240px]">
              <motion.div initial={reduce?false:{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:reduce?0:.85,duration:reduce?0:.55}} className="relative z-10 flex flex-col justify-center p-4 sm:p-8"><span className="text-[9px] font-bold uppercase tracking-[.18em] text-[#53685a]">Coleção 01 / 26</span><p className="mt-3 text-[clamp(1.6rem,3.4vw,3.1rem)] font-semibold leading-[.97] tracking-[-.055em] text-[#263d2d]">Feito para<br/>o teu dia.</p><span className="mt-5 w-fit border-b border-[#42604b] pb-1 text-[10px] font-semibold text-[#263d2d]">Explorar coleção ↗</span></motion.div>
              <motion.div initial={reduce?false:{clipPath:'inset(0 100% 0 0)'}} animate={{clipPath:'inset(0 0 0 0)'}} transition={{delay:reduce?0:.85,duration:reduce?0:.9,ease:'easeOut'}} className="relative isolate overflow-hidden bg-[#829c82]"><div className="absolute -right-[25%] -top-[12%] aspect-square w-[120%] rounded-full border-[28px] border-[#b1c2a8] sm:border-[50px]"/><div className="absolute bottom-0 left-[17%] top-[23%] w-[52%] rounded-t-full bg-[#375943]"/><div className="absolute bottom-0 right-[7%] top-[45%] w-[48%] rounded-t-full bg-[#c3d0b5]"/><div className="absolute bottom-5 left-5 text-[9px] font-bold tracking-[.17em] text-[#f7faf5]">N / 01</div></motion.div>
            </div>
            <motion.div initial={reduce?false:{opacity:0,y:7}} animate={{opacity:1,y:0}} transition={{delay:reduce?0:1.45,duration:reduce?0:.45}} className="grid grid-cols-3 divide-x divide-[#e1e3d9] border-t border-[#e1e3d9]">{['Identidade de marca','Coleções','Checkout'].map((s,i)=><div key={s} className="p-3 text-[9px] font-semibold text-[#435247] sm:p-4 sm:text-xs"><span className="mb-1 block text-[10px] text-[#829c82]">0{i+1}</span>{s}</div>)}</motion.div>
          </motion.div>
          <motion.div key={'status'+run} initial={reduce?false:{opacity:0}} animate={{opacity:1}} transition={{delay:reduce?0:2,duration:reduce?0:.3}} onAnimationComplete={()=>setComplete(true)} className="mt-3 flex items-center justify-between gap-2 text-xs text-[#286346]"><span className="flex items-center gap-1.5"><Check size={15}/> Pré-visualização preparada</span><span className="text-[10px] text-[#65786a]">Loja conceptual</span></motion.div>
        </div>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between gap-4 text-xs text-[#53685a]"><span>Da configuração à pré-visualização, em três etapas.</span>{!reduce&&<button type="button" onClick={()=>{setComplete(false);setRun(n=>n+1);}} aria-label="Repetir animação" className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#c9d5cd] px-3 py-2 font-semibold hover:bg-[#e4ebe3]"><RotateCcw size={14}/> {complete?'Repetir':'Reiniciar'}</button>}</div>
  </div>;
}

function EditorialDemo(){
  const ref=useRef<HTMLElement>(null);
  const reduce=useReducedMotion();
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
  const y=useTransform(scrollYProgress,[0,.5,1],[24,0,-24]);
  return <section id="demo" ref={ref} className="scroll-mt-24 overflow-hidden border-y border-[#d7ddd4] bg-[#e7ece4] py-16 sm:py-24">
    <div className={shell}>
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-4 text-xs font-semibold uppercase tracking-[.16em] text-[#286346]">02 — Por dentro da ShopForge</p><h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">A montra é só o início.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#53685a] sm:text-base">Experimenta o painel, o editor, o ForgePilot e o Growth Lab nesta demonstração interativa.</p></div>
      <motion.div style={reduce?undefined:{y}}><ProductDemo/></motion.div>
    </div>
  </section>;
}

export default function Home() {
  const {isSignedIn}=useAuth();
  const [menu,setMenu]=useState(false);
  const [yearly,setYearly]=useState(false);
  const reduce=useReducedMotion();
  const {scrollYProgress}=useScroll();
  const href=isSignedIn?'/dashboard':'/register';
  const cta=isSignedIn?'Abrir painel':'Criar loja grátis';
  const intro=(delay:number)=>({initial:reduce?false:{opacity:0,y:18},animate:{opacity:1,y:0},transition:{duration:reduce?0:0.65,delay:reduce?0:delay,ease:'easeOut' as const}});

  return <div className="min-h-screen bg-[#faf9f5] text-[#16291e] selection:bg-[#a3f5b5] selection:text-[#092519]">
    <header className="sticky top-0 z-50 border-b border-[#d6d1c4] bg-[#f5f2e9]/95 text-[#252a21] backdrop-blur-xl">
      {!reduce&&<motion.div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-[#a3f5b5]" style={{scaleX:scrollYProgress}}/>}
      <nav className={shell+' flex h-[70px] items-center justify-between gap-4'} aria-label="Navegação principal">
        <Brand dark/><div className="hidden items-center gap-7 xl:flex">{nav.map(n=><a key={n.href} href={n.href} className="text-sm font-medium text-[#424c3e] transition hover:text-[#286346]">{n.label}</a>)}</div>
        <div className="flex items-center gap-3">{!isSignedIn&&<Link href="/login" className="hidden text-sm font-semibold text-[#424c3e] hover:text-[#286346] sm:block">Entrar</Link>}<Link href={href} className="hidden items-center gap-2 rounded-[5px] bg-[#245439] px-4 py-2.5 text-sm font-semibold text-[#f8f6ec] hover:bg-[#173d29] sm:inline-flex">{isSignedIn?'Painel':'Começar grátis'}<ArrowRight size={15}/></Link><button type="button" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="mobile-nav" onClick={()=>setMenu(!menu)} className="grid h-10 w-10 place-items-center rounded-lg border border-[#c8c4b9] xl:hidden">{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
      </nav>
      {menu&&<div id="mobile-nav" className={shell+' grid gap-1 border-t border-[#d6d1c4] pb-5 pt-3 xl:hidden'}>{nav.map(n=><a key={n.href} href={n.href} onClick={()=>setMenu(false)} className="rounded-lg p-3 text-sm font-medium hover:bg-[#e7e6da]">{n.label}</a>)}{!isSignedIn&&<Link href="/login" onClick={()=>setMenu(false)} className="p-3 text-sm">Entrar</Link>}<Link href={href} className={primary}>{cta}<ArrowRight size={16}/></Link></div>}
    </header>
    <main>
      <section className="relative overflow-hidden bg-[#f4f7f2] text-[#17291e]">
        <div className={shell+' pb-12 pt-16 sm:pb-20 sm:pt-24'}>
          <div className="mx-auto mb-12 max-w-[880px] text-center">
            <motion.p {...intro(0)} className="mb-5 text-xs font-semibold uppercase tracking-[.16em] text-[#286346]">A tua plataforma de e-commerce</motion.p>
            <motion.h1 {...intro(.08)} className="text-[clamp(2.85rem,6.7vw,6.2rem)] font-semibold leading-[.99] tracking-[-.065em]">Constrói a tua loja.<br className="hidden sm:block"/> Faz crescer o teu negócio.</motion.h1>
            <motion.p {...intro(.17)} className="mx-auto mt-6 max-w-[580px] text-base leading-relaxed text-[#53685a] sm:text-lg">Criação de lojas, gestão de vendas e inteligência para tomar melhores decisões. Tudo o que precisas para transformar uma ideia num negócio online.</motion.p>
            <motion.div {...intro(.24)} className="mt-7 flex flex-wrap items-center justify-center gap-4"><Link href={href} className="inline-flex items-center gap-3 rounded-lg bg-[#245439] px-6 py-3.5 font-semibold text-white hover:bg-[#173b2a]">{cta}<ArrowRight size={18}/></Link><a href="#demo" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[#34523d] hover:underline">Conhecer a plataforma <ArrowUpRight size={15}/></a></motion.div>
          </div>
          <motion.div {...intro(.3)}><LaunchStudio/></motion.div>
        </div>
      </section>

      <section id="features" className={shell+' scroll-mt-24 py-20 sm:py-28'}>
        <Reveal className="mb-12 grid gap-5 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div><p className="mb-4 text-xs font-semibold uppercase tracking-[.14em] text-[#286346]">01 — A plataforma</p><h2 className="font-[Arial,Helvetica,sans-serif] text-4xl font-bold leading-[1.06] tracking-[-.045em] sm:text-6xl">Da criação à gestão.<br/><span className="text-[#286346]">Sem complicações.</span></h2></div><p className="max-w-md text-base leading-relaxed text-[#53685a] lg:justify-self-end">Uma plataforma que acompanha cada fase do negócio, desde a criação da montra até à gestão diária e ao crescimento.</p>
        </Reveal>
        <div className="grid gap-x-10 border-t border-[#d5ddd3] md:grid-cols-2 lg:gap-x-16">{platform.map(({icon:Icon,title,copy},i)=><Reveal key={title} delay={(i%2)*.08}><div className="group grid h-full grid-cols-[42px_1fr] gap-4 border-b border-[#d5ddd3] py-7 sm:grid-cols-[52px_1fr] sm:py-9"><div><span className="grid h-10 w-10 place-items-center rounded-lg border border-[#c9d8cc] text-[#286346]"><Icon size={21} strokeWidth={1.65}/></span><span className="mt-3 block text-xs font-medium tabular-nums text-[#687e6b]">0{i+1}</span></div><div><h3 className="font-[Arial,Helvetica,sans-serif] text-xl font-bold tracking-[-.025em] sm:text-2xl">{title}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#53685a] sm:text-base">{copy}</p></div></div></Reveal>)}</div>
        <a href="#demo" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#286346] hover:underline">Explorar a plataforma <ArrowUpRight size={15}/></a>
      </section>

      <EditorialDemo/>

      <section id="forgepilot" className="scroll-mt-20 bg-[#10261c] py-20 text-[#f3f8f4] sm:py-28">
        <div className={shell}>
          <Reveal className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><Eyebrow light>ForgePilot / Command Center</Eyebrow><h2 className="text-4xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl">O teu copiloto.<br/><span className="text-[#a3f5b5]">A tua próxima decisão.</span></h2><p className="mt-6 max-w-xl text-lg leading-relaxed text-[#c1d3c6]">Mais do que gerar conteúdo: analisa a tua loja, identifica prioridades, prepara mudanças e ajuda-te a acompanhar o impacto. Tu manténs o controlo.</p><Link href={isSignedIn?'/dashboard/forgepilot':'/register'} className={primary+' mt-7'}>Explorar ForgePilot<ArrowUpRight size={17}/></Link></div>
          <div className="rounded-[24px] border border-white/15 bg-[#193729] p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#a3f5b5] text-[#092519]"><Bot size={23}/></span><div><p className="font-semibold">ForgePilot</p><p className="text-xs text-[#acc3b2]">Exemplo de fluxo de melhoria</p></div></div>{[{n:'01',title:'Diagnosticar',desc:'Encontra uma oportunidade na loja.'},{n:'02',title:'Preparar',desc:'Cria uma proposta e revê o antes e depois.'},{n:'03',title:'Decidir',desc:'Aprova a alteração ou mantém a versão atual.'}].map((s,i)=><motion.div key={s.n} initial={reduce?false:{opacity:0,x:12}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:reduce?0:0.4,delay:reduce?0:i*0.12}} className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 last:mb-0"><span className="text-xs font-bold text-[#a3f5b5]">{s.n}</span><div><p className="text-sm font-semibold">{s.title}</p><p className="mt-1 text-xs text-[#b9ccbd]">{s.desc}</p></div><Check size={16} className="ml-auto shrink-0 text-[#a3f5b5]"/></motion.div>)}</div></Reveal>
          <div className="mt-14 grid border-t border-white/20 sm:grid-cols-2 lg:grid-cols-4">{pilot.map(({icon:Icon,title,copy},i)=><Reveal key={title} delay={(i%4)*0.05}><div className="h-full border-b border-white/20 p-5 transition hover:bg-white/[0.045] sm:px-5 sm:py-7"><Icon size={21} strokeWidth={1.7} className="mb-5 text-[#a3f5b5]"/><h3 className="mb-2 font-semibold">{title}</h3><p className="text-sm leading-relaxed text-[#bbcec0]">{copy}</p></div></Reveal>)}</div>
        </div>
      </section>

      <section id="growth" className={shell+' scroll-mt-24 py-20 sm:py-28'}>
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <Reveal><Eyebrow>Growth Lab</Eyebrow><h2 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Conhece os teus clientes.</h2><p className="mt-4 max-w-md leading-relaxed text-[#53685a]">Acompanha visitantes, páginas vistas, atividade recente e o funil de compra. Descobre onde atuar primeiro com recomendações baseadas nos dados disponíveis.</p><div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-[#24633e]"><span className="flex items-center gap-1"><Radio size={15}/> Visitantes ativos</span><span className="flex items-center gap-1"><MousePointerClick size={15}/> Comportamento</span><span className="flex items-center gap-1"><BarChart3 size={15}/> Relatórios</span></div></Reveal>
          <Reveal delay={.1} className="rounded-xl border border-[#dce6dd] bg-[#ffffff] p-6 sm:p-8"><div className="mb-6 flex items-center justify-between gap-2"><p className="font-semibold">Funil de conversão</p><span className="text-[11px] text-[#607467]">Dados de exemplo</span></div><Funnel/></Reveal>
        </div>
      </section>
      <section id="assistant" className="scroll-mt-24 border-y border-[#d8e4da] bg-[#e7efe5] py-16 sm:py-24"><div className={shell+' grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-16'}>
        <Reveal><Eyebrow>Experimenta a inteligência artificial</Eyebrow><h2 className="text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-6xl">Uma pergunta pode ser o início.</h2><p className="mt-5 max-w-md text-base leading-relaxed text-[#45604e] sm:text-lg">Conta ao assistente o que queres vender ou como gostarias de melhorar a tua loja. Recebe uma resposta real, antes mesmo de criar uma conta.</p><p className="mt-5 max-w-md text-sm leading-relaxed text-[#53685a]">No painel ShopForge, tens também um assistente lateral ajustável e ditado por voz em navegadores compatíveis.</p></Reveal>
        <Reveal delay={.1}><LandingAssistant/></Reveal>
      </div></section>

      <section id="workflow" className="scroll-mt-24 border-y border-[#dce6dd] bg-[#edf2ec] py-16 sm:py-24"><div className={shell}><Reveal><Eyebrow>Do zero ao crescimento</Eyebrow><h2 className="mb-10 max-w-2xl text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">O teu negócio, passo a passo.</h2></Reveal><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{icon:Sparkles,title:'Imagina',copy:'Escolhe o nicho, a identidade e o conceito da loja.'},{icon:Palette,title:'Constrói',copy:'Usa a IA ou o editor visual para personalizar a experiência.'},{icon:CreditCard,title:'Lança',copy:'Organiza o catálogo, configura o checkout e publica a loja.'},{icon:TrendingUp,title:'Evolui',copy:'Usa o ForgePilot e os dados para priorizar melhorias.'}].map(({icon:Icon,title,copy},i)=><Reveal key={title} delay={i*0.07}><div className="h-full border-t border-[#b8cfbe] pt-5"><div className="mb-5 flex items-center justify-between text-[#258858]"><Icon size={24} strokeWidth={1.6}/><span className="text-xs font-bold">0{i+1}</span></div><h3 className="mb-2 text-xl font-semibold">{title}</h3><p className="text-sm leading-relaxed text-[#53685a]">{copy}</p></div></Reveal>)}</div></div></section>

      <section id="pricing" className={shell+' scroll-mt-24 py-20 sm:py-28'}>
        <Reveal className="mx-auto mb-10 max-w-2xl text-center"><div className="flex justify-center"><Eyebrow>Preçário</Eyebrow></div><h2 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Um plano para cada fase.</h2><p className="mt-4 text-[#53685a]">Começa com o essencial e escolhe as ferramentas certas à medida que o negócio cresce.</p><div className="mt-6 inline-flex gap-1 rounded-xl border border-[#dce6dd] bg-[#edf2ec] p-1" role="group" aria-label="Ciclo de faturação">{[false,true].map(y=><button key={String(y)} type="button" aria-pressed={yearly===y} onClick={()=>setYearly(y)} className={'rounded-lg px-4 py-2 text-sm font-semibold transition '+(yearly===y?'bg-[#173b2a] text-[#f1f8f2]':'text-[#53685a] hover:bg-[#dce6dd]')}>{y?'Anual −20%':'Mensal'}</button>)}</div></Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{SUBSCRIPTION_PLANS.map((p,i)=>{const pro=p.id==='PRO';const total=Math.round(p.price*12*0.8);return <Reveal key={p.id} delay={(i%3)*0.06} className="h-full"><article className={'flex h-full flex-col rounded-[22px] border p-5 '+(pro?'border-[#173b2a] bg-[#173b2a] text-[#f3f8f4]':'border-[#dce6dd] bg-[#ffffff]')}><p className={'mb-3 text-[10px] font-bold uppercase tracking-widest '+(pro?'text-[#a3f5b5]':'text-[#53685a]')}>{pro?'Para crescer com IA':p.id==='STARTER'?'Começar':p.id==='ENTERPRISE'?'Operações globais':'ShopForge'}</p><h3 className="text-xl font-semibold">{p.name}</h3><p className={'mt-2 min-h-[58px] text-xs leading-relaxed '+(pro?'text-[#c1d3c6]':'text-[#53685a]')}>{p.description}</p><div className="mt-4 flex items-baseline gap-1"><span className="text-3xl font-semibold tracking-tight">€{yearly?Math.round(p.price*0.8):p.price}</span><span className={'text-xs '+(pro?'text-[#c1d3c6]':'text-[#53685a]')}>/mês</span></div><p className={'mt-1 min-h-[18px] text-[11px] '+(pro?'text-[#a3f5b5]':'text-[#53685a]')}>{yearly&&p.price>0?'Cobrado €'+total+'/ano':p.price===0?'Plano gratuito':'Faturação mensal'}</p><ul className="mb-6 mt-5 space-y-3">{p.features.map(f=><li key={f} className="flex items-start gap-2 text-xs leading-relaxed"><Check size={15} className={'mt-0.5 shrink-0 '+(pro?'text-[#a3f5b5]':'text-[#258858]')}/>{f}</li>)}</ul><Link href={isSignedIn?(p.price===0?'/dashboard/subscription':'/dashboard/subscription/checkout?plan='+p.id+'&billing='+(yearly?'yearly':'monthly')):'/register'} className={'mt-auto flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold transition '+(pro?'bg-[#a3f5b5] text-[#092519] hover:bg-[#c5ffd1]':'border border-[#b9cebe] text-[#173b2a] hover:bg-[#edf3ee]')}>{p.price===0?'Começar grátis':'Escolher plano'}<ArrowRight size={15}/></Link></article></Reveal>})}</div><p className="mt-5 text-center text-xs leading-relaxed text-[#53685a]">As funcionalidades e os limites dependem do plano. Os valores mensais anuais são arredondados; o total anual é indicado em cada cartão.</p>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-[#dce6dd] bg-[#ffffff] py-20"><div className={shell+' grid gap-10 lg:grid-cols-[0.75fr_1.25fr]'}><Reveal><Eyebrow>Perguntas frequentes</Eyebrow><h2 className="text-4xl font-semibold tracking-[-0.05em]">Tudo mais claro.</h2><p className="mt-4 max-w-sm leading-relaxed text-[#53685a]">O que precisas de saber antes de começar a utilizar a ShopForge.</p></Reveal><div className="divide-y divide-[#dce6dd] border-y border-[#dce6dd]">{faqs.map(([q,a])=><details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">{q}<ChevronDown size={19} className="shrink-0 text-[#258858] transition-transform group-open:rotate-180 motion-reduce:transition-none"/></summary><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#53685a]">{a}</p></details>)}</div></div></section>
      <section className="bg-[#10261c] py-20 text-[#f3f8f4] sm:py-28"><Reveal className={shell+' text-center'}><span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#a3f5b5] text-[#092519]"><Rocket size={28}/></span><h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl">A tua próxima ideia merece uma grande loja.</h2><p className="mx-auto mt-5 max-w-lg text-[#c1d3c6]">Começa hoje com a ShopForge. Cria, gere, analisa e melhora — tudo no mesmo lugar.</p><Link href={href} className={primary+' mt-8'}>{cta}<ArrowRight size={18}/></Link></Reveal></section>
    </main>
    <footer className="border-t border-[#dce6dd] bg-[#edf2ec] py-10"><div className={shell}><div className="grid gap-8 sm:grid-cols-3"><div><Brand dark/><p className="mt-4 max-w-xs text-sm leading-relaxed text-[#53685a]">A plataforma de comércio e inteligência para quem quer construir um negócio online.</p></div><div><h3 className="mb-4 text-xs font-bold uppercase tracking-widest">Produto</h3><div className="grid gap-3 text-sm text-[#53685a]">{nav.map(n=><a key={n.href} href={n.href} className="hover:text-[#13704b]">{n.label}</a>)}</div></div><div><h3 className="mb-4 text-xs font-bold uppercase tracking-widest">Começar</h3><div className="grid gap-3 text-sm text-[#53685a]"><a href="#workflow">Como funciona</a><a href="#faq">Perguntas frequentes</a><Link href={href}>{cta}</Link>{!isSignedIn&&<Link href="/login">Entrar</Link>}</div></div></div><div className="mt-10 border-t border-[#d4e1d6] pt-5 text-xs text-[#53685a]">© 2026 ShopForge. Todos os direitos reservados.</div></div></footer>
  </div>;
}
