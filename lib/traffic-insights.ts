import type { TrafficOverview } from './store-traffic';

export type GrowthRecommendation = { title: string; description: string; level: 'priority' | 'opportunity' | 'insight' };

export function buildGrowthRecommendations(data: TrafficOverview): GrowthRecommendation[] {
  if (!data.available) return [{ title: 'Preparar a recolha de visitas', description: 'A base de dados ainda não está preparada. Instala a migração do Growth Lab antes de usar as métricas.', level: 'insight' }];
  const { visitors, pageViews, productViewers, cartVisitors, checkoutVisitors } = data.summary;
  if (visitors < 20) return [{
    title: 'Primeiro objetivo: compreender os primeiros visitantes',
    description: 'A amostra ainda é pequena. Partilha a loja, recolhe visitas com consentimento e evita tirar conclusões precipitadas das percentagens.',
    level: 'insight',
  }];
  const advice: GrowthRecommendation[] = [];
  if (productViewers / visitors < 0.35) advice.push({
    title: 'Coloca os produtos em destaque',
    description: 'Menos de 35% dos visitantes consultaram um produto. Revê a primeira secção, as categorias e o acesso à coleção.',
    level: 'priority',
  });
  if (productViewers >= 15 && cartVisitors / productViewers < 0.12) advice.push({
    title: 'Melhora o poder de decisão nas fichas de produto',
    description: 'Há visualizações de produtos mas poucas adições ao carrinho. Revê fotografias, benefícios, stock, preços e informações de envio.',
    level: 'priority',
  });
  if (cartVisitors >= 15 && checkoutVisitors / cartVisitors < 0.3) advice.push({
    title: 'Torna o checkout mais claro',
    description: 'Muitos visitantes adicionam artigos e poucos iniciam o checkout. Explica as condições, os pagamentos e o total antes de pedir os dados.',
    level: 'opportunity',
  });
  if (pageViews / visitors > 4 && productViewers / visitors < 0.45) advice.push({
    title: 'Simplifica a navegação',
    description: 'Existem muitas páginas vistas por visitante, mas pouco interesse direto nos produtos. Experimenta reduzir passos até à coleção.',
    level: 'opportunity',
  });
  if (!advice.length) advice.push({
    title: 'Continua a acompanhar as tendências',
    description: 'Os indicadores atuais não mostram uma dificuldade clara no percurso. Compara períodos e testa melhorias pequenas, uma de cada vez.',
    level: 'insight',
  });
  return advice.slice(0, 3);
}
