// Pure, shared logic for ForgePilot Command Center.
import { contrastRatio, safeConfig } from './forgepilot-engine';
export type ChangeKind = 'hero' | 'accent' | 'product-name' | 'product-description';
export type ChangeInput = { kind: ChangeKind; targetId?: string; value: string };
export type ChangePreview = { kind: ChangeKind; targetId?: string; label: string; before: string; after: string; version: string };
export type Diagnostic = { name: string; score: number | null; checks: { title: string; passed: boolean; evidence: string }[]; note?: string };
export type Alert = { title: string; detail: string; severity: 'high' | 'medium' | 'info'; href: string };
export const CHANGE_LABELS: Record<ChangeKind,string> = { hero: 'Título do banner', accent: 'Cor de destaque', 'product-name': 'Nome do produto', 'product-description': 'Descrição do produto' };
export const MARKETING_TYPES = ['meta', 'google', 'seo', 'email', 'social', 'promotion'] as const;
export type MarketingKind = typeof MARKETING_TYPES[number];
export function validChange(input: unknown): ChangeInput {
  if (!input || typeof input !== 'object') throw Error('Proposta inválida.');
  const r = input as Partial<ChangeInput>;
  if (!r.kind || !Object.prototype.hasOwnProperty.call(CHANGE_LABELS, r.kind)) throw Error('Tipo de alteração não permitido.');
  const value = typeof r.value === 'string' ? r.value.trim() : '';
  const max = r.kind === 'product-description' ? 1800 : r.kind === 'accent' ? 7 : 120;
  if (!value || value.length > max || /[<>]/.test(value)) throw Error('Texto inválido ou demasiado longo.');
  if (r.kind === 'accent' && !/^#[0-9a-f]{6}$/i.test(value)) throw Error('Usa uma cor HEX de seis dígitos.');
  if (r.kind.startsWith('product-') && (typeof r.targetId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.targetId))) throw Error('Seleciona um produto.');
  return { kind: r.kind, value, ...(r.kind.startsWith('product-') ? { targetId: r.targetId } : {}) };
}
export function getHeroTitle(store: any): string {
  const c = safeConfig(store?.customization);
  const hero = Array.isArray(c.sections) ? c.sections.find((s: any) => s?.type === 'hero') : undefined;
  return String(hero?.content?.title || c.hero?.title || store?.name || '').slice(0, 120);
}
export function changeConfig(store: any, input: ChangeInput) {
  const v = validChange(input);
  const c = JSON.parse(JSON.stringify(safeConfig(store.customization)));
  if (v.kind === 'accent') {
    c.colors = { ...c.colors, accent: v.value };
  } else if (v.kind === 'hero') {
    if (!Array.isArray(c.sections) || !c.sections.some((s: any) => s?.type === 'hero')) throw Error('Cria primeiro um banner no editor de loja.');
    c.sections = c.sections.map((s: any) => s?.type === 'hero' ? { ...s, content: { ...s.content, title: v.value } } : s);
    c.hero = { ...c.hero, title: v.value };
  } else throw Error('Esta alteração não pertence ao design.');
  return c;
}
export function advancedDiagnostics(store: any, products: any[]): Diagnostic[] {
  const c = safeConfig(store.customization);
  const sections = Array.isArray(c.sections) ? c.sections : [];
  const hero = sections.find((s: any) => s?.type === 'hero');
  const n = products.length;
  const ratio = (fn: (p: any) => boolean) => n ? Math.round(products.filter(fn).length / n * 100) : 0;
  const descriptions = ratio(p => String(p.description || '').trim().length >= 80);
  const pictures = ratio(p => Boolean(String(p.image_url || '').trim()));
  const names = ratio(p => String(p.name || '').trim().length >= 8 && String(p.name || '').trim().length <= 70);
  const prices = ratio(p => Number(p.price) > 0);
  const group = (name: string, checks: Diagnostic['checks'], note?: string): Diagnostic => ({ name, score: checks.length ? Math.round(100 * checks.filter(c => c.passed).length / checks.length) : null, checks, note });
  const check = (title: string, passed: boolean, evidence: string) => ({ title, passed, evidence });
  const configContrast = contrastRatio(c.colors?.text, c.colors?.background);
  const imageContrast = contrastRatio('#ffffff', c.colors?.accent);
  return [
    group('Design e identidade', [check('Banner com proposta de valor', String(hero?.content?.subtitle || '').length >= 25, 'Texto secundário do banner'), check('Cores configuradas', /^#[a-f0-9]{6}$/i.test(String(c.colors?.accent || '')), 'Cor de destaque definida'), check('Estrutura de secções', sections.length >= 3, sections.length + ' secções configuradas')]),
    group('Preparação para conversão', [check('Chamada para ação', Boolean(hero?.content?.buttonText), 'Botão no banner'), check('Catálogo no início', sections.findIndex((s: any) => s.type === 'products') >= 0 && sections.findIndex((s: any) => s.type === 'products') < 4, 'Posição da coleção'), check('Preços válidos', n > 0 && prices === 100, prices + '% do catálogo')], 'Não prevê vendas.'),
    group('SEO — conteúdo', [check('Descrição da loja', String(store.description || '').length >= 80, 'Texto disponível na configuração; não mede indexação'), check('Títulos informativos', n > 0 && names >= 80, names + '% entre 8 e 70 caracteres'), check('Descrições informativas', n > 0 && descriptions >= 80, descriptions + '% com pelo menos 80 caracteres')], 'Heurísticas de conteúdo, não uma auditoria de ranking ou metadados HTML.'),
    group('Qualidade do catálogo', [check('Imagens registadas', n > 0 && pictures === 100, pictures + '% com URL de imagem'), check('Descrições detalhadas', n > 0 && descriptions >= 80, descriptions + '% de produtos'), check('Stock preenchido', n > 0 && ratio(p => p.stock != null && Number(p.stock) >= 0) === 100, 'Valores de stock configurados')]),
    group('Confiança', [check('Informação de confiança', sections.some((s: any) => s.type === 'trust'), 'Secção informativa'), check('Perguntas frequentes', sections.some((s: any) => s.type === 'faq'), 'Secção FAQ')]),
    group('Acessibilidade — configuração', [check('Contraste de texto', configContrast >= 4.5, configContrast.toFixed(2) + ':1'), check('Texto branco no destaque', imageContrast >= 4.5, imageContrast.toFixed(2) + ':1 (quando utilizado)')], 'Não certifica conformidade WCAG da página renderizada.'),
    group('Experiência mobile', [], 'Por medir: requer inspeção da loja em ecrãs móveis.'),
    group('Performance técnica', [], 'Por medir: requer Lighthouse ou métricas reais do navegador.'),
  ];
}
export function experimentVariant(visitorId: string): 'A' | 'B' {
  return parseInt(visitorId.slice(-1), 16) % 2 === 0 ? 'A' : 'B';
}
export function experimentTitle(config: any, title: string): any {
  if (!Array.isArray(config?.sections)) return config;
  return { ...config, sections: config.sections.map((s: any) => s.type === 'hero' ? { ...s, content: { ...s.content, title } } : s) };
}
export function experimentResult(a: {exposed:number;converted:number}, b: {exposed:number;converted:number}) {
  const rate = (x: typeof a) => x.exposed > 0 ? x.converted / x.exposed : null;
  const ar = rate(a), br = rate(b);
  if (ar === null || br === null || Math.min(a.exposed,b.exposed) < 100 || Math.min(a.converted,b.converted,a.exposed-a.converted,b.exposed-b.converted)<5) return { a: ar, b: br, signal: 'Amostra insuficiente' };
  const pooled = (a.converted+b.converted)/(a.exposed+b.exposed);
  const se = Math.sqrt(pooled*(1-pooled)*(1/a.exposed+1/b.exposed));
  const z = se ? (br-ar)/se : 0;
  return { a:ar,b:br,signal:Math.abs(z)>=1.96 ? 'Diferença indicativa; confirma no fim do teste (não é um vencedor automático)' : 'Sem diferença conclusiva' };
}
export function safeExpenses(value: unknown) {
  const r = (value && typeof value==='object' ? value : {}) as Record<string,unknown>;
  return Object.fromEntries(['ads','shipping','fees','other'].map(key => {
    const n = r[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 10000000) throw Error('Indica custos válidos e não negativos.');
    return [key, Math.round(n*100)/100];
  })) as { ads:number;shipping:number;fees:number;other:number };
}
