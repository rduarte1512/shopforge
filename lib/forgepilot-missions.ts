import type { ForgePilotAudit, ForgePilotRecommendation, ImprovementId } from './forgepilot-engine';
import type { TrafficOverview } from './store-traffic';

export type ForgePilotMissionId = 'conversion' | 'design' | 'catalog' | 'traffic';
export type MissionStep = {
  id: string;
  title: string;
  reason: string;
  status: 'done' | 'todo' | 'info';
  impact: 'high' | 'medium' | 'low';
  action?: ImprovementId;
  manualHref?: string;
};
export type MissionPlan = {
  id: ForgePilotMissionId;
  title: string;
  description: string;
  completed: number;
  total: number;
  steps: MissionStep[];
  evidence: string;
};
export const FORGEPILOT_MISSIONS: Record<ForgePilotMissionId, { title: string; description: string; subtitle: string }> = {
  conversion: { title: 'Melhorar a conversão', description: 'Simplificar o caminho desde a primeira visita até à compra.', subtitle: 'Percurso de compra' },
  design: { title: 'Melhorar o design', description: 'Tornar a primeira impressão, leitura e organização mais claras.', subtitle: 'Experiência visual' },
  catalog: { title: 'Otimizar produtos', description: 'Apresentar o catálogo com fotografias, informação e preços consistentes.', subtitle: 'Qualidade do catálogo' },
  traffic: { title: 'Compreender visitantes', description: 'Interpretar os dados do Growth Lab antes de tomar decisões.', subtitle: 'Dados reais' },
};
const missionRecommendationIds: Record<ForgePilotMissionId, string[]> = {
  conversion: ['hero-message', 'product-placement', 'clear-cta', 'trust-section', 'faq-section', 'images', 'prices'],
  design: ['hero-message', 'contrast', 'product-placement', 'clear-cta', 'trust-section', 'faq-section'],
  catalog: ['catalog', 'images', 'prices', 'description', 'product-placement'],
  traffic: ['product-placement', 'hero-message', 'clear-cta'],
};
const stepsCatalog: Record<string, { title: string; reason: string; impact: MissionStep['impact']; action?: ImprovementId; manualHref?: string }> = {
  'hero-message': { title: 'Explicar a proposta no primeiro ecrã', reason: 'Uma mensagem inicial específica torna a loja mais fácil de compreender.', impact: 'high', action: 'hero-message' },
  'product-placement': { title: 'Trazer a coleção para mais perto do topo', reason: 'Os visitantes devem encontrar os produtos sem procurar demasiado.', impact: 'medium', action: 'product-placement' },
  'clear-cta': { title: 'Dar destaque ao botão principal', reason: 'Um próximo passo evidente melhora a orientação na página.', impact: 'low', action: 'clear-cta' },
  'trust-section': { title: 'Adicionar informação de confiança', reason: 'Informação objetiva sobre a compra pode esclarecer dúvidas.', impact: 'medium', action: 'trust-section' },
  'faq-section': { title: 'Responder a perguntas frequentes', reason: 'Dúvidas comuns devem ter respostas claras e verificáveis.', impact: 'medium', action: 'faq-section' },
  contrast: { title: 'Corrigir o contraste dos textos', reason: 'O contraste de leitura deve respeitar o mínimo de acessibilidade.', impact: 'high', action: 'contrast' },
  catalog: { title: 'Criar uma coleção inicial', reason: 'Adicionar pelo menos três produtos reais para apresentar a oferta.', impact: 'high', manualHref: '/dashboard/products' },
  images: { title: 'Completar as fotografias do catálogo', reason: 'As imagens devem mostrar os artigos que estão realmente à venda.', impact: 'high', manualHref: '/dashboard/products' },
  prices: { title: 'Validar os preços', reason: 'Todos os produtos publicados devem ter preços positivos.', impact: 'high', manualHref: '/dashboard/products' },
  description: { title: 'Melhorar a descrição da loja', reason: 'Explica em poucas frases o que vendes e para quem.', impact: 'medium', manualHref: '/dashboard/stores' },
};

export function isForgePilotMissionId(input: unknown): input is ForgePilotMissionId {
  return typeof input === 'string' && Object.prototype.hasOwnProperty.call(FORGEPILOT_MISSIONS, input);
}
export function detectForgePilotMission(message: string): ForgePilotMissionId {
  const value = String(message || '').toLocaleLowerCase('pt-PT');
  if (/visita|tr[aá]fego|growth|estat[ií]stic|analytics|dados|visitantes|aovivo|ao vivo/.test(value)) return 'traffic';
  if (/produto|cat[aá]logo|pre[çc]o|fotograf|stock|invent[aá]rio/.test(value)) return 'catalog';
  if (/design|cor|visual|layout|tipograf|aspeto|apar[eê]ncia|mobile/.test(value)) return 'design';
  return 'conversion';
}

export function planForgePilotMission(
  goal: ForgePilotMissionId,
  audit: ForgePilotAudit,
  traffic?: Pick<TrafficOverview, 'available' | 'summary' | 'note'> | null,
): MissionPlan {
  const selected = isForgePilotMissionId(goal) ? goal : 'conversion';
  const recommendations = new Map<string, ForgePilotRecommendation>(audit.recommendations.map(item => [item.id, item]));
  const steps: MissionStep[] = missionRecommendationIds[selected].map(id => {
    const item = recommendations.get(id);
    const standard = stepsCatalog[id];
    return {
      id,
      title: item?.title || standard.title,
      reason: item?.reason || standard.reason,
      status: item ? 'todo' as const : 'done' as const,
      impact: item?.impact || standard.impact,
      ...(item?.action || (!item && standard.action) ? { action: item?.action || standard.action } : {}),
      ...(item?.manualHref || (!item && standard.manualHref) ? { manualHref: item?.manualHref || standard.manualHref } : {}),
    };
  });
  let evidence = 'O plano usa verificações de configuração e conteúdo da loja, não estimativas de vendas.';
  if (selected === 'traffic') {
    if (!traffic?.available) {
      evidence = 'Ainda não há dados de visitas disponíveis. Confirma a instalação e recolha do Growth Lab.';
      steps.unshift({ id: 'traffic-data', title: 'Confirmar a recolha de visitas', reason: 'É preciso ter dados com consentimento para analisar comportamentos reais.', status: 'info', impact: 'medium', manualHref: '/dashboard/forgepilot?tab=growth' });
    } else if (traffic.summary.visitors < 20) {
      evidence = 'Menos de 20 visitantes medidos nos últimos 7 dias: ainda não é seguro tirar conclusões das percentagens.';
      steps.unshift({ id: 'traffic-sample', title: 'Recolher mais visitas antes de concluir', reason: 'A amostra atual é reduzida. Não confundir ausência de consentimento com ausência de visitas.', status: 'info', impact: 'medium', manualHref: '/dashboard/forgepilot?tab=growth' });
    } else {
      const summary = traffic.summary;
      evidence = 'Últimos 7 dias: ' + summary.visitors + ' visitantes medidos, ' + summary.productViewers + ' consultaram produtos e ' + summary.cartVisitors + ' adicionaram ao carrinho. São indicadores observados, não previsões.';
      steps.unshift({ id: 'traffic-review', title: 'Rever o funil real de navegação', reason: 'Compara tráfego, visitas a produtos e carrinhos no Growth Lab. As etapas não representam necessariamente o mesmo percurso sequencial.', status: 'info', impact: 'medium', manualHref: '/dashboard/forgepilot?tab=growth' });
    }
  }
  const done = steps.filter(item => item.status === 'done').length;
  const measurable = steps.filter(item => item.status !== 'info').length;
  return {
    id: selected,
    title: FORGEPILOT_MISSIONS[selected].title,
    description: FORGEPILOT_MISSIONS[selected].description,
    completed: done,
    total: measurable,
    steps,
    evidence,
  };
}

export function forgePilotAuditDimensions(audit: ForgePilotAudit) {
  const groups = [
    { id: 'catalog', label: 'Catálogo', keys: ['catalog', 'images', 'pricing'] },
    { id: 'brand', label: 'Marca', keys: ['intro', 'hero'] },
    { id: 'experience', label: 'Experiência', keys: ['products', 'cta'] },
    { id: 'trust', label: 'Confiança', keys: ['trust', 'faq'] },
    { id: 'accessibility', label: 'Acessibilidade', keys: ['contrast'] },
  ];
  return groups.map(group => {
    const checks = audit.checks.filter(item => group.keys.includes(item.key));
    const total = checks.reduce((sum, item) => sum + item.max, 0);
    const achieved = checks.reduce((sum, item) => sum + item.points, 0);
    return { id: group.id, label: group.label, score: total ? Math.round(achieved / total * 100) : 0, achieved, total };
  });
}
