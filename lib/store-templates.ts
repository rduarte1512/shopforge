import { getBannerSmartImage } from './smart-images';

export type StoreTemplateId = 'minimal' | 'noir' | 'editorial' | 'vibrant' | 'nature' | 'tech';

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
}> = [
  { id: 'minimal', name: 'Essencial', description: 'Minimalista, leve e elegante', background: '#ffffff', text: '#18202e', accent: '#008060', muted: '#64748b', heading: 'Inter', alignment: 'left', layout: 'split' },
  { id: 'noir', name: 'Noir Luxury', description: 'Luxo, contrastes e tons dourados', background: '#f8f5ef', text: '#191919', accent: '#a6793a', muted: '#756d64', heading: 'Georgia', alignment: 'center', layout: 'center' },
  { id: 'editorial', name: 'Atelier', description: 'Editorial e moderno para moda', background: '#fff8f5', text: '#2e1c25', accent: '#aa5273', muted: '#806873', heading: 'Georgia', alignment: 'left', layout: 'image-first' },
  { id: 'vibrant', name: 'Pop Market', description: 'Cores vivas e vendas em destaque', background: '#fffdf0', text: '#251b36', accent: '#7653df', muted: '#736779', heading: 'Inter', alignment: 'center', layout: 'center' },
  { id: 'nature', name: 'Botânica', description: 'Natural, tranquilo e orgânico', background: '#f6f8ed', text: '#27392c', accent: '#517858', muted: '#6f826f', heading: 'Georgia', alignment: 'left', layout: 'split' },
  { id: 'tech', name: 'Nova Tech', description: 'Tecnológico e alto contraste', background: '#0a1224', text: '#f8fafc', accent: '#20c5bb', muted: '#94a3b8', heading: 'Inter', alignment: 'left', layout: 'split' },
];

export function buildTemplateCustomization(
  store: { name?: string; description?: string; primary_color?: string; enableAccounts?: boolean },
  templateId: StoreTemplateId = 'minimal',
  accentOverride?: string
) {
  const template = STORE_TEMPLATES.find((item) => item.id === templateId) || STORE_TEMPLATES[0];
  const accent = accentOverride || template.accent;
  const description = store.description || 'Descobre a nossa seleção de produtos.';
  const banner = getBannerSmartImage([store.name, description].join(' '), 0);
  const heroHeight = template.layout === 'image-first' ? 620 : template.layout === 'center' ? 590 : 520;
  const sections: Array<Record<string, unknown>> = [
    { id: 'hero-1', type: 'hero', content: { title: store.name || 'A tua loja', subtitle: description, buttonText: 'Explorar coleção' }, styles: { height: heroHeight, textAlign: template.alignment } },
    { id: 'text-1', type: 'text', content: { text: template.id === 'noir' ? 'Detalhes cuidadosamente selecionados. Uma experiência exclusiva.' : 'Uma experiência de compra criada para ti, com produtos selecionados com cuidado.' }, styles: { textAlign: template.alignment } },
  ];
  if (template.layout === 'image-first') {
    sections.push({ id: 'image-1', type: 'image', content: { url: banner, alt: 'Coleção ' + (store.name || '') }, styles: { textAlign: 'center' } });
  }
  sections.push({ id: 'products-1', type: 'products', content: { title: 'A nossa coleção' }, styles: { columns: template.id === 'editorial' ? 3 : 4, textAlign: 'left' } });
  if (template.id === 'vibrant' || template.id === 'noir') {
    sections.push({ id: 'cta-1', type: 'button', content: { text: 'Descobrir produtos', action: 'products', url: '#produtos' }, styles: { textAlign: 'center' } });
  }
  return {
    templateId: template.id,
    templateLayout: template.layout,
    accounts: { enabled: store.enableAccounts !== false, requireLoginForCheckout: false, allowRegistration: true },
    header: { sticky: true, logoPosition: template.id === 'noir' ? 'center' : 'left', height: template.id === 'editorial' ? 86 : 74 },
    hero: { height: heroHeight, textAlign: template.alignment, showOverlay: true, overlayOpacity: 0.12, title: store.name || '', subtitle: description },
    products: { columns: template.id === 'editorial' ? 3 : 4, gap: 28, aspectRatio: 'portrait', showPrice: true, showStock: true },
    colors: { background: template.background, text: template.text, accent, muted: template.muted, primary: accent },
    fonts: { heading: template.heading, body: 'Inter' },
    sections,
  };
}
