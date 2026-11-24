"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Activity, ArrowRight, ArrowUpRight, BarChart3, Bot, Check, ChevronDown, CreditCard, FlaskConical, Globe, LayoutDashboard, Mail, Menu, Mic, MousePointerClick, Package, Palette, PanelRightOpen, Radio, Rocket, RotateCcw, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Store, Target, TrendingUp, Users, Wallet, WandSparkles, X, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/store';

const shell = 'mx-auto w-full max-w-[1240px] px-5 sm:px-8';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#a3f5b5] px-6 py-3.5 font-semibold text-[#092519] transition hover:bg-[#c5ffd1] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#49b878] motion-reduce:transform-none';
const nav = [{label:'Plataforma',href:'#features'},{label:'ForgePilot',href:'#forgepilot'},{label:'Growth Lab',href:'#growth'},{label:'Preçário',href:'#pricing'}];

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


/** Local, original editorial artwork. No external photos, videos or API calls. */
function ObjectStudy({kind='chair',className=''}:{kind?:'chair'|'lamp'|'vase';className?:string}) {
  return <svg viewBox="0 0 320 320" className={className} aria-hidden="true">
    <ellipse cx="165" cy="274" rx="105" ry="13" fill="#29291f" opacity=".09"/>
    {kind==='chair'&&<g strokeLinejoin="round">
      <path d="M78 157 L66 269 M230 158 L244 269 M102 202 L99 270 M211 205 L209 270" stroke="#513d2b" strokeWidth="11" strokeLinecap="round"/>
      <path d="M89 91 Q86 56 119 49 L215 49 Q237 53 237 80 L234 163 L93 163 Z" fill="#76543d"/>
      <path d="M100 85 Q98 65 124 63 L209 63 Q223 64 223 83 L220 153 L104 153 Z" fill="#b28a61"/>
      {Array.from({length:12},(_,i)=><path key={i} d={'M'+(111+i*9)+' 72 V145'} stroke="#e3c6a0" strokeWidth="1.3" opacity=".68"/>)}
      <path d="M76 153 Q73 145 90 142 L225 142 Q240 145 244 156 L231 203 Q225 214 208 215 L111 215 Q94 215 88 203 Z" fill="#68503a"/>
      <path d="M91 148 Q157 134 224 148 L230 177 Q228 191 210 192 H109 Q93 191 89 178 Z" fill="#d2b99a"/>
      <path d="M89 178 Q161 191 230 177 L225 195 Q218 201 209 201 H111 Q96 200 91 191 Z" fill="#b99c7b"/>
    </g>}
    {kind==='lamp'&&<g><path d="M160 92 V257" stroke="#4c4437" strokeWidth="8"/><ellipse cx="160" cy="263" rx="49" ry="9" fill="#4c4437"/><path d="M104 65 Q160 42 216 65 L244 139 Q160 160 76 139 Z" fill="#c39561"/><path d="M104 65 Q160 84 216 65" fill="none" stroke="#e3c79d" strokeWidth="3"/><ellipse cx="160" cy="139" rx="84" ry="10" fill="#a7784b"/><path d="M113 71 L94 136 M134 77 L124 144 M186 77 L196 144 M207 71 L226 136" stroke="#e9cba2" strokeWidth="2" opacity=".75"/></g>}
    {kind==='vase'&&<g><path d="M136 53 H184 L180 100 Q232 135 232 195 Q232 257 160 263 Q88 257 88 195 Q88 135 140 100 Z" fill="#a85f44"/><path d="M149 63 L148 106 Q105 145 105 194 Q105 239 141 248" fill="none" stroke="#cf9574" strokeWidth="8" opacity=".7"/><ellipse cx="160" cy="53" rx="24" ry="8" fill="#70412f"/><path d="M137 57 Q160 62 183 57" stroke="#d7a38b" fill="none" strokeWidth="2"/></g>}
  </svg>;
}

const launchScenes=[
  {title:'Começa pela ideia',detail:'A identidade da tua marca.'},
  {title:'Constrói a experiência',detail:'O layout, os produtos e os detalhes.'},
  {title:'Abre a tua loja',detail:'Da ideia a uma montra online.'},
] as const;

function LaunchFilm(){
  const reduce=useReducedMotion();
  const [take,setTake]=useState(0);
  const [stage,setStage]=useState(0);
  const [playing,setPlaying]=useState(true);
  const [selected,setSelected]=useState(false);
  const current=reduce&&!selected?2:stage;
  function replay(){setStage(0);setSelected(false);setPlaying(true);setTake(t=>t+1);}
  function choose(i:number){setStage(i);setPlaying(false);setSelected(true);}
  return <div className="min-w-0">
    <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#655f53] sm:text-xs"><span>Uma loja, do zero.</span><span>01 / Studio Forma</span></div>
    <div className="relative overflow-hidden rounded-[5px] border border-[#c8c4b9] bg-[#e4dfd4] shadow-[0_30px_70px_-45px_#39382e]">
      <div className="flex h-9 items-center gap-1.5 border-b border-[#d9d4ca] bg-[#f8f6ef] px-3 sm:px-4"><span className="h-2 w-2 rounded-full bg-[#bf786d]"/><span className="h-2 w-2 rounded-full bg-[#d5b576]"/><span className="h-2 w-2 rounded-full bg-[#91ad8c]"/><span className="mx-auto truncate rounded-sm bg-[#ece8de] px-5 py-1 text-[9px] text-[#655f53] sm:text-[10px]">studioforma / demonstração</span><span className="hidden h-2 w-8 sm:block"/></div>
      <div className="relative overflow-hidden bg-[#f7f3eb] text-[#302c25]">
        <div className="flex items-center justify-between border-b border-[#e6dfd1] px-4 py-3 sm:px-6"><span className="font-serif text-lg font-normal tracking-[-0.06em] sm:text-xl">forma.</span><div className="hidden gap-5 text-[9px] font-medium sm:flex"><span>Coleção</span><span>Sobre nós</span></div><ShoppingBag size={15} strokeWidth={1.5}/></div>
        <div className="relative grid min-h-[205px] grid-cols-[1fr_1.05fr] overflow-hidden sm:min-h-[290px]">
          <motion.div key={'copy'+take} initial={reduce||selected?false:{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{duration:reduce?0:.65,delay:reduce||selected?0:.4}} className="relative z-10 flex flex-col items-start justify-center px-4 py-6 sm:px-7">
            <span className="text-[8px] font-medium uppercase tracking-[0.22em] text-[#756752] sm:text-[10px]">Objetos para viver</span><h2 className="my-3 font-serif text-[clamp(1.55rem,3.5vw,3.6rem)] font-normal leading-[.98] tracking-[-0.05em]">Espaço para<br/>o essencial.</h2><p className="max-w-[160px] text-[9px] leading-relaxed text-[#756752] sm:max-w-[200px] sm:text-xs">Peças intemporais, pensadas para todos os dias.</p><span className="mt-4 border-b border-[#514c3e] pb-1 text-[9px] font-semibold sm:text-[11px]">Descobrir coleção ↗</span>
          </motion.div>
          <motion.div key={'art'+take} initial={reduce||selected?false:{clipPath:'inset(0 100% 0 0)'}} animate={{clipPath:'inset(0 0% 0 0)'}} transition={{duration:reduce?0:1.2,delay:reduce||selected?0:.65,ease:[.22,1,.36,1]}} className="relative flex items-end justify-center overflow-hidden bg-[#d9c9b2]"><div className="absolute inset-0 bg-[linear-gradient(125deg,#f0e5d3_0%,#d8c4aa_55%,#b4a28a_100%)]"/><div className="absolute bottom-0 h-[22%] w-full bg-[#c6b69f]"/><div className="absolute -left-3 top-4 h-[70%] w-[62%] rounded-t-full bg-[#e9dcc8] opacity-60"/><ObjectStudy className="relative z-10 w-full max-w-[320px]" kind="chair"/></motion.div>
        </div>
        <motion.div key={'collection'+take} initial={reduce||selected?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.65,delay:reduce||selected?0:1.35}} className="border-t border-[#e6dfd1] px-4 py-3 sm:px-6 sm:py-4"><div className="mb-2 flex items-center justify-between"><span className="font-serif text-sm sm:text-lg">A coleção.</span><span className="text-[8px] text-[#756752]">Três peças essenciais</span></div><div className="grid grid-cols-3 gap-2 sm:gap-3">{([{kind:'chair',name:'Cadeira Nº 01',bg:'#e1d4be'},{kind:'lamp',name:'Luz de mesa',bg:'#e8dfce'},{kind:'vase',name:'Vaso Terra',bg:'#e0c9b7'}] as const).map(item=><div key={item.kind}><div className="flex aspect-[1.5] items-center justify-center overflow-hidden" style={{backgroundColor:item.bg}}><ObjectStudy kind={item.kind} className="h-full w-auto"/></div><p className="mt-1 text-[8px] font-medium sm:text-[10px]">{item.name}</p></div>)}</div></motion.div>
        {selected&&current===0&&<div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#26372b] text-[#f0e8d7]"><span className="font-serif text-6xl tracking-[-0.07em]">forma.</span><span className="text-xs uppercase tracking-[.2em]">Identidade da marca</span></div>}
        {selected&&current===1&&<div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 border border-[#d7d1c3] bg-[#f8f6ef] p-3 text-xs font-semibold text-[#514c3e] shadow-lg">Editor visual · cabeçalho, coleção e produtos preparados</div>}
        {!reduce&&playing&&<AnimatePresence>{current===0&&<motion.div key={'curtain'+take} initial={{scaleX:1}} animate={{scaleX:0}} exit={{opacity:0}} onAnimationComplete={()=>{if(playing)setStage(s=>s===0?1:s);}} transition={{duration:1.15,delay:.45,ease:[.76,0,.24,1]}} style={{transformOrigin:'right'}} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#26372b]"><span className="font-serif text-6xl tracking-[-0.07em] text-[#f0e8d7]">forma.</span></motion.div>}</AnimatePresence>}
        {!reduce&&playing&&<motion.span key={'timer'+take} aria-hidden="true" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.01,delay:2.4}} onAnimationComplete={()=>{setStage(2);setPlaying(false);}} className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-sm bg-[#294a35] px-2 py-1 text-[9px] font-semibold text-white"><Check size={11}/> Loja publicada · demo</motion.span>}
        {(!playing||reduce)&&current===2&&<span className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-sm bg-[#294a35] px-2 py-1 text-[9px] font-semibold text-white"><Check size={11}/> Loja publicada · demo</span>}
      </div>
    </div>
    <div className="mt-4 flex items-start justify-between gap-3"><div className="grid flex-1 grid-cols-3 gap-2" aria-label="Etapas da demonstração">{launchScenes.map((s,i)=><button key={s.title} type="button" aria-pressed={current===i} onClick={()=>choose(i)} className="min-w-0 text-left focus-visible:outline-2 focus-visible:outline-[#286346]"><span className={'mb-2 block h-[2px] '+(current>=i?'bg-[#286346]':'bg-[#d5d1c6]')}/><span className="block text-[10px] font-semibold leading-tight text-[#292c25] sm:text-xs">0{i+1} {s.title}</span><span className="mt-1 hidden text-[10px] text-[#655f53] sm:block">{s.detail}</span></button>)}</div>{!reduce&&<button type="button" aria-label="Repetir animação de lançamento" onClick={replay} className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#c8c4b9] text-[#286346] transition hover:bg-[#e1e8d9]"><RotateCcw size={15}/></button>}</div>
    <p className="mt-3 text-[10px] text-[#655f53]">Loja conceptual · ilustração original, não uma loja real.</p>
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
        <Brand dark/><div className="hidden items-center gap-7 lg:flex">{nav.map(n=><a key={n.href} href={n.href} className="text-sm font-medium text-[#424c3e] transition hover:text-[#286346]">{n.label}</a>)}</div>
        <div className="flex items-center gap-3">{!isSignedIn&&<Link href="/login" className="hidden text-sm font-semibold text-[#424c3e] hover:text-[#286346] sm:block">Entrar</Link>}<Link href={href} className="hidden items-center gap-2 rounded-[5px] bg-[#245439] px-4 py-2.5 text-sm font-semibold text-[#f8f6ec] hover:bg-[#173d29] sm:inline-flex">{isSignedIn?'Painel':'Começar grátis'}<ArrowRight size={15}/></Link><button type="button" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="mobile-nav" onClick={()=>setMenu(!menu)} className="grid h-10 w-10 place-items-center rounded-lg border border-[#c8c4b9] lg:hidden">{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
      </nav>
      {menu&&<div id="mobile-nav" className={shell+' grid gap-1 border-t border-[#d6d1c4] pb-5 pt-3 lg:hidden'}>{nav.map(n=><a key={n.href} href={n.href} onClick={()=>setMenu(false)} className="rounded-lg p-3 text-sm font-medium hover:bg-[#e7e6da]">{n.label}</a>)}{!isSignedIn&&<Link href="/login" onClick={()=>setMenu(false)} className="p-3 text-sm">Entrar</Link>}<Link href={href} className={primary}>{cta}<ArrowRight size={16}/></Link></div>}
    </header>
    <main>
      <section className="relative overflow-hidden bg-[#f5f2e9] text-[#252a21]">
        <div className={shell+' grid items-center gap-10 pb-14 pt-12 sm:pb-20 sm:pt-20 lg:grid-cols-[.85fr_1.15fr] lg:gap-14 lg:pb-24 lg:pt-24'}>
          <div>
            <motion.div {...intro(0)} className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.15em] text-[#286346]"><span className="h-px w-8 bg-[#286346]"/> A plataforma de comércio independente</motion.div>
            <motion.div {...intro(.08)} className="overflow-hidden"><h1 className="text-[clamp(3.2rem,6.5vw,6.1rem)] font-semibold leading-[.95] tracking-[-.07em]">O teu negócio.<br/>A tua <span className="font-serif font-normal italic tracking-[-.065em] text-[#286346]">loja.</span></h1></motion.div>
            <motion.p {...intro(.18)} className="mt-6 max-w-md text-lg leading-relaxed text-[#5c6254]">Cria uma loja que tenha a tua identidade. Gere as vendas, acompanha os clientes e melhora o negócio com o ForgePilot, sem sair da ShopForge.</motion.p>
            <motion.div {...intro(.26)} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4"><Link href={href} className="inline-flex items-center gap-3 rounded-[5px] bg-[#245439] px-6 py-4 font-semibold text-[#f8f6ec] transition hover:bg-[#173d29] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#286346]">{cta}<ArrowRight size={18}/></Link><a href="#demo" className="inline-flex items-center gap-2 border-b border-[#9ba692] pb-1 text-sm font-semibold text-[#343d30] hover:text-[#286346]">Ver como funciona <ArrowUpRight size={15}/></a></motion.div>
            <motion.div {...intro(.34)} className="mt-12 flex items-center gap-3 border-t border-[#d6d1c4] pt-4 text-xs leading-relaxed text-[#655f53]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#b9c5b4] text-[#286346]"><ArrowRight size={15}/></span> Da primeira ideia à primeira encomenda.</motion.div>
          </div>
          <motion.div {...intro(.14)}><LaunchFilm/></motion.div>
        </div>
        <div className={shell+' flex items-center justify-between gap-4 border-t border-[#d6d1c4] py-4 text-[10px] font-semibold uppercase tracking-[.13em] text-[#655f53]'}><span>Criação / Gestão / Crescimento</span><a href="#features" className="flex items-center gap-1 hover:text-[#286346]">Explorar <ChevronDown size={14}/></a></div>
      </section>

      <section id="features" className={shell+' scroll-mt-24 py-20 sm:py-28'}>
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <Reveal><p className="mb-5 text-xs font-semibold uppercase tracking-[.16em] text-[#286346]">01 — A plataforma</p><h2 className="max-w-lg text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">Tudo o que precisas.<br/><span className="font-serif font-normal italic text-[#286346]">Num só lugar.</span></h2><p className="mt-6 max-w-md leading-relaxed text-[#53685a]">A ShopForge junta a criação da loja e a operação do negócio. Começa com o essencial e acrescenta ferramentas à medida que cresces.</p><a href="#demo" className="mt-7 inline-flex items-center gap-2 border-b border-[#9ba692] pb-1 text-sm font-semibold">Conhecer o produto <ArrowUpRight size={15}/></a></Reveal>
          <div className="border-t border-[#d5ddd3]">{platform.map(({icon:Icon,title,copy},i)=><Reveal key={title} delay={Math.min(i*.045,.2)}><div className="group grid grid-cols-[32px_1fr_25px] gap-3 border-b border-[#d5ddd3] py-5 sm:grid-cols-[40px_1fr_32px] sm:gap-4 sm:py-6"><span className="pt-1 text-xs font-semibold tabular-nums text-[#687e6b]">0{i+1}</span><div><h3 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h3><p className="mt-1.5 text-sm leading-relaxed text-[#53685a]">{copy}</p></div><Icon size={21} strokeWidth={1.6} className="mt-1 text-[#286346] transition-transform motion-safe:group-hover:-translate-y-1"/></div></Reveal>)}</div>
        </div>
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
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal className="rounded-[26px] border border-[#dce6dd] bg-[#ffffff] p-6 sm:p-9"><Eyebrow>Growth Lab</Eyebrow><h2 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Não adivinhes. Analisa.</h2><p className="mt-4 max-w-md text-[#53685a] leading-relaxed">Acompanha visitantes, páginas vistas, atividade recente e o funil de compra. Descobre onde atuar primeiro com recomendações baseadas nos dados disponíveis.</p><div className="mt-7 rounded-2xl bg-[#edf3ee] p-5"><div className="mb-5 flex items-center justify-between gap-2"><p className="text-sm font-bold">Funil de conversão</p><span className="text-[10px] font-semibold text-[#607467]">Dados de exemplo</span></div><Funnel/></div><div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-[#24633e]"><span className="flex items-center gap-1"><Radio size={15}/> Visitantes ativos</span><span className="flex items-center gap-1"><MousePointerClick size={15}/> Comportamento</span><span className="flex items-center gap-1"><BarChart3 size={15}/> Relatórios</span></div></Reveal>
          <Reveal delay={0.1} className="rounded-[26px] bg-[#dceee0] p-6 sm:p-9"><Eyebrow>Assistente ShopForge</Eyebrow><h2 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Fala. Escreve. Avança.</h2><p className="mt-4 text-[#45604e] leading-relaxed">O assistente acompanha-te num painel lateral ajustável. Escreve perguntas ou utiliza o ditado por voz em navegadores compatíveis, revê o texto e envia quando quiseres.</p><div className="mt-7 rounded-2xl border border-[#c5dccb] bg-[#ffffff] p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between border-b border-[#e1e9e3] pb-3"><span className="flex items-center gap-2 text-sm font-bold"><Sparkles size={17} className="text-[#258858]"/> Assistente IA</span><PanelRightOpen size={17} className="text-[#607467]"/></div><p className="my-4 ml-auto max-w-[85%] rounded-xl bg-[#e9f3eb] p-3 text-xs">Ajuda-me a preparar uma campanha para a nova coleção.</p><p className="rounded-xl border border-[#e1e9e3] p-3 text-xs leading-relaxed text-[#42584a]">Vamos começar pelo público, pelo objetivo e pelos produtos que queres destacar.</p><div className="mt-4 flex items-center gap-2 rounded-xl border border-[#d7e5d9] p-3 text-xs text-[#607467]"><Mic size={17} className="text-[#258858]"/><span className="flex-1">Escreve ou dita a tua mensagem</span><ArrowRight size={15}/></div><p className="mt-2 text-[10px] text-[#607467]">Conversa ilustrativa · não é um chat ativo</p></div></Reveal>
        </div>
      </section>

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
