// ForgePilot: diagnóstico determinístico e alterações reversíveis.
// Não estima vendas nem atribui ao código ganhos de conversão sem medição real.
export type ImprovementId = 'hero-message' | 'trust-section' | 'faq-section' | 'contrast' | 'product-placement' | 'clear-cta';
export type ForgePilotBrand = { audience: string; positioning: string; tone: string; tagline: string };
export type ForgePilotRecommendation = {
  id: string;
  title: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  action?: ImprovementId;
  manualHref?: string;
  actionLabel: string;
};
export type ForgePilotCheck = { key: string; title: string; passed: boolean; points: number; max: number };
export type ForgePilotAudit = {
  score: number;
  checks: ForgePilotCheck[];
  recommendations: ForgePilotRecommendation[];
  productCount: number;
  imageCount: number;
  orderCount: number;
  note: string;
};

export function safeConfig(input: unknown): Record<string, any> {
  if (!input) return {};
  if (typeof input === 'string') {
    try { const parsed = JSON.parse(input); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; }
    catch { return {}; }
  }
  return typeof input === 'object' && !Array.isArray(input) ? input as Record<string, any> : {};
}
const FALLBACK_ACCENT = '#008060';
const isHex = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function contrastRatio(first: unknown, second: unknown): number {
  const light = (hex: string) => {
    const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = light(isHex(first) ? first : '#0f172a');
  const b = light(isHex(second) ? second : '#ffffff');
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
const nicheProfiles = [
  { regex: /pesca|cana|carreto|anz[oó]l|fishing/i, label: 'equipamento de pesca', audience: 'Pessoas apaixonadas por pesca e atividades ao ar livre', tone: 'Prático e especializado', tagline: 'O equipamento certo para a próxima aventura.' },
  { regex: /joia|jóia|colar|brinco|anel|jewel/i, label: 'joalharia', audience: 'Pessoas que procuram peças especiais e presentes marcantes', tone: 'Elegante e próximo', tagline: 'Os detalhes contam a tua história.' },
  { regex: /rel[oó]gio|watch|chronograph/i, label: 'relógios', audience: 'Pessoas que valorizam estilo, precisão e qualidade', tone: 'Premium e confiante', tagline: 'Cada momento merece atenção.' },
  { regex: /moda|vestid|streetwear|roupa|hoodie|fashion|t-shirt/i, label: 'moda', audience: 'Pessoas que querem expressar o seu estilo', tone: 'Moderno e inspirador', tagline: 'O teu estilo, sem compromissos.' },
  { regex: /skincare|beleza|cosm[eé]tic|perfume/i, label: 'beleza', audience: 'Pessoas que valorizam cuidado pessoal e bem-estar', tone: 'Calmo e acolhedor', tagline: 'Um momento só para ti.' },
  { regex: /tecnologia|gadget|gaming|eletr[oó]nic|auscultadores/i, label: 'tecnologia', audience: 'Pessoas que procuram tecnologia útil e acessível', tone: 'Claro e inovador', tagline: 'Simplifica o teu dia com tecnologia.' },
  { regex: /fitness|gin[aá]sio|treino|gym|desporto/i, label: 'fitness', audience: 'Pessoas que procuram evoluir na sua rotina de treino', tone: 'Energético e direto', tagline: 'Pronto para o próximo desafio.' },
];
export function inferBrand(store: any, products: any[]): ForgePilotBrand {
  const config = safeConfig(store?.customization);
  const existing = config.forgepilot?.brand || {};
  const categoryText = products.map(p => p.category || '').slice(0, 20).join(' ');
  const source = [store?.name, store?.description, categoryText].join(' ');
  const niche = nicheProfiles.find(profile => profile.regex.test(source));
  const defaultBrand = {
    audience: niche?.audience || 'Clientes interessados nos produtos e na proposta de valor da tua loja',
    positioning: niche ? 'Uma marca de ' + niche.label + ' com uma experiência clara, cuidada e consistente.' : 'Uma marca com uma identidade própria, focada em confiança e facilidade de compra.',
    tone: niche?.tone || 'Claro e acolhedor',
    tagline: niche?.tagline || 'Descobre uma seleção feita a pensar em ti.',
  };
  return {
    audience: typeof existing.audience === 'string' ? existing.audience : defaultBrand.audience,
    positioning: typeof existing.positioning === 'string' ? existing.positioning : defaultBrand.positioning,
    tone: typeof existing.tone === 'string' ? existing.tone : defaultBrand.tone,
    tagline: typeof existing.tagline === 'string' ? existing.tagline : defaultBrand.tagline,
  };
}
const recommendation = (id: string, title: string, reason: string, impact: ForgePilotRecommendation['impact'], category: string, action?: ImprovementId, manualHref?: string): ForgePilotRecommendation => ({
  id, title, reason, impact, category, action, manualHref,
  actionLabel: action ? 'Pré-visualizar melhoria' : 'Resolver na loja',
});
export function auditStore(store: any, products: any[], orders: any[]): ForgePilotAudit {
  const config = safeConfig(store?.customization);
  const sections: any[] = Array.isArray(config.sections) ? config.sections : [];
  const has = (type: string) => sections.some(section => section?.type === type);
  const hero = sections.find(section => section?.type === 'hero');
  const images = products.filter(p => typeof p.image_url === 'string' && p.image_url.trim().length > 5).length;
  const prices = products.length > 0 && products.every(p => Number(p.price) > 0);
  const hasIntro = String(store.description || '').trim().length >= 35;
  const hasHero = has('hero') && String(hero?.content?.title || config.hero?.title || '').trim().length > 2;
  const hasCTA = hasHero && String(hero?.content?.buttonText || '').trim().length > 2;
  const productPlacement = has('products') && sections.findIndex(s => s.type === 'products') < 4;
  const goodContrast = contrastRatio(config.colors?.text, config.colors?.background) >= 4.5;
  const checks: ForgePilotCheck[] = [
    { key: 'intro', title: 'Descrição clara da loja', passed: hasIntro, max: 10, points: hasIntro ? 10 : 0 },
    { key: 'catalog', title: 'Catálogo com pelo menos 3 produtos', passed: products.length >= 3, max: 18, points: products.length >= 3 ? 18 : 0 },
    { key: 'images', title: 'Imagens nos produtos', passed: products.length > 0 && images / products.length >= .75, max: 12, points: products.length ? Math.round(12 * images / products.length) : 0 },
    { key: 'pricing', title: 'Produtos com preços válidos', passed: prices, max: 10, points: prices ? 10 : 0 },
    { key: 'hero', title: 'Apresentação inicial da marca', passed: hasHero, max: 10, points: hasHero ? 10 : 0 },
    { key: 'products', title: 'Produtos fáceis de encontrar', passed: productPlacement, max: 10, points: productPlacement ? 10 : 0 },
    { key: 'trust', title: 'Secção informativa de confiança', passed: has('trust'), max: 9, points: has('trust') ? 9 : 0 },
    { key: 'faq', title: 'Perguntas frequentes', passed: has('faq'), max: 7, points: has('faq') ? 7 : 0 },
    { key: 'contrast', title: 'Contraste básico de leitura', passed: goodContrast, max: 7, points: goodContrast ? 7 : 0 },
    { key: 'cta', title: 'Botão principal claro', passed: hasCTA, max: 7, points: hasCTA ? 7 : 0 },
  ];
  const recommendations: ForgePilotRecommendation[] = [];
  if (products.length < 3) recommendations.push(recommendation('catalog', 'Completa a tua primeira coleção', 'Um catálogo reduzido dificulta a escolha. Começa por adicionar pelo menos três produtos reais.', 'high', 'Produtos', undefined, '/dashboard/products'));
  if (images < products.length) recommendations.push(recommendation('images', 'Adiciona fotografias aos produtos', String(products.length - images) + ' produto(s) não têm imagem própria. Fotografias relevantes ajudam a explicar a oferta.', 'high', 'Produtos', undefined, '/dashboard/products'));
  if (!hasIntro) recommendations.push(recommendation('description', 'Escreve uma descrição mais clara', 'Explica em duas frases o que vendes e para quem. Faz esta alteração na gestão da loja.', 'medium', 'Marca', undefined, '/dashboard/stores'));
  if (!prices) recommendations.push(recommendation('prices', 'Revê os preços dos produtos', 'Há produtos sem preço positivo. Revê o catálogo antes de promover a loja.', 'high', 'Produtos', undefined, '/dashboard/products'));
  if (!hasHero || String(hero?.content?.subtitle || '').trim().length < 20) recommendations.push(recommendation('hero-message', 'Uma primeira impressão mais forte', 'A mensagem inicial deve explicar rapidamente o valor da tua marca.', 'high', 'Design', 'hero-message'));
  if (!productPlacement) recommendations.push(recommendation('product-placement', 'Mostra os produtos mais cedo', 'Uma montra visível reduz a procura necessária para encontrar o catálogo.', 'medium', 'Experiência', 'product-placement'));
  if (!has('trust')) recommendations.push(recommendation('trust-section', 'Explica por que é fácil comprar', 'Adiciona informação neutra sobre a experiência, sem promessas que a loja não garante.', 'medium', 'Confiança', 'trust-section'));
  if (!has('faq')) recommendations.push(recommendation('faq-section', 'Responde a dúvidas comuns', 'Ajuda os visitantes a perceber como consultar e encomendar produtos.', 'medium', 'Confiança', 'faq-section'));
  if (!goodContrast) recommendations.push(recommendation('contrast', 'Melhora a leitura dos textos', 'O contraste entre texto e fundo está abaixo do mínimo WCAG AA para texto normal.', 'high', 'Acessibilidade', 'contrast'));
  if (!hasCTA) recommendations.push(recommendation('clear-cta', 'Destaca o próximo passo', 'Um botão com uma indicação clara facilita a navegação.', 'low', 'Design', 'clear-cta'));
  return {
    score: Math.min(100, checks.reduce((sum, check) => sum + check.points, 0)),
    checks, recommendations: recommendations.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.impact] - ({ high: 0, medium: 1, low: 2 })[b.impact]),
    productCount: products.length, imageCount: images, orderCount: orders.length,
    note: 'Esta pontuação avalia configurações e conteúdo da loja. Não é uma previsão de vendas ou de conversão.',
  };
}
export function applyImprovement(input: unknown, id: ImprovementId, store: any, products: any[]): Record<string, any> {
  const config = JSON.parse(JSON.stringify(safeConfig(input)));
  const current: any[] = Array.isArray(config.sections) ? config.sections : [];
  const sections = current.length ? current : [
    { id: 'hero-forgepilot', type: 'hero', content: { title: store.name || 'A nossa loja' }, styles: {} },
    { id: 'products-forgepilot', type: 'products', content: { title: 'Explorar produtos' }, styles: { columns: 3 } },
  ];
  config.sections = sections;
  const get = (type: string) => sections.find(s => s.type === type);
  const brand = inferBrand({ ...store, customization: config }, products);
  const add = (section: any) => { if (!get(section.type)) sections.push(section); };
  if (id === 'hero-message') {
    let hero = get('hero');
    if (!hero) { hero = { id: 'hero-forgepilot', type: 'hero', content: {}, styles: {} }; sections.unshift(hero); }
    hero.content = { ...(hero.content || {}), title: String(hero.content?.title || store.name || 'A nossa loja'), subtitle: brand.positioning };
    config.hero = { ...(config.hero || {}), title: hero.content.title, subtitle: hero.content.subtitle };
  } else if (id === 'trust-section') {
    add({ id: 'trust-forgepilot', type: 'trust', content: { title: 'Uma compra simples e transparente', items: ['Explora produtos e preços com clareza', 'Revê o carrinho antes de finalizar', 'Consulta os detalhes de cada artigo'] }, styles: {} });
  } else if (id === 'faq-section') {
    add({ id: 'faq-forgepilot', type: 'faq', content: { title: 'Perguntas frequentes', items: [
      { question: 'Como descubro os produtos?', answer: 'Podes explorar a coleção e consultar a página de cada produto.' },
      { question: 'Como faço uma encomenda?', answer: 'Escolhe um produto, adiciona-o ao carrinho e segue os passos apresentados.' },
    ] }, styles: {} });
  } else if (id === 'contrast') {
    config.colors = { ...(config.colors || {}) };
    const background = isHex(config.colors.background) ? config.colors.background : '#ffffff';
    const whiteRatio = contrastRatio('#ffffff', background);
    const blackRatio = contrastRatio('#0f172a', background);
    config.colors.text = whiteRatio > blackRatio ? '#ffffff' : '#0f172a';
  } else if (id === 'product-placement') {
    let productSection = get('products');
    if (!productSection) { productSection = { id: 'products-forgepilot', type: 'products', content: { title: 'Descobre a coleção' }, styles: { columns: 3 } }; sections.push(productSection); }
    const pos = sections.indexOf(productSection);
    sections.splice(pos, 1);
    sections.splice(Math.min(1, sections.length), 0, productSection);
  } else if (id === 'clear-cta') {
    let hero = get('hero');
    if (!hero) { hero = { id: 'hero-forgepilot', type: 'hero', content: { title: store.name || 'A nossa loja' }, styles: {} }; sections.unshift(hero); }
    hero.content = { ...(hero.content || {}), buttonText: 'Explorar produtos' };
  } else {
    throw new Error('Melhoria não suportada.');
  }
  return config;
}
