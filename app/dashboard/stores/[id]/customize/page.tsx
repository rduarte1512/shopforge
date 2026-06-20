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

function getDefaultCustomization(store: any) {
  const accent = store?.primary_color || store?.primaryColor || '#008060';
  const description = store?.description || 'Produtos selecionados com qualidade, estilo e atenção ao detalhe.';

  return {
    header: { sticky: true, logoPosition: 'left', height: 72 },
    hero: {
      height: 460,
      textAlign: 'center',
      showOverlay: true,
      overlayOpacity: 0.1,
      title: store?.name || 'A tua loja online',
      subtitle: description,
    },
    products: { columns: 4, gap: 28, aspectRatio: 'portrait', showPrice: true, showStock: true },
    colors: {
      background: '#ffffff',
      text: '#0f172a',
      accent,
      muted: '#64748b',
      primary: accent,
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: store?.name || 'A tua loja online',
          subtitle: description,
          buttonText: 'Ver coleção',
        },
        styles: { height: 460, textAlign: 'center' },
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Descobre uma experiência de compra pensada para ser simples, elegante e memorável.',
        },
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
      styles: { height: 420, textAlign: 'center' },
    };
  }

  if (type === 'products') {
    return {
      id,
      type,
      content: { title: 'Produtos em destaque' },
      styles: { columns: 4, textAlign: 'left' },
    };
  }

  if (type === 'button') {
    return {
      id,
      type,
      content: { text: 'Comprar agora', action: 'link', url: '#' },
      styles: { textAlign: 'center' },
    };
  }

  if (type === 'image') {
    return {
      id,
      type,
      content: { url: 'https://picsum.photos/seed/shopforge-banner/1200/520', alt: 'Banner da loja' },
      styles: { textAlign: 'center' },
    };
  }

  if (type === 'spacer') {
    return { id, type, content: {}, styles: { height: 48 } };
  }

  return {
    id,
    type: 'text',
    content: { text: 'Escreve aqui uma mensagem forte para os teus clientes.' },
    styles: { textAlign: 'center' },
  };
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
        const storeData = stores.find((s: any) => s.id === id);

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

  const updateCustomization = (next: any) => {
    setCustomization(normalizeCustomization(next, store));
  };

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
        <Link href="/dashboard/stores" className="bg-shopify-green text-white px-6 py-2 rounded-lg font-bold">
          Voltar para Lojas
        </Link>
      </div>
    );
  }

  const colors = safeCustomization.colors;
  const header = safeCustomization.header;
  const productsSectionSettings = safeCustomization.products;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans overflow-hidden">
      <header className="h-14 border-b border-gray-100 px-4 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stores" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-gray-100" />
          <div>
            <h1 className="text-sm font-bold text-gray-900">{store.name}</h1>
            <p className="text-[11px] text-gray-400 font-medium">Editor Visual • Em direto</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="ml-2 bg-shopify-green text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-gray-50">
        <aside className="w-[380px] border-r border-gray-100 bg-white flex flex-col z-10 shadow-xl">
          <div className="flex p-4 gap-2">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Assistente IA
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}
            >
              <Settings className="w-3.5 h-3.5" /> Manual
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {activeTab === 'ai' ? (
              <div className="h-full flex flex-col">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-blue-900">IA Designer</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Pede mudanças simples ou grandes. Exemplo: “faz uma loja premium, luxuosa, com fundo escuro, hero forte e produtos em destaque”.
                  </p>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-4 mb-4 overflow-y-auto min-h-0 pr-2">
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Começa uma conversa com o assistente...</p>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${message.role === 'user' ? 'bg-shopify-green text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none font-medium'}`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none inline-flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A pensar...</span>
                    </div>
                  )}
                </div>

                <div className="relative mt-auto">
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), handleSendMessage())}
                    placeholder="O que queres mudar na loja?"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isProcessing}
                    className="absolute right-3 bottom-3 p-2 bg-shopify-green text-white rounded-xl shadow-lg disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                    <Palette className="w-3 h-3" /> Cores & Marca
                  </h3>
                  <div className="space-y-3">
                    {[
                      ['background', 'Cor de fundo'],
                      ['text', 'Cor do texto'],
                      ['accent', 'Cor de destaque'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs font-bold">{label}</span>
                        <input
                          type="color"
                          value={colors[key] || '#000000'}
                          onChange={(event) => updateCustomization({ ...safeCustomization, colors: { ...colors, [key]: event.target.value, primary: key === 'accent' ? event.target.value : colors.primary } })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-none"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                    <Type className="w-3 h-3" /> Secções
                  </h3>
                  <div className="space-y-3">
                    {safeCustomization.sections.map((section: any, index: number) => (
                      <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="flex items-center p-3 gap-3 bg-gray-50/50">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30">
                              <ArrowDown className="w-3 h-3 rotate-180" />
                            </button>
                            <button onClick={() => moveSection(index, 'down')} disabled={index === safeCustomization.sections.length - 1} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30">
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex-1 flex items-center gap-2">
                            {section.type === 'hero' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                            {section.type === 'products' && <ShoppingCart className="w-4 h-4 text-green-500" />}
                            {section.type === 'button' && <MousePointer2 className="w-4 h-4 text-purple-500" />}
                            {section.type === 'text' && <Type className="w-4 h-4 text-orange-500" />}
                            {section.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-500" />}
                            <span className="text-xs font-bold capitalize">{section.type}</span>
                          </div>

                          <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeSection(section.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {expandedSection === section.id && (
                          <div className="p-4 space-y-4 border-t border-gray-100">
                            {section.type === 'hero' && (
                              <>
                                <input value={section.content.title || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, title: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" placeholder="Título" />
                                <textarea value={section.content.subtitle || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, subtitle: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none h-20 resize-none" placeholder="Subtítulo" />
                                <input value={section.content.buttonText || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, buttonText: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" placeholder="Texto do botão" />
                              </>
                            )}

                            {section.type === 'text' && (
                              <textarea value={section.content.text || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, text: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none h-28 resize-none" />
                            )}

                            {section.type === 'products' && (
                              <>
                                <input value={section.content.title || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, title: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" />
                                <select value={section.styles.columns || 4} onChange={(event) => updateSection(section.id, { styles: { ...section.styles, columns: Number(event.target.value) } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none">
                                  <option value={2}>2 colunas</option>
                                  <option value={3}>3 colunas</option>
                                  <option value={4}>4 colunas</option>
                                </select>
                              </>
                            )}

                            {section.type === 'button' && (
                              <>
                                <input value={section.content.text || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, text: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" />
                                <select value={section.content.action || 'link'} onChange={(event) => updateSection(section.id, { content: { ...section.content, action: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none">
                                  <option value="link">Abrir link</option>
                                  <option value="whatsapp">WhatsApp</option>
                                  <option value="checkout">Checkout</option>
                                </select>
                              </>
                            )}

                            {section.type === 'image' && (
                              <input value={section.content.url || ''} onChange={(event) => updateSection(section.id, { content: { ...section.content, url: event.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none" />
                            )}

                            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                              {['left', 'center', 'right'].map((align) => (
                                <button key={align} onClick={() => updateSection(section.id, { styles: { ...section.styles, textAlign: align } })} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase ${section.styles?.textAlign === align ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}>
                                  {align === 'left' ? 'Esq' : align === 'center' ? 'Cen' : 'Dir'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {[
                      ['hero', 'Banner'],
                      ['products', 'Produtos'],
                      ['text', 'Texto'],
                      ['button', 'Botão'],
                      ['image', 'Imagem'],
                      ['spacer', 'Espaço'],
                    ].map(([type, label]) => (
                      <button key={type} onClick={() => addSection(type)} className="p-3 bg-gray-50 hover:bg-shopify-green/5 border border-dashed border-gray-200 rounded-xl transition-all group">
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-shopify-green mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-shopify-green block">{label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className={`bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 border border-gray-100 ${previewMode === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[750px]'}`}>
            <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: colors.background, color: colors.text, fontFamily: safeCustomization.fonts.body }}>
              <header
                className={`${header.sticky ? 'sticky top-0' : ''} z-40 border-b border-gray-100 px-6 py-4 transition-all`}
                style={{ height: `${header.height}px`, backgroundColor: `${colors.background}F2`, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center' }}
              >
                <div className={`w-full flex ${header.logoPosition === 'center' ? 'justify-center' : 'justify-between'} items-center`}>
                  <span className="text-lg font-black tracking-tight">{store.name}</span>
                  {header.logoPosition === 'left' && <ShoppingCart className="w-5 h-5" style={{ color: colors.accent }} />}
                </div>
              </header>

              <div className="flex flex-col">
                {safeCustomization.sections.map((section: any) => {
                  if (section.type === 'hero') {
                    return (
                      <section key={section.id} className="px-6 flex flex-col justify-center transition-all" style={{ minHeight: `${section.styles?.height || safeCustomization.hero.height || 420}px`, background: `linear-gradient(135deg, ${colors.accent}14, transparent 55%)`, textAlign: section.styles?.textAlign as any }}>
                        <div className="max-w-3xl mx-auto space-y-4">
                          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: colors.accent }}>{section.content?.title}</h1>
                          <p className="text-lg font-medium opacity-70">{section.content?.subtitle}</p>
                          {section.content?.buttonText && <button className="px-8 py-3 rounded-xl font-bold text-sm text-white shadow-xl" style={{ backgroundColor: colors.accent }}>{section.content.buttonText}</button>}
                        </div>
                      </section>
                    );
                  }

                  if (section.type === 'products') {
                    const columns = previewMode === 'mobile' ? 1 : section.styles?.columns || productsSectionSettings.columns || 4;
                    const productsToShow = storeProducts.length > 0 ? storeProducts.slice(0, 8) : Array.from({ length: 4 }).map((_, index) => ({ id: `placeholder-${index}`, name: `Produto ${index + 1}`, price: 29 + index * 10, image_url: `https://picsum.photos/seed/${store.domain || store.name}-${index}/500/650` }));

                    return (
                      <section key={section.id} className="p-8">
                        <div className="flex justify-between items-end mb-8">
                          <h2 className="text-2xl font-black tracking-tight">{section.content?.title}</h2>
                        </div>
                        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                          {productsToShow.map((product: any) => (
                            <div key={product.id} className="group">
                              <div className="bg-gray-50 rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100 aspect-[4/5] relative">
                                <img src={product.image_url || `https://picsum.photos/seed/${product.name}/500/650`} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-1">
                                <div className="font-bold text-sm">{product.name}</div>
                                <div className="font-black text-xs" style={{ color: colors.accent }}>{product.price}€</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (section.type === 'text') {
                    return (
                      <section key={section.id} className="px-8 py-12" style={{ textAlign: section.styles?.textAlign as any }}>
                        <div className="max-w-3xl mx-auto"><p className="text-lg leading-relaxed whitespace-pre-wrap">{section.content?.text}</p></div>
                      </section>
                    );
                  }

                  if (section.type === 'button') {
                    return (
                      <section key={section.id} className="px-8 py-6" style={{ textAlign: section.styles?.textAlign as any }}>
                        <button className="px-8 py-4 rounded-2xl font-black text-sm text-white shadow-xl" style={{ backgroundColor: colors.accent }}>
                          <span className="inline-flex items-center gap-3">
                            {section.content?.text}
                            {section.content?.action === 'whatsapp' && <Phone className="w-4 h-4" />}
                            {section.content?.action === 'link' && <ExternalLink className="w-4 h-4" />}
                            {section.content?.action === 'checkout' && <ShoppingCart className="w-4 h-4" />}
                          </span>
                        </button>
                      </section>
                    );
                  }

                  if (section.type === 'image') {
                    return (
                      <section key={section.id} className="px-8 py-8">
                        <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                          <img src={section.content?.url} alt={section.content?.alt || 'Imagem'} className="w-full h-auto" />
                        </div>
                      </section>
                    );
                  }

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
