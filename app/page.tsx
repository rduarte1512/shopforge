"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Activity, ArrowRight, ArrowUpRight, BarChart3, Bot, Check, ChevronDown, CreditCard, FlaskConical, Globe, LayoutDashboard, Mail, Menu, Mic, MousePointerClick, Package, Palette, PanelRightOpen, Radio, Rocket, RotateCcw, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Store, Target, TrendingUp, Users, Wallet, WandSparkles, X, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/store';
import { tokenFormat, FORGE_TOKEN_COSTS, FORGE_OPERATION_LABELS, type ForgeOperation } from '@/lib/plans';
import LandingAssistant from '@/components/landing/LandingAssistant';
import { WhyMenu, WhySection } from '@/components/landing/WhyShopForge';

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



type HeroProduct = 'jacket' | 'bag' | 'shoe' | 'bottle';

function HeroProductArt({kind}:{kind:HeroProduct}) {
  const backgrounds={jacket:'#b6c8ba',bag:'#d8c5ae',shoe:'#c8c5dd',bottle:'#b5d8d0'};
  return <svg viewBox="0 0 180 160" className="h-full w-full" aria-hidden="true">
    <rect width="180" height="160" rx="12" fill={backgrounds[kind]}/>
    <circle cx="138" cy="32" r="58" fill="#fff" opacity=".18"/>
    <ellipse cx="90" cy="140" rx="55" ry="8" fill="#14291e" opacity=".13"/>
    {kind==='jacket'&&<g strokeLinejoin="round"><path d="M64 44Q65 13 90 13T116 44L102 60H78Z" fill="#243f36"/><path d="M62 43L35 55 18 125 40 132 57 89 57 142H123V89L140 132 162 125 145 55 118 43 106 56H74Z" fill="#55796b" stroke="#365548" strokeWidth="2"/><path d="M62 43L74 56 90 62 106 56 118 43M90 63V141M60 102H79M101 102H120" fill="none" stroke="#c5d8cc" strokeWidth="2"/><path d="M58 88L88 94V142H58ZM92 94L122 88V142H92Z" fill="#8ca99c"/><path d="M90 63V142" stroke="#273f36" strokeWidth="3"/></g>}
    {kind==='bag'&&<g><path d="M66 56V41Q66 22 90 22T114 41V56" stroke="#624b36" strokeWidth="9" fill="none"/><path d="M46 55H134L146 133Q90 145 34 133Z" fill="#967451" stroke="#624b36" strokeWidth="2"/><path d="M52 56L47 128M128 56L133 128M41 72H139" fill="none" stroke="#bfa381" strokeWidth="2"/><rect x="80" y="80" width="20" height="13" rx="3" fill="#d8bc8a"/><path d="M48 59L59 135M132 59L121 135" stroke="#6d5239" strokeWidth="4" opacity=".6"/></g>}
    {kind==='shoe'&&<g transform="rotate(-10 90 90)"><path d="M23 104Q27 87 55 84L77 40 103 44 111 73 138 91Q155 96 161 110V119H23Z" fill="#69678d" stroke="#4d4b70" strokeWidth="2"/><path d="M64 82L77 49 101 50 112 78 87 92Z" fill="#a6a3c4"/><path d="M77 61L102 64M73 70L107 74M69 79L112 84" stroke="#f4efff" strokeWidth="3" strokeLinecap="round"/><path d="M22 111Q95 120 161 109V124Q95 137 23 125Z" fill="#eee5d6" stroke="#8d879c" strokeWidth="2"/><path d="M118 96L139 106" stroke="#ded8f3" strokeWidth="5" strokeLinecap="round"/></g>}
    {kind==='bottle'&&<g><rect x="69" y="21" width="42" height="26" rx="5" fill="#263d35"/><rect x="56" y="42" width="68" height="94" rx="19" fill="#eae4d6" stroke="#c0b8a8" strokeWidth="2"/><rect x="56" y="73" width="68" height="43" fill="#ecbca9"/><path d="M68 52V65" stroke="#fff" opacity=".7" strokeWidth="5" strokeLinecap="round"/><text x="90" y="91" textAnchor="middle" fontSize="9" fontWeight="700" fill="#624d42">NORTH</text><text x="90" y="103" textAnchor="middle" fontSize="5.5" letterSpacing="1.1" fill="#624d42">DAILY CARE</text></g>}
  </svg>;
}

function LaunchStudio({href,cta}:{href:string;cta:string}){
  const reduce=useReducedMotion();
  const [run,setRun]=useState(0);
  const [theme,setTheme]=useState(0);
  const themes=[{name:'Menta',color:'#a3f5b5'},{name:'Lavanda',color:'#c0b4ff'},{name:'Areia',color:'#efc49e'},{name:'Azul',color:'#9bd9ef'}];
  const accent=themes[theme].color;
  const enter=(delay:number,x=0,y=18)=>({initial:reduce?false:{opacity:0,x,y,scale:.94},animate:{opacity:1,x:0,y:0,scale:1},transition:{duration:reduce?0:.75,delay:reduce?0:delay,ease:[.22,1,.36,1] as const}});
  const panel='relative rounded-2xl border border-white/15 bg-[#182c24]/95 p-3 shadow-[0_18px_50px_-18px_#000] backdrop-blur-md';
  return <section className="relative isolate overflow-hidden bg-[#0b1712] text-[#f5f8f5]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#234332_0%,transparent_66%)]"/>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{backgroundImage:'radial-gradient(circle,rgba(211,242,222,.22) 1px,transparent 1px)',backgroundSize:'30px 30px',maskImage:'linear-gradient(to bottom,transparent,#000 15%,#000 85%,transparent)'}}/>
    <div className="relative mx-auto max-w-[1480px] px-5 pb-7 pt-12 sm:px-8 lg:pb-10 lg:pt-8">
      <div className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[.13em] text-[#a9beb0] sm:text-xs"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{backgroundColor:accent}}/> ShopForge / Studio</span><span className="hidden sm:inline">Construtor visual · demonstração</span><button type="button" onClick={()=>setRun(n=>n+1)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs normal-case tracking-normal text-[#e0eee4] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><RotateCcw size={13}/> Repetir</button></div>
      <div key={run} className="relative mx-auto grid max-w-[1320px] gap-4 pb-8 pt-12 lg:min-h-[650px] lg:block lg:pb-0 lg:pt-[185px] xl:min-h-[700px] xl:pt-[190px]">
        <motion.div {...enter(.1)} className="relative z-10 mx-auto w-full max-w-[780px] text-center lg:w-[66%]">
          <div className="relative border bg-[#b9f2cb]/[.035] px-4 py-7 sm:px-8 sm:py-10 lg:py-11" style={{borderColor:accent}}>
            <span className="absolute -top-5 left-[-1px] rounded-t-md px-2 py-1 text-[10px] font-bold leading-3 text-[#10261c]" style={{backgroundColor:accent}}>Título · H1</span>
            {['-left-1 -top-1','-right-1 -top-1','-left-1 -bottom-1','-right-1 -bottom-1'].map(p=><span key={p} aria-hidden="true" className={'absolute h-2 w-2 border border-[#10261c] '+p} style={{backgroundColor:accent}}/>)}
            <motion.p {...enter(.22)} className="mb-4 text-[10px] font-semibold uppercase tracking-[.19em] sm:text-xs" style={{color:accent}}>A plataforma inteligente de e-commerce</motion.p>
            <motion.h1 {...enter(.3)} className="text-[clamp(2.65rem,5.3vw,5.4rem)] font-semibold leading-[.98] tracking-[-.065em]">A tua visão.<br/> <span style={{color:accent}}>A tua loja.</span></motion.h1>
            <motion.p {...enter(.42)} className="mx-auto mt-5 max-w-[560px] text-sm leading-relaxed text-[#b9cebf] sm:text-lg">Cria, personaliza e faz crescer o teu negócio online com IA, um editor visual e ferramentas de gestão. Tudo no mesmo lugar.</motion.p>
          </div>
          <motion.div {...enter(.52)} className="mt-6 flex flex-wrap items-center justify-center gap-3"><Link href={href} className="inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold text-[#10261c] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" style={{backgroundColor:accent}}>{cta}<ArrowRight size={17}/></Link><a href="#demo" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">Explorar a plataforma <ArrowUpRight size={15}/></a></motion.div>
          <motion.p {...enter(.65)} className="mt-4 text-xs text-[#a9beb0]">Da primeira ideia à tua próxima grande loja.</motion.p>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:contents">
          <motion.div {...enter(.45,-64,22)} className={panel+' lg:absolute lg:left-0 lg:top-7 lg:w-[17%]'}><div className="flex items-center justify-between pb-2 text-[10px] text-[#b8ccbf]"><span>Produto / 01</span><Package size={13}/></div><div className="overflow-hidden rounded-xl"><HeroProductArt kind="jacket"/></div><div className="mt-2 flex justify-between gap-1 text-[10px] font-semibold sm:text-xs"><span>Urban Jacket</span><span>€89</span></div></motion.div>
          <motion.div {...enter(.58,65,-38)} className={panel+' col-span-2 row-start-2 sm:col-span-2 sm:row-start-auto lg:absolute lg:right-0 lg:top-8 lg:w-[34%]'}><div className="mb-2 flex items-center justify-between text-[10px] text-[#b8ccbf]"><span>Catálogo · Nova coleção</span><span style={{color:accent}}>3 produtos</span></div><div className="grid grid-cols-3 gap-2">{([{kind:'bag',name:'Day Bag'},{kind:'shoe',name:'Studio Run'},{kind:'bottle',name:'Daily Care'}] as const).map((p,i)=><motion.div key={p.kind} {...enter(.76+i*.13,0,10)} className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1.5"><span className="absolute left-2 top-2 z-10 grid h-3 w-3 place-items-center rounded-sm bg-[#13291f]"><Check size={9} style={{color:accent}}/></span><HeroProductArt kind={p.kind}/><p className="mt-1 truncate text-[9px] text-[#d6e6db]">{p.name}</p></motion.div>)}</div></motion.div>
          <motion.div {...enter(.72,-50,-15)} className={panel+' lg:absolute lg:left-[2%] lg:top-[52%] lg:z-20 lg:w-[15%]'}><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold text-[#c0d4c5]"><Palette size={14}/> Identidade visual</div><div className="flex flex-wrap gap-2" role="group" aria-label="Cores da demonstração">{themes.map((t,i)=><button key={t.name} type="button" aria-label={t.name} aria-pressed={theme===i} onClick={()=>setTheme(i)} className="grid h-7 w-7 place-items-center rounded-full border border-white/30 text-[#10261c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-8 sm:w-8" style={{backgroundColor:t.color}}>{theme===i&&<Check size={15}/>}</button>)}</div><p className="mt-2 text-[10px] text-[#a9beb0]">Experimenta uma cor</p></motion.div>
          <motion.div {...enter(.88,-45,65)} className={panel+' lg:absolute lg:bottom-1 lg:left-0 lg:w-[23%]'}><div className="mb-3 flex items-center justify-between text-xs font-semibold"><span>Página inicial</span><LayoutDashboard size={15} style={{color:accent}}/></div><div className="space-y-1.5 text-[10px] text-[#c1d3c6] sm:text-xs">{['Cabeçalho','Banner principal','Coleção'].map((label,i)=><div key={label} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-2" style={i===1?{borderColor:accent,color:accent}:undefined}><span className="text-[9px] opacity-70">0{i+1}</span>{label}{i===1&&<MousePointerClick size={13} className="ml-auto"/>}</div>)}<div className="rounded-lg border border-dashed border-white/20 px-2 py-2" style={{color:accent}}>+ Adicionar secção</div></div></motion.div>
          <motion.div {...enter(1.05,55,60)} className={panel+' lg:absolute lg:bottom-0 lg:right-0 lg:w-[19%]'}><div className="mb-2 flex items-center justify-between gap-1 text-[10px] text-[#b8ccbf]"><span>Pré-visualização</span><Globe size={13}/></div><div className="overflow-hidden rounded-xl bg-[#edf1e8] text-[#263d2d]"><div className="flex justify-between px-3 py-2 text-[9px] font-bold tracking-widest">NORTH <ShoppingBag size={12}/></div><div className="mx-2 overflow-hidden rounded-lg"><HeroProductArt kind="bottle"/></div><div className="p-2.5"><p className="text-xs font-bold">Daily Care</p><p className="mt-1 text-[10px]">€29,00</p><div className="mt-2 rounded-md py-1.5 text-center text-[9px] font-bold" style={{backgroundColor:accent}}>Adicionar ao carrinho</div></div></div></motion.div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-[#a9beb0]"><span className="flex items-center gap-2"><Sparkles size={14} style={{color:accent}}/> Criação com IA</span><span className="flex items-center gap-2"><Palette size={14} style={{color:accent}}/> Editor visual</span><span className="flex items-center gap-2"><TrendingUp size={14} style={{color:accent}}/> Gestão e crescimento</span><span className="text-[10px]">Elementos ilustrativos</span></div>
    </div>
  </section>;
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

  return <div className="min-h-screen bg-[#faf9f5] text-[#16291e] selection:bg-[#a3f5b5] selection:text-[#092519]">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1712]/95 text-[#e0eee4] backdrop-blur-xl">
      {!reduce&&<motion.div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-[#a3f5b5]" style={{scaleX:scrollYProgress}}/>}
      <nav className={shell+' flex h-[70px] items-center justify-between gap-4'} aria-label="Navegação principal">
        <Brand/><div className="hidden items-center gap-5 xl:flex"><WhyMenu/>{nav.map(n=><a key={n.href} href={n.href} className="text-sm font-medium text-[#b9cebf] transition hover:text-white">{n.label}</a>)}</div>
        <div className="flex items-center gap-3">{!isSignedIn&&<Link href="/login" className="hidden text-sm font-semibold text-[#b9cebf] hover:text-white sm:block">Entrar</Link>}<Link href={href} className="hidden items-center gap-2 rounded-full bg-[#a3f5b5] px-4 py-2.5 text-sm font-semibold text-[#10261c] hover:bg-[#c5ffd1] sm:inline-flex">{isSignedIn?'Painel':'Começar grátis'}<ArrowRight size={15}/></Link><button type="button" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="mobile-nav" onClick={()=>setMenu(!menu)} className="grid h-10 w-10 place-items-center rounded-lg border border-white/20 xl:hidden">{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
      </nav>
      {menu&&<div id="mobile-nav" className={shell+' grid gap-1 border-t border-white/10 pb-5 pt-3 xl:hidden'}><WhyMenu mobile onNavigate={()=>setMenu(false)}/>{nav.map(n=><a key={n.href} href={n.href} onClick={()=>setMenu(false)} className="rounded-lg p-3 text-sm font-medium hover:bg-white/10">{n.label}</a>)}{!isSignedIn&&<Link href="/login" onClick={()=>setMenu(false)} className="p-3 text-sm">Entrar</Link>}<Link href={href} className={primary}>{cta}<ArrowRight size={16}/></Link></div>}
    </header>
    <main>
      <LaunchStudio href={href} cta={cta}/>
      <WhySection/>

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{SUBSCRIPTION_PLANS.map((p,i)=>{const pro=p.id==='PRO';const total=Math.round(p.price*12*0.8);return <Reveal key={p.id} delay={(i%3)*0.06} className="h-full"><article className={'flex h-full flex-col rounded-[22px] border p-5 '+(pro?'border-[#173b2a] bg-[#173b2a] text-[#f3f8f4]':'border-[#dce6dd] bg-[#ffffff]')}><p className={'mb-3 text-[10px] font-bold uppercase tracking-widest '+(pro?'text-[#a3f5b5]':'text-[#53685a]')}>{pro?'Para crescer com IA':p.id==='STARTER'?'Começar':p.id==='ENTERPRISE'?'Operações globais':'ShopForge'}</p><h3 className="text-xl font-semibold">{p.name}</h3><p className={'mt-2 min-h-[58px] text-xs leading-relaxed '+(pro?'text-[#c1d3c6]':'text-[#53685a]')}>{p.description}</p><div className="mt-4 flex items-baseline gap-1"><span className="text-3xl font-semibold tracking-tight">€{yearly?Math.round(p.price*0.8):p.price}</span><span className={'text-xs '+(pro?'text-[#c1d3c6]':'text-[#53685a]')}>/mês</span></div><p className={'mt-1 min-h-[18px] text-[11px] '+(pro?'text-[#a3f5b5]':'text-[#53685a]')}>{yearly&&p.price>0?'Cobrado €'+total+'/ano':p.price===0?'Plano gratuito':'Faturação mensal'}</p><div className={'mt-4 rounded-xl border p-3 '+(pro?'border-white/20 bg-white/5':'border-[#dce6dd] bg-[#edf3ee]')}><p className="text-[10px] font-semibold uppercase tracking-wider">ForgePilot IA</p><p className="mt-1 text-lg font-semibold">{tokenFormat(p.tokens)} tokens</p><p className="text-xs opacity-80">por mês · por conta</p></div><ul className="mb-6 mt-5 space-y-3">{p.features.map(f=><li key={f} className="flex items-start gap-2 text-xs leading-relaxed"><Check size={15} className={'mt-0.5 shrink-0 '+(pro?'text-[#a3f5b5]':'text-[#258858]')}/>{f}</li>)}</ul><Link href={isSignedIn?(p.price===0?'/dashboard/subscription':'/dashboard/subscription/checkout?plan='+p.id+'&billing='+(yearly?'yearly':'monthly')):'/register'} className={'mt-auto flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold transition '+(pro?'bg-[#a3f5b5] text-[#092519] hover:bg-[#c5ffd1]':'border border-[#b9cebe] text-[#173b2a] hover:bg-[#edf3ee]')}>{p.price===0?'Começar grátis':'Escolher plano'}<ArrowRight size={15}/></Link></article></Reveal>})}</div><p className="mt-5 text-center text-xs leading-relaxed text-[#53685a]">Cada carteira renova no primeiro dia do mês (UTC), inclusive nos planos anuais. Sem acumulação ou cobranças automáticas adicionais.</p><div className="mt-8 rounded-2xl border border-[#dce6dd] bg-[#edf3ee] p-5 sm:p-7"><h3 className="text-xl font-semibold">Como funcionam os tokens ForgePilot?</h3><p className="mt-2 text-sm text-[#53685a]">Créditos de utilização com custo fixo por geração válida, independentes dos tokens técnicos do modelo. Os diagnósticos e as edições manuais não gastam tokens.</p><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{(Object.keys(FORGE_TOKEN_COSTS) as ForgeOperation[]).map(k=><div key={k} className="rounded-xl bg-white p-4"><p className="text-xs text-[#53685a]">{FORGE_OPERATION_LABELS[k]}</p><p className="mt-2 text-xl font-semibold">{FORGE_TOKEN_COSTS[k]} tokens</p></div>)}</div></div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-[#dce6dd] bg-[#ffffff] py-20"><div className={shell+' grid gap-10 lg:grid-cols-[0.75fr_1.25fr]'}><Reveal><Eyebrow>Perguntas frequentes</Eyebrow><h2 className="text-4xl font-semibold tracking-[-0.05em]">Tudo mais claro.</h2><p className="mt-4 max-w-sm leading-relaxed text-[#53685a]">O que precisas de saber antes de começar a utilizar a ShopForge.</p></Reveal><div className="divide-y divide-[#dce6dd] border-y border-[#dce6dd]">{faqs.map(([q,a])=><details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">{q}<ChevronDown size={19} className="shrink-0 text-[#258858] transition-transform group-open:rotate-180 motion-reduce:transition-none"/></summary><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#53685a]">{a}</p></details>)}</div></div></section>
      <section className="bg-[#10261c] py-20 text-[#f3f8f4] sm:py-28"><Reveal className={shell+' text-center'}><span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#a3f5b5] text-[#092519]"><Rocket size={28}/></span><h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl">A tua próxima ideia merece uma grande loja.</h2><p className="mx-auto mt-5 max-w-lg text-[#c1d3c6]">Começa hoje com a ShopForge. Cria, gere, analisa e melhora — tudo no mesmo lugar.</p><Link href={href} className={primary+' mt-8'}>{cta}<ArrowRight size={18}/></Link></Reveal></section>
    </main>
    <footer className="border-t border-[#dce6dd] bg-[#edf2ec] py-10"><div className={shell}><div className="grid gap-8 sm:grid-cols-3"><div><Brand dark/><p className="mt-4 max-w-xs text-sm leading-relaxed text-[#53685a]">A plataforma de comércio e inteligência para quem quer construir um negócio online.</p></div><div><h3 className="mb-4 text-xs font-bold uppercase tracking-widest">Produto</h3><div className="grid gap-3 text-sm text-[#53685a]">{nav.map(n=><a key={n.href} href={n.href} className="hover:text-[#13704b]">{n.label}</a>)}</div></div><div><h3 className="mb-4 text-xs font-bold uppercase tracking-widest">Começar</h3><div className="grid gap-3 text-sm text-[#53685a]"><a href="#workflow">Como funciona</a><a href="#faq">Perguntas frequentes</a><Link href={href}>{cta}</Link>{!isSignedIn&&<Link href="/login">Entrar</Link>}</div></div></div><div className="mt-10 border-t border-[#d4e1d6] pt-5 text-xs text-[#53685a]">© 2026 ShopForge. Todos os direitos reservados.</div></div></footer>
  </div>;
}
