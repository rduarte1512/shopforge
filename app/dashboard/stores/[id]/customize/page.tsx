'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Monitor,
  MousePointer2,
  Palette,
  Phone,
  Plus,
  Save,
  Send,
  Settings,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import {
  getMyStoresAction,
  getStoreProductsAction,
  updateStoreCustomizationAction,
} from '@/lib/actions';
import { updateStoreCustomizationWithAI } from '@/lib/ai-actions';

type EditorTab = 'ai' | 'manual';
type PreviewMode = 'desktop' | 'mobile';

const DESIGN_PRESETS = [
  {
    id: 'luxury',
    name: 'Luxo Editorial',
    description: 'Premium, elegante e sofisticado',
    colors: { background: '#fffaf0', text: '#111827', accent: '#b7791f', muted: '#8a6f3d', primary: '#b7791f' },
    header: { sticky: true, logoPosition: 'center', height: 76 },
    heroHeight: 560,
    columns: 4,
  },
  {
    id: 'midnight',
    name: 'Midnight Pro',
    description: 'Escuro, tecnológico e forte',
    colors: { background: '#050816', text: '#f8fafc', accent: '#22c55e', muted: '#94a3b8', primary: '#22c55e' },
    header: { sticky: true, logoPosition: 'left', height: 78 },
    heroHeight: 540,
    columns: 3,
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    description: 'Branco, simples e moderno',
    colors: { background: '#ffffff', text: '#0f172a', accent: '#008060', muted: '#64748b', primary: '#008060' },
    header: { sticky: true, logoPosition: 'left', height: 68 },
    heroHeight: 460,
    columns: 4,
  },
  {
    id: 'bold',
    name: 'Bold Commerce',
    description: 'Chamativo, jovem e vendedor',
    colors: { background: '#fff7ed', text: '#1f2937', accent: '#f97316', muted: '#78716c', primary: '#f97316' },
    header: { sticky: true, logoPosition: 'left', height: 74 },
    heroHeight: 520,
    columns: 3,
  },
];

function getDefaultCustomization(store: any) {
  const accent = store?.primary_color || store?.primaryColor || '#008060';
  const description = store?.description || 'Produtos selecionados com qualidade, estilo e atenção ao detalhe.';

  return {
    header: { sticky: true, logoPosition: 'left', height: 72 },
    hero: {
      height: 500,
      textAlign: 'center',
      showOverlay: true,
      overlayOpacity: 0.1,
      title: store?.name || 'A tua loja online',
      subtitle: description,
    },
    products: { columns: 4, gap: 28, aspectRatio: 'portrait', showPrice: true, showStock: true },
    colors: { background: '#ffffff', text: '#0f172a', accent, muted: '#64748b', primary: accent },
    fonts: { heading: 'Inter', body: 'Inter' },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        content: { title: store?.name || 'A tua loja online', subtitle: description, buttonText: 'Ver coleção' },
        styles: { height: 500, textAlign: 'center' },
      },
      {
        id: 'text-1',
        type: 'text',
        content: { text: 'Descobre uma experiência de compra pensada para ser simples, elegante e memorável.' },
        styles: { textAlign: 'center' },
      },
      {
        id: 'products-1',
        type: 'products',
        content: { title: 'Produtos em destaque' },
        styles: { columns: 4, textAlign: 'left' },
      },
    ],
  };
}

function normalizeCustomization(config: any, store: any) {
  const fallback = getDefaultCustomization(store);
  const hasSections = Array.isArray(config?.sections) && config.sections.length > 0;

  return {
    ...fallback,
    ...(config && typeof config === 'object' ? config : {}),
    header: { ...fallback.header, ...(config?.header || {}) },
    hero: { ...fallback.hero, ...(config?.hero || {}) },
    products: { ...fallback.products, ...(config?.products || {}) },
    colors: { ...fallback.colors, ...(config?.colors || {}) },
    fonts: { ...fallback.fonts, ...(config?.fonts || {}) },
    sections: hasSections ? config.sections : fallback.sections,
  };
}

function buildSection(type: string) {
  const id = `${type}-${Date.now()}`;

  if (type === 'hero') {
    return {
      id,
      type,
      content: { title: 'Nova coleção', subtitle: 'Uma seleção especial preparada para ti.', buttonText: 'Comprar agora' },
      styles: { height: 460, textAlign: 'center' },
    };
  }

  if (type === 'products') {
    return { id, type, content: { title: 'Produtos em destaque' }, styles: { columns: 4, textAlign: 'left' } };
  }

  if (type === 'button') {
    return { id, type, content: { text: 'Comprar agora', action: 'link', url: '#' }, styles: { textAlign: 'center' } };
  }

  if (type === 'image') {
    return {
      id,
      type,
      content: { url: 'https://picsum.photos/seed/shopforge-banner/1200/520', alt: 'Banner da loja' },
      styles: { textAlign: 'center' },
    };
  }

  if (type === 'spacer') return { id, type, content: {}, styles: { height: 48 } };

  return {
    id,
    type: 'text',
    content: { text: 'Escreve aqui uma mensagem forte para os teus clientes.' },
    styles: { textAlign: 'center' },
  };
}

function SectionIcon({ type }: { type: string }) {
  if (type === 'hero') return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (type === 'products') return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
  if (type === 'button') return <MousePointer2 className="w-4 h-4 text-purple-500" />;
  if (type === 'image') return <ImageIcon className="w-4 h-4 text-pink-500" />;
  return <Type className="w-4 h-4 text-orange-500" />;
}

function sectionLabel(type: string) {
  if (type === 'hero') return 'Banner Hero';
  if (type === 'products') return 'Grelha de Produtos';
  if (type === 'button') return 'Botão de Conversão';
  if (type === 'image') return 'Imagem / Banner';
  if (type === 'spacer') return 'Espaçador';
  return 'Bloco de Texto';
}

export default function StoreCustomizePage() {
  const { id } = useParams() as { id: string };
  const [store, setStore] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EditorTab>('ai');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customization, setCustomization] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      try {
        const stores = await getMyStoresAction();
        const storeData = stores.find((storeItem: any) => storeItem.id === id);

        if (!storeData) throw new Error('Store not found');

        const productsData = await getStoreProductsAction(id);
        const safeCustomization = normalizeCustomization(storeData.customization, storeData);

        setStore(storeData);
        setStoreProducts(productsData || []);
        setCustomization(safeCustomization);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const safeCustomization = useMemo(() => {
    if (!store) return null;
    return normalizeCustomization(customization, store);
  }, [customization, store]);

  const updateCustomization = (next: any) => setCustomization(normalizeCustomization(next, store));

  const updateSection = (sectionId: string, data: any) => {
    updateCustomization({
      ...safeCustomization,
      sections: safeCustomization.sections.map((section: any) =>
        section.id === sectionId ? { ...section, ...data } : section
      ),
    });
  };

  const addSection = (type: string) => {
    const section = buildSection(type);
    updateCustomization({ ...safeCustomization, sections: [...safeCustomization.sections, section] });
    setExpandedSection(section.id);
  };

  const removeSection = (sectionId: string) => {
    updateCustomization({
      ...safeCustomization,
      sections: safeCustomization.sections.filter((section: any) => section.id !== sectionId),
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextSections = [...safeCustomization.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextSections.length) return;
    [nextSections[index], nextSections[targetIndex]] = [nextSections[targetIndex], nextSections[index]];
    updateCustomization({ ...safeCustomization, sections: nextSections });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isProcessing || !safeCustomization) return;

    const userMessage = chatInput.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsProcessing(true);

    try {
      const updatedConfig = await updateStoreCustomizationWithAI(safeCustomization, userMessage);
      updateCustomization(updatedConfig);
      setMessages((prev) => [...prev, { role: 'ai', content: 'Feito! Atualizei a preview da loja com um visual mais forte e coerente.' }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'ai', content: 'Não consegui aplicar essa alteração. Tenta escrever de outra forma.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!safeCustomization) return;
    setIsSaving(true);

    try {
      await updateStoreCustomizationAction(id, safeCustomization);
      setMessages((prev) => [...prev, { role: 'ai', content: 'Alterações guardadas com sucesso.' }]);
    } catch (err) {
      console.error('Error saving customization:', err);
      alert('Erro ao guardar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 animate-spin text-shopify-green mb-4" />
        <p className="text-gray-500 font-medium">A carregar o editor...</p>
      </div>
    );
  }

  if (!store || !safeCustomization) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center font-sans p-6 text-center">
        <Trash2 className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Loja não encontrada</h2>
        <p className="text-gray-500 mb-6">A loja que estás a tentar customizar não existe ou não tens permissão.</p>
        <Link href="/dashboard/stores" className="bg-shopify-green text-white px-6 py-2 rounded-lg font-bold">Voltar para Lojas</Link>
      </div>
    );
  }

  const colors = safeCustomization.colors;
  const header = safeCustomization.header;
  const productsSectionSettings = safeCustomization.products;
  const heroSection = safeCustomization.sections.find((section: any) => section.type === 'hero');

  const applyPreset = (preset: any) => {
    const nextSections = safeCustomization.sections.map((section: any) => {
      if (section.type === 'hero') {
        return { ...section, styles: { ...section.styles, height: preset.heroHeight, textAlign: preset.header.logoPosition === 'center' ? 'center' : section.styles?.textAlign || 'center' } };
      }

      if (section.type === 'products') {
        return { ...section, styles: { ...section.styles, columns: preset.columns } };
      }

      return section;
    });

    updateCustomization({
      ...safeCustomization,
      header: { ...safeCustomization.header, ...preset.header },
      hero: { ...safeCustomization.hero, height: preset.heroHeight },
      products: { ...safeCustomization.products, columns: preset.columns },
      colors: preset.colors,
      sections: nextSections,
    });
  };

  const updateHeroField = (field: string, value: any) => {
    if (!heroSection) return;
    updateSection(heroSection.id, { content: { ...heroSection.content, [field]: value } });
  };

  const updateHeroStyle = (field: string, value: any) => {
    if (!heroSection) return;
    updateSection(heroSection.id, { styles: { ...heroSection.styles, [field]: value } });
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans overflow-hidden">
      <header className="h-14 border-b border-gray-100 px-4 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stores" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="h-6 w-px bg-gray-100" />
          <div>
            <h1 className="text-sm font-bold text-gray-900">{store.name}</h1>
            <p className="text-[11px] text-gray-400 font-medium">Editor Visual • Em direto</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}><Monitor className="w-4 h-4" /></button>
            <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}><Smartphone className="w-4 h-4" /></button>
          </div>

          <button onClick={handleSave} disabled={isSaving} className="ml-2 bg-shopify-green text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-gray-50">
        <aside className="w-[420px] border-r border-gray-100 bg-white flex flex-col z-10 shadow-xl">
          <div className="flex p-4 gap-2">
            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}><Sparkles className="w-3.5 h-3.5" /> Assistente IA</button>
            <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}><Settings className="w-3.5 h-3.5" /> Manual Pro</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-5">
            {activeTab === 'ai' ? (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                    <span className="text-sm font-bold text-blue-900">IA Designer</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">Pede mudanças simples ou grandes. Exemplo: “faz uma loja premium, luxuosa, com fundo escuro, hero forte e produtos em destaque”.</p>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-4 mb-4 overflow-y-auto min-h-0 pr-2">
                  {messages.length === 0 && (
                    <div className="text-center py-10"><MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Começa uma conversa com o assistente...</p></div>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${message.role === 'user' ? 'bg-shopify-green text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none font-medium'}`}>{message.content}</div>
                    </div>
                  ))}
                  {isProcessing && <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none inline-flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin text-gray-400" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A pensar...</span></div>}
                </div>

                <div className="relative mt-auto">
                  <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), handleSendMessage())} placeholder="O que queres mudar na loja?" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all resize-none" rows={3} />
                  <button onClick={handleSendMessage} disabled={!chatInput.trim() || isProcessing} className="absolute right-3 bottom-3 p-2 bg-shopify-green text-white rounded-xl shadow-lg disabled:opacity-50"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Presets rápidos</h3>
                    <span className="text-[10px] font-bold text-gray-300">1 clique</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {DESIGN_PRESETS.map((preset) => (
                      <button key={preset.id} onClick={() => applyPreset(preset)} className="text-left p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-lg transition-all group">
                        <div className="flex items-center gap-1 mb-3">
                          {Object.values(preset.colors).slice(0, 3).map((color: any) => <span key={color} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />)}
                        </div>
                        <p className="text-xs font-black text-gray-900 group-hover:text-shopify-green">{preset.name}</p>
                        <p className="text-[10px] text-gray-400 mt-1 leading-tight">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-slate-950 text-white rounded-3xl p-4 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Settings className="w-3 h-3" /> Layout principal</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => updateCustomization({ ...safeCustomization, header: { ...header, sticky: !header.sticky } })} className={`p-3 rounded-2xl text-left border ${header.sticky ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                      <span className="block text-[10px] uppercase font-black">Header fixo</span>
                      <span className="text-xs font-bold">{header.sticky ? 'Ativo' : 'Desativo'}</span>
                    </button>
                    <button onClick={() => updateCustomization({ ...safeCustomization, header: { ...header, logoPosition: header.logoPosition === 'left' ? 'center' : 'left' } })} className="p-3 rounded-2xl text-left border bg-white/5 border-white/10 text-slate-300">
                      <span className="block text-[10px] uppercase font-black">Logo</span>
                      <span className="text-xs font-bold">{header.logoPosition === 'center' ? 'Centro' : 'Esquerda'}</span>
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-300">Altura do header</span><span className="text-xs font-black text-emerald-300">{header.height}px</span></div>
                    <input type="range" min="56" max="100" value={header.height} onChange={(event) => updateCustomization({ ...safeCustomization, header: { ...header, height: Number(event.target.value) } })} className="w-full accent-emerald-400" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-300">Altura do hero</span><span className="text-xs font-black text-emerald-300">{heroSection?.styles?.height || safeCustomization.hero.height}px</span></div>
                    <input type="range" min="320" max="720" value={heroSection?.styles?.height || safeCustomization.hero.height || 500} onChange={(event) => updateHeroStyle('height', Number(event.target.value))} className="w-full accent-emerald-400" />
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4"><Palette className="w-3 h-3" /> Cores & Marca</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ['background', 'Cor de fundo'],
                      ['text', 'Cor do texto'],
                      ['accent', 'Cor de destaque'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <span className="text-xs font-black text-gray-800">{label}</span>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{colors[key]}</p>
                        </div>
                        <input type="color" value={colors[key] || '#000000'} onChange={(event) => updateCustomization({ ...safeCustomization, colors: { ...colors, [key]: event.target.value, primary: key === 'accent' ? event.target.value : colors.primary } })} className="w-11 h-11 rounded-xl cursor-pointer border-none bg-transparent" />
                      </div>
                    ))}
                  </div>
                </section>

                {heroSection && (
                  <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Hero principal</h3>
                    <input value={heroSection.content?.title || ''} onChange={(event) => updateHeroField('title', event.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-shopify-green" placeholder="Título principal" />
                    <textarea value={heroSection.content?.subtitle || ''} onChange={(event) => updateHeroField('subtitle', event.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none h-20 resize-none focus:border-shopify-green" placeholder="Subtítulo" />
                    <input value={heroSection.content?.buttonText || ''} onChange={(event) => updateHeroField('buttonText', event.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-shopify-green" placeholder="Texto do botão" />
                    <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
                      {['left', 'center', 'right'].map((align) => (
                        <button key={align} onClick={() => updateHeroStyle('textAlign', align)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${heroSection.styles?.textAlign === align ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}>{align === 'left' ? 'Esq' : align === 'center' ? 'Centro' : 'Dir'}</button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><ShoppingCart className="w-3 h-3" /> Produtos</h3>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold">Colunas no desktop</span><span className="text-xs font-black text-shopify-green">{productsSectionSettings.columns}</span></div>
                    <input type="range" min="2" max="5" value={productsSectionSettings.columns || 4} onChange={(event) => updateCustomization({ ...safeCustomization, products: { ...productsSectionSettings, columns: Number(event.target.value) }, sections: safeCustomization.sections.map((section: any) => section.type === 'products' ? { ...section, styles: { ...section.styles, columns: Number(event.target.value) } } : section) })} className="w-full accent-shopify-green" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateCustomization({ ...safeCustomization, products: { ...productsSectionSettings, showPrice: !productsSectionSettings.showPrice } })} className={`p-3 rounded-2xl text-xs font-black border ${productsSectionSettings.showPrice ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>Mostrar preço</button>
                    <button onClick={() => updateCustomization({ ...safeCustomization, products: { ...productsSectionSettings, showStock: !productsSectionSettings.showStock } })} className={`p-3 rounded-2xl text-xs font-black border ${productsSectionSettings.showStock ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>Mostrar stock</button>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4"><Type className="w-3 h-3" /> Secções da página</h3>
                  <div className="space-y-3">
                    {safeCustomization.sections.map((section: any, index: number) => (
                      <div key={section.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="flex items-center p-3 gap-3 bg-gray-50/60">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30"><ArrowDown className="w-3 h-3 rotate-180" /></button>
                            <button onClick={() => moveSection(index, 'down')} disabled={index === safeCustomization.sections.length - 1} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center"><SectionIcon type={section.type} /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-black text-gray-900 block truncate">{sectionLabel(section.type)}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">#{index + 1}</span>
                          </div>
                          <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><Settings className="w-4 h-4" /></button>
                          <button onClick={() => removeSection(section.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        {expandedSection === section.id && (
                          <div className="p-4 space-y-4 border-t border-gray-100">
                            {section.type === 'hero' && <>
                              <input value={section.content.title || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, title: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" placeholder="Título" />
                              <textarea value={section.content.subtitle || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, subtitle: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none h-20 resize-none" placeholder="Subtítulo" />
                              <input value={section.content.buttonText || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, buttonText: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" placeholder="Texto do botão" />
                            </>}
                            {section.type === 'text' && <textarea value={section.content.text || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, text: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none h-28 resize-none" />}
                            {section.type === 'products' && <>
                              <input value={section.content.title || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, title: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" />
                              <select value={section.styles.columns || 4} onChange={(event) => updateSection(section.id, { styles: { ...section.styles, columns: Number(event.target.value) } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none"><option value={2}>2 colunas</option><option value={3}>3 colunas</option><option value={4}>4 colunas</option><option value={5}>5 colunas</option></select>
                            </>}
                            {section.type === 'button' && <>
                              <input value={section.content.text || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, text: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" />
                              <select value={section.content.action || 'link'} onChange={(event) => updateSection(section.id, { content: { ...section.content, action: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none"><option value="link">Abrir link</option><option value="whatsapp">WhatsApp</option><option value="checkout">Checkout</option></select>
                            </>}
                            {section.type === 'image' && <input value={section.content.url || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, url: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" />}
                            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                              {['left', 'center', 'right'].map((align) => <button key={align} onClick={() => updateSection(section.id, { styles: { ...section.styles, textAlign: align } })} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase ${section.styles?.textAlign === align ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}>{align === 'left' ? 'Esq' : align === 'center' ? 'Cen' : 'Dir'}</button>)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      ['hero', 'Banner'],
                      ['products', 'Produtos'],
                      ['text', 'Texto'],
                      ['button', 'Botão'],
                      ['image', 'Imagem'],
                      ['spacer', 'Espaço'],
                    ].map(([type, label]) => <button key={type} onClick={() => addSection(type)} className="p-3 bg-gray-50 hover:bg-shopify-green/5 border border-dashed border-gray-200 rounded-xl transition-all group"><Plus className="w-4 h-4 text-gray-400 group-hover:text-shopify-green mx-auto mb-2" /><span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-shopify-green block">{label}</span></button>)}
                  </div>
                </section>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center p-8 relative bg-[radial-gradient(circle_at_top,rgba(0,128,96,0.06),transparent_35%)]">
          <div className={`bg-white shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 border border-gray-100 ${previewMode === 'desktop' ? 'w-full h-full' : 'w-[390px] h-[760px]'}`}>
            <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: colors.background, color: colors.text, fontFamily: safeCustomization.fonts.body }}>
              <header className={`${header.sticky ? 'sticky top-0' : ''} z-40 border-b border-gray-100 px-6 py-4 transition-all`} style={{ height: `${header.height}px`, backgroundColor: `${colors.background}F2`, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center' }}>
                <div className={`w-full flex ${header.logoPosition === 'center' ? 'justify-center' : 'justify-between'} items-center`}>
                  <span className="text-lg font-black tracking-tight">{store.name}</span>
                  {header.logoPosition === 'left' && <ShoppingCart className="w-5 h-5" style={{ color: colors.accent }} />}
                </div>
              </header>

              <div className="flex flex-col">
                {safeCustomization.sections.map((section: any) => {
                  if (section.type === 'hero') {
                    return <section key={section.id} className="px-6 flex flex-col justify-center transition-all relative overflow-hidden" style={{ minHeight: `${section.styles?.height || safeCustomization.hero.height || 420}px`, background: `linear-gradient(135deg, ${colors.accent}18, transparent 50%), radial-gradient(circle at 80% 20%, ${colors.accent}18, transparent 25%)`, textAlign: section.styles?.textAlign as any }}><div className="absolute inset-x-0 bottom-0 h-px" style={{ backgroundColor: `${colors.accent}22` }} /><div className="max-w-3xl mx-auto space-y-5"><span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${colors.accent}18`, color: colors.accent }}>Nova coleção</span><h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight" style={{ color: colors.accent }}>{section.content?.title}</h1><p className="text-lg font-medium opacity-75 max-w-2xl mx-auto">{section.content?.subtitle}</p>{section.content?.buttonText && <button className="px-8 py-3 rounded-2xl font-black text-sm text-white shadow-xl hover:scale-105 transition-transform" style={{ backgroundColor: colors.accent }}>{section.content.buttonText}</button>}</div></section>;
                  }

                  if (section.type === 'products') {
                    const columns = previewMode === 'mobile' ? 1 : section.styles?.columns || productsSectionSettings.columns || 4;
                    const productsToShow = storeProducts.length > 0 ? storeProducts.slice(0, 8) : Array.from({ length: 4 }).map((_, index) => ({ id: `placeholder-${index}`, name: `Produto ${index + 1}`, price: 29 + index * 10, stock: 20 + index * 5, image_url: `https://picsum.photos/seed/${store.domain || store.name}-${index}/500/650` }));
                    return <section key={section.id} className="p-8"><div className="flex justify-between items-end mb-8"><div><p className="text-xs font-black uppercase tracking-widest opacity-40 mb-2">Coleção</p><h2 className="text-2xl md:text-3xl font-black tracking-tight">{section.content?.title}</h2></div></div><div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{productsToShow.map((product: any) => <div key={product.id} className="group rounded-3xl border border-black/5 bg-white/50 p-3 shadow-sm hover:shadow-xl transition-all"><div className="bg-gray-50 rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100 aspect-[4/5] relative"><img src={product.image_url || `https://picsum.photos/seed/${product.name}/500/650`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><div className="space-y-1 px-1"><div className="font-black text-sm">{product.name}</div>{productsSectionSettings.showPrice && <div className="font-black text-xs" style={{ color: colors.accent }}>{product.price}€</div>}{productsSectionSettings.showStock && <div className="text-[10px] font-bold opacity-45">Stock: {product.stock ?? 0}</div>}</div></div>)}</div></section>;
                  }

                  if (section.type === 'text') return <section key={section.id} className="px-8 py-14" style={{ textAlign: section.styles?.textAlign as any }}><div className="max-w-3xl mx-auto"><p className="text-lg leading-relaxed whitespace-pre-wrap opacity-80">{section.content?.text}</p></div></section>;
                  if (section.type === 'button') return <section key={section.id} className="px-8 py-8" style={{ textAlign: section.styles?.textAlign as any }}><button className="px-8 py-4 rounded-2xl font-black text-sm text-white shadow-xl" style={{ backgroundColor: colors.accent }}><span className="inline-flex items-center gap-3">{section.content?.text}{section.content?.action === 'whatsapp' && <Phone className="w-4 h-4" />}{section.content?.action === 'link' && <ExternalLink className="w-4 h-4" />}{section.content?.action === 'checkout' && <ShoppingCart className="w-4 h-4" />}</span></button></section>;
                  if (section.type === 'image') return <section key={section.id} className="px-8 py-8"><div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100"><img src={section.content?.url} alt={section.content?.alt || 'Imagem'} className="w-full h-auto" /></div></section>;
                  if (section.type === 'spacer') return <div key={section.id} style={{ height: `${section.styles?.height || 40}px` }} />;
                  return null;
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
