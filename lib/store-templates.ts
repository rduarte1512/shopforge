import { getBannerSmartImage, isRandomPlaceholderImage } from './smart-images';

export type StoreTemplateId = 'minimal' | 'noir' | 'editorial' | 'vibrant' | 'nature' | 'tech';
export type HeroVariant = 'split' | 'centered' | 'editorial' | 'full-bleed' | 'product-led' | 'asymmetric';
export type ProductVariant = 'cards' | 'editorial' | 'compact' | 'bordered';

export const STORE_TEMPLATES: Array<{
  id: StoreTemplateId;
  name: string;
  description: string;
  background: string;
  text: string;
  accent: string;
  muted: string;
  heading: string;
  alignment: 'center' | 'left';
  layout: 'split' | 'center' | 'image-first';
  heroVariant: HeroVariant;
  productVariant: ProductVariant;
  sectionOrder: string[];
}> = [
  { id: 'minimal', name: 'Essencial', description: 'Montra minimalista com coleção primeiro', background: '#ffffff', text: '#18202e', accent: '#008060', muted: '#64748b', heading: 'Inter', alignment: 'left', layout: 'split', heroVariant: 'split', productVariant: 'cards', sectionOrder: ['hero', 'trust', 'products', 'story', 'faq', 'newsletter'] },
  { id: 'noir', name: 'Noir Luxury', description: 'Editorial de luxo com história e coleções', background: '#f8f5ef', text: '#191919', accent: '#a6793a', muted: '#756d64', heading: 'Georgia', alignment: 'center', layout: 'center', heroVariant: 'full-bleed', productVariant: 'editorial', sectionOrder: ['hero', 'story', 'categories', 'products', 'reviews', 'newsletter'] },
  { id: 'editorial', name: 'Atelier', description: 'Estilo revista: assimetria e imagem', background: '#fff8f5', text: '#2e1c25', accent: '#aa5273', muted: '#806873', heading: 'Georgia', alignment: 'left', layout: 'image-first', heroVariant: 'editorial', productVariant: 'editorial', sectionOrder: ['hero', 'categories', 'story', 'products', 'image', 'reviews', 'newsletter'] },
  { id: 'vibrant', name: 'Pop Market', description: 'Campanhas, ofertas e produtos em primeiro', background: '#fffdf0', text: '#251b36', accent: '#7653df', muted: '#736779', heading: 'Inter', alignment: 'center', layout: 'center', heroVariant: 'product-led', productVariant: 'compact', sectionOrder: ['trust', 'products', 'hero', 'categories', 'reviews', 'faq', 'newsletter'] },
  { id: 'nature', name: 'Botânica', description: 'Marca orgânica com narrativa visual', background: '#f6f8ed', text: '#27392c', accent: '#517858', muted: '#6f826f', heading: 'Georgia', alignment: 'left', layout: 'split', heroVariant: 'asymmetric', productVariant: 'bordered', sectionOrder: ['hero', 'story', 'image', 'categories', 'products', 'trust', 'newsletter'] },
  { id: 'tech', name: 'Nova Tech', description: 'Estilo escuro, especificações e conversão', background: '#0a1224', text: '#f8fafc', accent: '#20c5bb', muted: '#94a3b8', heading: 'Inter', alignment: 'left', layout: 'split', heroVariant: 'asymmetric', productVariant: 'compact', sectionOrder: ['hero', 'trust', 'categories', 'products', 'faq', 'reviews', 'newsletter'] },
];

type DraftSection = { id: string; type: string; content: Record<string, any>; styles: Record<string, any> };

const validSectionTypes = ['hero', 'products', 'text', 'image', 'button', 'spacer', 'trust', 'categories', 'reviews', 'faq', 'newsletter', 'story'];
const heroVariants: HeroVariant[] = ['split', 'centered', 'editorial', 'full-bleed', 'product-led', 'asymmetric'];
const productVariants: ProductVariant[] = ['cards', 'editorial', 'compact', 'bordered'];
const allowedFonts = ['Inter', 'Georgia', 'Arial', 'system-ui'];

function color(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value) ? value : fallback;
}
function limitedString(value: unknown, fallback: string, max = 260) {
  return typeof value === 'string' ? value.trim().slice(0, max) || fallback : fallback;
}

export function createDesignSections(
  order: string[], store: { name?: string; description?: string },
  choices: { heroVariant: HeroVariant; productVariant: ProductVariant; accent: string }
): DraftSection[] {
  const name = store.name || 'A tua loja';
  const description = store.description || 'Uma seleção pensada para ti.';
  const content: Record<string, Record<string, any>> = {
    hero: { eyebrow: 'Bem-vindo à nossa loja', title: name, subtitle: description, buttonText: 'Explorar coleção', secondButtonText: 'Saber mais' },
    trust: { title: 'Comprar com confiança', items: ['Pagamento protegido', 'Acompanhamento do pedido', 'Apoio ao cliente'] },
    categories: { title: 'Encontra o que procuras', subtitle: 'Explora as categorias da nossa loja.' },
    products: { title: 'A nossa coleção', subtitle: 'Escolhe os teus favoritos.', limit: 8 },
    story: { eyebrow: 'A nossa história', title: 'Uma marca feita com propósito', text: description, buttonText: 'Explorar produtos' },
    reviews: { title: 'Porque escolher a nossa loja', items: ['Seleção cuidada', 'Compra simples e segura', 'Uma experiência feita para ti'] },
    faq: { title: 'Perguntas frequentes', items: [
      { question: 'Como posso encomendar?', answer: 'Seleciona o produto e adiciona-o ao carrinho para finalizar a compra.' },
      { question: 'Como acompanho o meu pedido?', answer: 'Consulta as informações de acompanhamento disponibilizadas pela loja.' },
    ] },
    newsletter: { eyebrow: 'Novidades', title: 'Descobre primeiro as novidades', text: 'Acompanha os lançamentos e as coleções da nossa loja.', buttonText: 'Ver coleção' },
    image: { url: getBannerSmartImage(name + ' ' + description), alt: name + ' — imagem editorial' },
    text: { text: description },
    button: { text: 'Ver coleção', action: 'products', url: '#produtos' },
    spacer: {},
  };
  const styles: Record<string, Record<string, any>> = {
    hero: { height: choices.heroVariant === 'full-bleed' ? 680 : 560, textAlign: ['centered', 'full-bleed', 'product-led'].includes(choices.heroVariant) ? 'center' : 'left', variant: choices.heroVariant },
    products: { columns: choices.productVariant === 'editorial' ? 3 : 4, variant: choices.productVariant },
    story: { variant: choices.heroVariant === 'editorial' ? 'editorial' : 'split' },
    image: { textAlign: 'center' },
  };
  return order.filter(type => validSectionTypes.includes(type)).map((type, index) => ({
    id: type + '-' + (index + 1), type,
    content: { ...(content[type] || {}) },
    styles: { ...(styles[type] || {}) },
  }));
}

export function buildTemplateCustomization(
  store: { name?: string; description?: string; primary_color?: string; enableAccounts?: boolean },
  templateId: StoreTemplateId = 'minimal',
  accentOverride?: string
) {
  const t = STORE_TEMPLATES.find(item => item.id === templateId) || STORE_TEMPLATES[0];
  const accent = color(accentOverride, t.accent);
  const sections = createDesignSections(t.sectionOrder, store, { heroVariant: t.heroVariant, productVariant: t.productVariant, accent });
  const hero = sections.find(s => s.type === 'hero')!;
  return {
    layoutEngine: 'adaptive-v1' as const,
    templateId: t.id,
    templateLayout: t.layout,
    heroVariant: t.heroVariant,
    productVariant: t.productVariant,
    announcementText: 'Descobre a nossa coleção',
    accounts: { enabled: store.enableAccounts !== false, requireLoginForCheckout: false, allowRegistration: true },
    header: { sticky: true, logoPosition: t.id === 'noir' ? 'center' : 'left', height: 74 },
    hero: { height: hero.styles.height, textAlign: hero.styles.textAlign, showOverlay: true, overlayOpacity: 0.12, title: store.name || '', subtitle: store.description || '' },
    products: { columns: t.productVariant === 'editorial' ? 3 : 4, gap: 28, aspectRatio: 'portrait', showPrice: true, showStock: true },
    colors: { background: t.background, text: t.text, accent, muted: t.muted, primary: accent },
    fonts: { heading: t.heading, body: 'Inter' },
    sections,
  };
}

// Accepta blocos aprovados de IA, mas não HTML, scripts, layouts inexistentes ou URLs inventadas.
// Reordena as secções consoante a composição produzida, em vez de acrescentar sempre
// a mesma sequência de blocos ao fim da loja.
export function buildAdaptiveAiCustomization(raw: any, store: { name?: string; description?: string; primary_color?: string }, prompt: string) {
  const suggested = raw && typeof raw === 'object' ? raw : {};
  const text = (prompt || '').toLowerCase();
  const preferred = /moda|vestid|fashion|roupa|atelier|joia/.test(text) ? 'editorial'
    : /pesca|desporto|ferramenta|gaming|tecnologia|equipamento/.test(text) ? 'tech'
    : /cosm[eé]tic|beleza|natural|plantas|cuidado/.test(text) ? 'nature'
    : /promo|desconto|supermercado|oferta/.test(text) ? 'vibrant'
    : /luxo|premium|relojoaria|relogio/.test(text) ? 'noir' : 'minimal';
  const base = buildTemplateCustomization(store, preferred as StoreTemplateId, store.primary_color);
  const variant: HeroVariant = heroVariants.includes(suggested.heroVariant) ? suggested.heroVariant
    : heroVariants.includes(suggested.hero?.variant) ? suggested.hero.variant
    : base.heroVariant;
  const card: ProductVariant = productVariants.includes(suggested.productVariant) ? suggested.productVariant : base.productVariant;
  const rawSections = Array.isArray(suggested.sections) ? suggested.sections.slice(0, 14) : [];
  const baseByType = new Map(base.sections.map(s => [s.type, s]));
  const used = new Set<string>();
  let sections: DraftSection[] = rawSections.filter((s: any) => s && validSectionTypes.includes(s.type)).map((section: any, index: number) => {
    const type = section.type as string;
    const fallback = baseByType.get(type) || createDesignSections([type], store, { heroVariant: variant, productVariant: card, accent: base.colors.accent })[0];
    const sourceContent = section.content && typeof section.content === 'object' && !Array.isArray(section.content) ? section.content : {};
    const sourceStyles = section.styles && typeof section.styles === 'object' ? section.styles : {};
    const cleanContent: Record<string, any> = { ...fallback.content };
    for (const field of ['title', 'subtitle', 'eyebrow', 'text', 'buttonText', 'secondButtonText', 'alt']) {
      if (typeof sourceContent[field] === 'string') cleanContent[field] = limitedString(sourceContent[field], String(fallback.content[field] || ''), 320);
    }
    if (Array.isArray(sourceContent.items) && ['faq', 'trust', 'reviews'].includes(type)) {
      cleanContent.items = sourceContent.items.slice(0, 5).map((item: any) => {
        if (typeof item === 'string') return item.slice(0, 180);
        return { question: limitedString(item?.question, 'Pergunta'), answer: limitedString(item?.answer, 'Contacta a loja para mais informações.') };
      });
    }
    if (type === 'image' && typeof sourceContent.url === 'string' && /^https:\/\/images\.(unsplash|pexels)\.com\//.test(sourceContent.url)) {
      cleanContent.url = sourceContent.url;
    }
    if (type === 'products') cleanContent.limit = Math.max(2, Math.min(12, Number(sourceContent.limit) || 8));
    const styles = { ...fallback.styles, ...sourceStyles };
    if (type === 'hero') {
      styles.variant = heroVariants.includes(sourceStyles.variant) ? sourceStyles.variant : variant;
      styles.height = Math.max(380, Math.min(780, Number(sourceStyles.height) || 560));
    }
    if (type === 'products') {
      styles.variant = productVariants.includes(sourceStyles.variant) ? sourceStyles.variant : card;
      styles.columns = Math.max(2, Math.min(4, Number(sourceStyles.columns) || 4));
    }
    const id = type + '-ai-' + (index + 1);
    used.add(type);
    return { id, type, content: cleanContent, styles };
  });
  if (!sections.length) sections = base.sections;
  for (const type of ['hero', 'products']) {
    if (!sections.some(s => s.type === type)) {
      const block = createDesignSections([type], store, { heroVariant: variant, productVariant: card, accent: base.colors.accent })[0];
      if (type === 'hero') sections.unshift(block); else sections.push(block);
    }
  }
  // A IA decide a sequência visual; não inserir secções repetidas por defeito.
  const hero = sections.find(s => s.type === 'hero')!;
  const colors = {
    background: color(suggested.colors?.background, base.colors.background),
    text: color(suggested.colors?.text, base.colors.text),
    accent: color(suggested.colors?.accent, store.primary_color || base.colors.accent),
    muted: color(suggested.colors?.muted, base.colors.muted),
    primary: color(suggested.colors?.accent, store.primary_color || base.colors.accent),
  };
  return {
    ...base, ...suggested,
    layoutEngine: 'adaptive-v1' as const,
    templateId: 'ai-custom',
    templateLayout: 'custom',
    heroVariant: hero.styles.variant || variant,
    productVariant: card,
    announcementText: limitedString(suggested.announcementText, 'Descobre a coleção', 100),
    header: { ...base.header, ...(suggested.header || {}) },
    hero: { ...base.hero, title: store.name || '', subtitle: store.description || '', height: hero.styles.height },
    products: { ...base.products, ...(suggested.products || {}) },
    colors,
    fonts: { heading: allowedFonts.includes(suggested.fonts?.heading) ? suggested.fonts.heading : base.fonts.heading, body: 'Inter' },
    sections,
  };
}
