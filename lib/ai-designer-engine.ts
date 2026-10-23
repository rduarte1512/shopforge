// Operações controladas de edição do design. Este módulo não depende da API Gemini.
export type DesignerReply = {
  status: 'updated' | 'answer' | 'clarification' | 'error';
  message: string;
  customization?: any;
  changes?: string[];
};

export type DesignerOperation = {
  type: 'color' | 'text' | 'hero-variant' | 'product-variant' | 'columns' | 'add-section' | 'remove-section' | 'move-section' | 'font' | 'theme';
  target?: string;
  value?: string | number;
  position?: 'first' | 'last' | 'before' | 'after';
  relativeTo?: string;
};

const palette: Array<[string, string]> = [
  ['azul escuro', '#172554'], ['azul marinho', '#172554'], ['azul claro', '#38bdf8'],
  ['verde escuro', '#14532d'], ['verde claro', '#86efac'], ['rosa claro', '#f9a8d4'],
  ['rosa choque', '#ec4899'], ['cinzento escuro', '#334155'], ['cinza escuro', '#334155'],
  ['cinzento claro', '#e2e8f0'], ['cinza claro', '#e2e8f0'],
  ['preto', '#0f172a'], ['branco', '#ffffff'], ['dourado', '#b68a36'],
  ['laranja', '#f97316'], ['amarelo', '#eab308'], ['roxo', '#7c3aed'],
  ['violeta', '#7c3aed'], ['vermelho', '#dc2626'], ['rosa', '#ec4899'],
  ['azul', '#2563eb'], ['verde', '#16a34a'], ['bege', '#e9dcc8'],
  ['cinzento', '#64748b'], ['cinza', '#64748b'], ['castanho', '#92400e'],
];
const heroVariants = new Set(['split', 'centered', 'editorial', 'full-bleed', 'product-led', 'asymmetric']);
const productVariants = new Set(['cards', 'editorial', 'compact', 'bordered']);
const allowedSections = new Set(['hero','products','text','image','button','spacer','trust','categories','reviews','faq','newsletter','story']);
const optionalSections = new Set(['text','image','button','spacer','trust','categories','reviews','faq','newsletter','story']);
const fonts = new Set(['Inter','Georgia','Arial','system-ui']);

function normalize(text: string) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}
function isHexColor(input: string) {
  return /^#[0-9a-f]{6}$/i.test(input);
}
function detectColor(input: string): string | null {
  const hex = input.match(/#[a-f0-9]{6}\b/i);
  if (hex) return hex[0].toLowerCase();
  const short = input.match(/#[a-f0-9]{3}\b/i);
  if (short) return '#' + short[0].slice(1).split('').map(c => c + c).join('').toLowerCase();
  const normalized = normalize(input);
  const found = palette.find(([name]) => new RegExp('(?:^|[^a-z])' + name + '(?=$|[^a-z])').test(normalized));
  return found ? found[1] : null;
}
function validField(input: unknown, max = 320): string | null {
  return typeof input === 'string' && input.trim().length > 0 && input.length <= max ? input.trim() : null;
}
function editableSection(config: any, type: string) {
  return Array.isArray(config.sections) ? config.sections.find((s: any) => s?.type === type) : null;
}
function sampleSection(type: string) {
  const all: Record<string, any> = {
    trust: { title: 'Compra com confiança', items: ['Compra simples', 'Apoio ao cliente', 'Acompanhamento do pedido'] },
    categories: { title: 'Explorar categorias', subtitle: 'Encontra o que procuras.' },
    story: { eyebrow: 'Quem somos', title: 'A nossa história', text: 'Descobre o que torna a nossa marca especial.' },
    reviews: { title: 'O nosso compromisso', items: ['Produtos escolhidos com cuidado', 'Processo de compra simples', 'Apoio ao cliente'] },
    faq: { title: 'Perguntas frequentes', items: [{question:'Como comprar?', answer:'Adiciona os produtos ao carrinho e finaliza a compra.'}] },
    newsletter: { eyebrow: 'Descobre mais', title: 'Conhece as novidades', text: 'Explora os produtos em destaque.', buttonText: 'Explorar coleção' },
    text: { text: 'Descobre a nossa coleção.' },
    button: { text: 'Ver produtos', action: 'products' },
    spacer: {},
    image: { url: '', alt: 'Imagem da coleção' },
  };
  return {id: type + '-assistant-' + Date.now(),type,content:all[type],styles: {}};
}

export function applyDesignerOperations(original: any, operations: unknown): { config: any; changes: string[] } {
  const base = original && typeof original === 'object' && !Array.isArray(original) ? original : {};
  const config = JSON.parse(JSON.stringify(base));
  if (!Array.isArray(config.sections)) config.sections = [];
  if (!config.colors || typeof config.colors !== 'object') config.colors = {};
  const changes: string[] = [];
  const list = Array.isArray(operations) ? operations.slice(0, 8) : [];
  for (const input of list) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) continue;
    const op = input as DesignerOperation;
    const target = op.target || '';
    const value = op.value;
    if (op.type === 'color') {
      const next = typeof value === 'string' ? detectColor(value) : null;
      if (!next || !isHexColor(next)) continue;
      if (target === 'hero') {
        const hero = editableSection(config, 'hero');
        if (!hero) continue;
        hero.styles = hero.styles || {};
        if (hero.styles.backgroundColor === next) continue;
        hero.styles.backgroundColor = next;
        changes.push('Cor do banner alterada para ' + next);
      } else if (target === 'background' || target === 'accent' || target === 'text') {
        const field = target === 'background' ? 'background' : target === 'text' ? 'text' : 'accent';
        if (config.colors[field] === next) continue;
        config.colors[field] = next;
        if (field === 'accent') config.colors.primary = next;
        changes.push('Cor ' + (field === 'accent' ? 'de destaque' : field === 'text' ? 'do texto' : 'do fundo') + ' alterada para ' + next);
      }
    } else if (op.type === 'text') {
      const valueText = validField(value);
      if (!valueText) continue;
      const fields: Record<string,string[]> = {
        hero: ['title','subtitle','buttonText','eyebrow'],
        products: ['title','subtitle'], story:['title','text','eyebrow'],
        newsletter:['title','text','eyebrow','buttonText'], categories:['title','subtitle'],
        trust:['title'], reviews:['title'], faq:['title'], text:['text'], button:['text']
      };
      const [type, field] = target.split('.');
      const section = editableSection(config,type);
      if (!section || !fields[type]?.includes(field)) continue;
      section.content = section.content || {};
      if (section.content[field] === valueText) continue;
      section.content[field] = valueText;
      if (type === 'hero' && (field === 'title' || field === 'subtitle')) {
        config.hero = { ...(config.hero || {}), [field]: valueText };
      }
      changes.push('Texto de ' + type + ' atualizado');
    } else if (op.type === 'hero-variant') {
      const variant = String(value || '');
      if (config.layoutEngine !== 'adaptive-v1' || !heroVariants.has(variant)) continue;
      const hero = editableSection(config, 'hero');
      if (!hero || hero.styles?.variant === variant) continue;
      hero.styles = { ...(hero.styles || {}), variant };
      config.heroVariant = variant;
      changes.push('Formato do banner atualizado');
    } else if (op.type === 'product-variant') {
      const variant = String(value || '');
      if (config.layoutEngine !== 'adaptive-v1' || !productVariants.has(variant)) continue;
      const section = editableSection(config,'products');
      if (!section || section.styles?.variant === variant) continue;
      section.styles = { ...(section.styles || {}), variant };
      config.productVariant = variant;
      changes.push('Estilo das fichas de produtos atualizado');
    } else if (op.type === 'columns') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 2 || n > 4) continue;
      const section = editableSection(config,'products');
      if (!section || section.styles?.columns === n) continue;
      section.styles = { ...(section.styles || {}), columns: n };
      config.products = { ...(config.products || {}), columns: n };
      changes.push('Produtos organizados em ' + n + ' colunas');
    } else if (op.type === 'font') {
      const font = String(value || '');
      if (!fonts.has(font)) continue;
      config.fonts = { ...(config.fonts || {}) };
      if (config.fonts.heading === font) continue;
      config.fonts.heading = font;
      changes.push('Tipografia do título alterada para ' + font);
    } else if (op.type === 'theme') {
      if (!['dark','light'].includes(String(value))) continue;
      const dark = value === 'dark';
      const proposed = dark ? {background:'#0f172a', text:'#f8fafc', muted:'#cbd5e1'} : {background:'#ffffff',text:'#0f172a',muted:'#64748b'};
      if (config.colors.background === proposed.background && config.colors.text === proposed.text) continue;
      Object.assign(config.colors,proposed);
      changes.push('Tema ' + (dark ? 'escuro' : 'claro') + ' aplicado');
    } else if (op.type === 'add-section') {
      const sectionType = String(value || '');
      if (!optionalSections.has(sectionType) || config.layoutEngine !== 'adaptive-v1' || config.sections.length >= 18) continue;
      const block = sampleSection(sectionType);
      if (!block) continue;
      config.sections.push(block);
      changes.push('Secção ' + sectionType + ' adicionada');
    } else if (op.type === 'remove-section') {
      const sectionType = String(value || '');
      if (!optionalSections.has(sectionType) || config.layoutEngine !== 'adaptive-v1') continue;
      const i = config.sections.findIndex((s: any) => s.type === sectionType);
      if (i < 0) continue;
      config.sections.splice(i,1);
      changes.push('Secção ' + sectionType + ' removida');
    } else if (op.type === 'move-section') {
      if (config.layoutEngine !== 'adaptive-v1') continue;
      const moveType = String(target);
      const from = config.sections.findIndex((s: any) => s.type === moveType);
      if (!allowedSections.has(moveType) || from < 0) continue;
      let to = op.position === 'first' ? 0 : op.position === 'last' ? config.sections.length - 1 : -1;
      if (op.position === 'before' || op.position === 'after') {
        const ref = config.sections.findIndex((s: any) => s.type === op.relativeTo);
        if (ref < 0 || ref === from) continue;
        to = ref + (op.position === 'after' ? 1 : 0);
        if (from < to) to--;
      }
      if (to < 0 || to === from) continue;
      const [block] = config.sections.splice(from,1);
      config.sections.splice(to,0,block);
      changes.push('Secção ' + moveType + ' reposicionada');
    }
  }
  return { config, changes };
}

export function planLocalDesignerEdit(currentConfig: any, message: string): DesignerReply | null {
  const input = (message || '').trim();
  const text = normalize(input);
  if (!text) return { status:'clarification', message:'Escreve o que gostarias de mudar na loja.' };
  if (/(?:o que|que|quais).*(?:consegues|podes|sabes|fazeres|fazer)|(?:ajuda|funcionalidades|exemplos)/.test(text) && !/(?:muda|altera|troca|edita|cria)\s/.test(text)) {
    return {status:'answer', message:'Posso mudar as cores do banner, fundo e botões; escrever títulos e descrições; alterar tipos de banner, estilos de produtos e tipografia; acrescentar ou reorganizar secções como categorias, FAQ e história. Por exemplo: “muda o banner para azul escuro”, “altera o título do banner para Novidades de Outono” ou “coloca os produtos antes do banner”. As alterações aparecem primeiro na pré-visualização; depois clicas em Guardar alterações.'};
  }
  const mentionsBanner = /(?:banner|hero|cabecalho principal)/.test(text);
  const wantsColor = /(?:cor|fundo|background|color)/.test(text) || (mentionsBanner && /(?:muda|troca|altera|modifica|mete|poe|coloca|define|aplica)/.test(text) && !!detectColor(input));
  if (wantsColor && /(?:muda|troca|altera|modifica|mete|poe|coloca|quero|define|aplica|faz)/.test(text)) {
    const selected = detectColor(input);
    if (!selected && /(?:quente|fria|pastel|suave|vibrante|moderna|elegante|premium)/.test(text)) return null;
    if (!selected) return {status:'clarification',message:'Claro! Para que cor queres mudar ' + (mentionsBanner ? 'o banner' : 'o design') + '? Podes dizer, por exemplo, “azul escuro”, “verde” ou uma cor HEX como #1e40af.'};
    const target = mentionsBanner ? 'hero' : /(?:fundo|background)/.test(text) ? 'background' : /(?:texto|letras)/.test(text) ? 'text' : 'accent';
    const result = applyDesignerOperations(currentConfig,[{type:'color',target,value:selected}]);
    if (!result.changes.length) return {status:'answer',message:'Essa cor já está aplicada ou não existe um banner editável.'};
    return {status:'updated',message:result.changes[0] + '. A mudança está na pré-visualização. Clica em Guardar alterações para publicar.',customization:result.config,changes:result.changes};
  }
  const textMatch = input.match(/(?:muda|troca|altera|atualiza|mete|coloca|define)\s+(?:o\s+)?(?:titulo|título|texto principal|subtitulo|subtítulo)\s+(?:do\s+)?(?:banner|hero)?\s*(?:para|por|:)\s+(.+)$/i);
  if (textMatch) {
    const title = /subt[ií]tulo/i.test(input) ? 'subtitle' : 'title';
    const result = applyDesignerOperations(currentConfig,[{type:'text',target:'hero.'+title,value:textMatch[1]}]);
    if (result.changes.length) return {status:'updated', message:'Texto do banner atualizado na pré-visualização. Clica em Guardar alterações para publicar.', customization:result.config,changes:result.changes};
  }
  const themeMatch = text.match(/(?:modo|tema|fundo|estilo)\s+(escuro|claro)/);
  if (themeMatch && /(?:muda|mete|coloca|quero|aplica|troca|altera|faz)/.test(text)) {
    const result=applyDesignerOperations(currentConfig,[{type:'theme',value:themeMatch[1]==='escuro'?'dark':'light'}]);
    if(result.changes.length) return {status:'updated',message:'Tema atualizado na pré-visualização. Clica em Guardar alterações para publicar.',customization:result.config,changes:result.changes};
  }
  return null;
}
