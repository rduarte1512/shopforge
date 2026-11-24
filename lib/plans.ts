// Shared, browser-safe catalog: one source for pricing and ForgePilot quotas.
export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export interface Plan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  tokens: number;
  features: string[];
  limits: { stores: number; products: number };
}
export const FORGE_TOKEN_COSTS = { chat: 5, brand: 10, draft: 15, batch: 30 } as const;
export type ForgeOperation = keyof typeof FORGE_TOKEN_COSTS;
export const FORGE_OPERATION_LABELS: Record<ForgeOperation,string> = {chat:'Pergunta ao Copilot',brand:'Identidade de marca',draft:'Texto de marketing / produto',batch:'Plano de alterações'};
export const SUBSCRIPTION_PLANS: Plan[] = [
  {id:'STARTER',name:'Starter',description:'Experimenta a plataforma e lança a tua primeira loja.',price:0,interval:'monthly',tokens:100,limits:{stores:1,products:50},features:['1 loja ativa','Até 50 produtos','Editor visual manual','Gestão de encomendas e clientes','Copilot limitado (até 20 perguntas/mês)']},
  {id:'GROWTH',name:'Growth',description:'Para marcas que querem começar a vender e crescer.',price:25,interval:'monthly',tokens:1000,limits:{stores:3,products:500},features:['Até 3 lojas','Até 500 produtos','Promoções e recuperação de carrinhos','Growth Lab e diagnóstico','IA de produtos e identidade de marca']},
  {id:'PRO',name:'Professional',description:'Para negócios que querem escalar com inteligência artificial.',price:60,interval:'monthly',tokens:3500,limits:{stores:10,products:1000000},features:['Até 10 lojas','Até 1 milhão de produtos','Geração de loja por IA','Tudo do Growth','Action Engine, Autopilot e testes A/B','Marketing Studio, automações, email e afiliados']},
  {id:'BUSINESS',name:'Business',description:'Para equipas, agências e gestores de várias marcas.',price:125,interval:'monthly',tokens:10000,limits:{stores:25,products:1000000},features:['Até 25 lojas','Até 1 milhão de produtos','Tudo do Professional','Gestão de equipa','Relatórios financeiros e exportação']},
  {id:'ENTERPRISE',name:'Enterprise',description:'Para operações de grande dimensão e uso intensivo.',price:250,interval:'monthly',tokens:25000,limits:{stores:1000000,products:1000000},features:['Capacidade alargada de lojas','Até 1 milhão de produtos','Tudo do Business','Gestão de várias marcas','Maior carteira ForgePilot']}
];
export function getPlan(tier:unknown){return SUBSCRIPTION_PLANS.find(p=>p.id===tier)??null;}
export function effectiveForgePlan(tier:unknown,status:unknown){
  return ((status==='active'||status==='trialing')?getPlan(tier):null)??SUBSCRIPTION_PLANS[0];
}
export const tokenFormat=(n:number)=>new Intl.NumberFormat('pt-PT').format(n);

export const FEATURE_MINIMUM = {
  carts:'GROWTH', discounts:'GROWTH', traffic:'GROWTH', brand:'GROWTH',
  aiProducts:'GROWTH', assistant:'GROWTH', diagnostics:'GROWTH',
  aiStore:'PRO', aiDesigner:'PRO', actions:'PRO', experiments:'PRO', autopilot:'PRO',
  marketing:'PRO', affiliates:'PRO', automations:'PRO', email:'PRO', integrations:'PRO',
  reports:'BUSINESS', team:'BUSINESS',
} as const satisfies Record<string,SubscriptionTier>;
export type PlanFeature=keyof typeof FEATURE_MINIMUM;
const ranks:Record<SubscriptionTier,number>={STARTER:0,GROWTH:1,PRO:2,BUSINESS:3,ENTERPRISE:4};
export function hasFeature(tier:unknown,status:unknown,feature:PlanFeature){
 return ranks[effectiveForgePlan(tier,status).id]>=ranks[FEATURE_MINIMUM[feature]];
}
export const FEATURE_LABELS:Record<PlanFeature,string>={
 carts:'Recuperação de carrinhos',discounts:'Promoções e cupões',traffic:'Growth Lab e visitantes',brand:'Identidade com IA',
 aiProducts:'Geração de produtos com IA',assistant:'Assistente IA geral',diagnostics:'Diagnóstico detalhado',
 aiStore:'Criação de lojas com IA',aiDesigner:'Editor assistido por IA',actions:'Action Engine e alterações',experiments:'Testes A/B',autopilot:'Autopilot',
 marketing:'Marketing Studio',affiliates:'Afiliados',automations:'Automações',email:'Email Marketing',integrations:'Integrações',
 reports:'Relatórios financeiros e exportação',team:'Gestão de equipa',
};
export function featureForPath(path:string):PlanFeature|undefined{
 const modules:Record<string,PlanFeature>={carts:'carts',coupons:'discounts',promotions:'discounts',affiliates:'affiliates',automations:'automations',email:'email',reports:'reports',team:'team',integrations:'integrations'};
 return modules[path.split('/')[2]];
}
export function featureForForgeTab(tab:string):PlanFeature|undefined{
 const tabs:Record<string,PlanFeature>={overview:'actions',actions:'actions',intelligence:'actions',autopilot:'autopilot',experiments:'experiments',marketing:'marketing',business:'actions',insights:'diagnostics',brand:'brand',history:'actions',growth:'traffic'};
 return tabs[tab];
}
export const FORGE_OPERATION_FEATURE:Partial<Record<ForgeOperation,PlanFeature>>={brand:'brand',draft:'marketing',batch:'actions'};
