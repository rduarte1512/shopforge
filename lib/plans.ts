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
  {id:'STARTER',name:'Starter',description:'Experimenta a plataforma e lança a tua primeira loja.',price:0,interval:'monthly',tokens:100,limits:{stores:1,products:50},features:['1 loja ativa','Até 50 produtos','Editor visual e temas','Gestão de encomendas','Experimenta o ForgePilot']},
  {id:'GROWTH',name:'Growth',description:'Para marcas que querem começar a vender e crescer.',price:25,interval:'monthly',tokens:1000,limits:{stores:3,products:500},features:['Até 3 lojas','Até 500 produtos','Temas premium','Recuperação de carrinho','Analytics e ForgePilot']},
  {id:'PRO',name:'Professional',description:'Para negócios que querem escalar com inteligência artificial.',price:60,interval:'monthly',tokens:3500,limits:{stores:10,products:1000000},features:['Até 10 lojas','Até 1 milhão de produtos','Geração de loja por IA','Growth Lab e testes A/B','Marketing Studio e Action Engine']},
  {id:'BUSINESS',name:'Business',description:'Para equipas, agências e gestores de várias marcas.',price:125,interval:'monthly',tokens:10000,limits:{stores:25,products:1000000},features:['Até 25 lojas','Até 1 milhão de produtos','Ferramentas de gestão de equipa','Relatórios e análise de negócio','Maior capacidade de IA']},
  {id:'ENTERPRISE',name:'Enterprise',description:'Para operações de grande dimensão e uso intensivo.',price:250,interval:'monthly',tokens:25000,limits:{stores:1000000,products:1000000},features:['Capacidade alargada de lojas','Até 1 milhão de produtos','Gestão de várias marcas','Business Intelligence','Maior carteira ForgePilot']}
];
export function getPlan(tier:unknown){return SUBSCRIPTION_PLANS.find(p=>p.id===tier)??null;}
export function effectiveForgePlan(tier:unknown,status:unknown){
  return ((status==='active'||status==='trialing')?getPlan(tier):null)??SUBSCRIPTION_PLANS[0];
}
export const tokenFormat=(n:number)=>new Intl.NumberFormat('pt-PT').format(n);
