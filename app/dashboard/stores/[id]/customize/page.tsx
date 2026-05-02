'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Save, 
  Undo, 
  Redo, 
  Loader2, 
  Settings, 
  Palette, 
  Layout, 
  Type, 
  Image as ImageIcon,
  ChevronRight,
  MessageSquare,
  Plus,
  Trash2,
  GripVertical,
  MousePointer2,
  MoveHorizontal,
  ExternalLink,
  ShoppingCart,
  Phone,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import { updateStoreCustomizationWithAI } from '@/lib/ai-actions';

export default function StoreCustomizePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [store, setStore] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customization, setCustomization] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id || !supabase) return;

      try {
        const { data: storeData, error: storeError } = await supabase          .from('stores')
          .select('*')
          .eq('id', id)
          .single();
        
        if (storeError) throw storeError;
        setStore(storeData);

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', id);
        
        setStoreProducts(productsData || []);

        if (storeData) {
          setCustomization(storeData.customization || {
            header: { sticky: true, logoPosition: 'left', height: 70 },
            hero: { height: 400, textAlign: 'center', showOverlay: true, overlayOpacity: 0.1, title: storeData.name, subtitle: storeData.description },
            products: { columns: 4, gap: 30, aspectRatio: 'portrait', showPrice: true, showStock: true },
            colors: { background: '#ffffff', text: '#000000', accent: storeData.primary_color, muted: '#9ca3af', primary: storeData.primary_color },
            fonts: { heading: 'Inter', body: 'Inter' },
            sections: [
              { id: 'hero-1', type: 'hero', content: { title: storeData.name, subtitle: storeData.description, buttonText: 'Ver Coleção' }, styles: { height: 400, textAlign: 'center' } },
              { id: 'products-1', type: 'products', content: { title: 'Produtos em Destaque' }, styles: { columns: 4 } }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isProcessing) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsProcessing(true);

    try {
      const updatedConfig = await updateStoreCustomizationWithAI(customization, userMessage);
      setCustomization(updatedConfig);
      setMessages(prev => [...prev, { role: 'ai', content: "Alterações aplicadas com sucesso! Como posso ajudar mais?" }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: "Desculpa, ocorreu um erro ao processar o teu pedido. Podes tentar novamente?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ customization })
        .eq('id', id);
      
      if (error) throw error;
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

  if (!store) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Loja não encontrada</h2>
        <p className="text-gray-500 mb-6">A loja que estás a tentar customizar não existe ou não tens permissão.</p>
        <Link href="/dashboard/stores" className="bg-shopify-green text-white px-6 py-2 rounded-lg font-bold">
          Voltar para Lojas
        </Link>
      </div>
    );
  }

  const addSection = (type: string) => {
    const newId = `${type}-${Date.now()}`;
    const newSection = {
      id: newId,
      type,
      content: type === 'button' ? { text: 'Novo Botão', action: 'link', url: '#' } :
               type === 'image' ? { url: 'https://picsum.photos/seed/shop/800/400', alt: 'Imagem' } :
               type === 'text' ? { text: 'Insira o seu texto aqui...', size: 'md' } :
               type === 'spacer' ? {} :
               type === 'products' ? { title: 'Produtos' } : { title: 'Banner' },
      styles: type === 'spacer' ? { height: 40 } : { textAlign: 'center' }
    };
    
    setCustomization({
      ...customization,
      sections: [...customization.sections, newSection]
    });
    setExpandedSection(newId);
  };

  const removeSection = (sectionId: string) => {
    setCustomization({
      ...customization,
      sections: customization.sections.filter((s: any) => s.id !== sectionId)
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...customization.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setCustomization({ ...customization, sections: newSections });
  };

  const updateSection = (sectionId: string, data: any) => {
    setCustomization({
      ...customization,
      sections: customization.sections.map((s: any) => s.id === sectionId ? { ...s, ...data } : s)
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans overflow-hidden">
      {/* Top Bar */}
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
              className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-100" />
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Redo className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="ml-2 bg-shopify-green text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'A Guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Sidebar - Tabs & Controls */}
        <aside className="w-[380px] border-r border-gray-100 bg-white flex flex-col z-10 shadow-xl">
          <div className="flex p-4 gap-2">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Assistente IA
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
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
                    Podes pedir-me para mudar qualquer coisa! Exemplos:<br/>
                    • "Muda as cores para um estilo minimalista preto e branco"<br/>
                    • "Aumenta o banner principal e muda o texto para 'Coleção de Verão'"<br/>
                    • "Coloca os produtos em 3 colunas e mostra o stock"
                  </p>
                </div>

                <div 
                  ref={scrollRef}
                  className="flex-1 space-y-4 mb-4 overflow-y-auto min-h-0 pr-2"
                >
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Começa uma conversa com o assistente...</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-shopify-green text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none font-medium'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A pensar...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative mt-auto">
                  <textarea 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder="O que queres mudar na loja?"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all resize-none"
                    rows={3}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isProcessing}
                    className="absolute right-3 bottom-3 p-2 bg-shopify-green text-white rounded-xl shadow-lg shadow-shopify-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Layout className="w-3 h-3" /> Secções da Loja
                    </h3>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {customization?.sections?.map((section: any, index: number) => (
                      <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="flex items-center p-3 gap-3 bg-gray-50/50">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30">
                              <ArrowDown className="w-3 h-3 rotate-180" />
                            </button>
                            <button onClick={() => moveSection(index, 'down')} disabled={index === customization.sections.length - 1} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30">
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex-1 flex items-center gap-2">
                            {section.type === 'hero' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                            {section.type === 'products' && <ShoppingCart className="w-4 h-4 text-green-500" />}
                            {section.type === 'button' && <MousePointer2 className="w-4 h-4 text-purple-500" />}
                            {section.type === 'text' && <Type className="w-4 h-4 text-orange-500" />}
                            {section.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-500" />}
                            {section.type === 'spacer' && <MoveHorizontal className="w-4 h-4 text-gray-400" />}
                            
                            <span className="text-xs font-bold capitalize">
                              {section.type === 'hero' ? 'Banner Hero' : 
                               section.type === 'products' ? 'Grelha de Produtos' :
                               section.type === 'button' ? 'Botão Customizado' :
                               section.type === 'text' ? 'Bloco de Texto' :
                               section.type === 'image' ? 'Imagem/Banner' : 'Espaçador'}
                            </span>
                          </div>

                          <button 
                            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeSection(section.id)}
                            className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {expandedSection === section.id && (
                          <div className="p-4 space-y-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                            {section.type === 'hero' && (
                              <>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Título</label>
                                  <input 
                                    type="text" 
                                    value={section.content.title} 
                                    onChange={e => updateSection(section.id, { content: { ...section.content, title: e.target.value } })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Subtítulo</label>
                                  <textarea 
                                    value={section.content.subtitle} 
                                    onChange={e => updateSection(section.id, { content: { ...section.content, subtitle: e.target.value } })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none h-20 resize-none"
                                  />
                                </div>
                              </>
                            )}

                            {section.type === 'button' && (
                              <>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Texto do Botão</label>
                                  <input 
                                    type="text" 
                                    value={section.content.text} 
                                    onChange={e => updateSection(section.id, { content: { ...section.content, text: e.target.value } })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Função/Ação</label>
                                  <select 
                                    value={section.content.action}
                                    onChange={e => updateSection(section.id, { content: { ...section.content, action: e.target.value } })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none"
                                  >
                                    <option value="link">Abrir Link</option>
                                    <option value="whatsapp">Enviar WhatsApp</option>
                                    <option value="checkout">Ir para o Checkout</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Link / Destino</label>
                                  <input 
                                    type="text" 
                                    value={section.content.url} 
                                    onChange={e => updateSection(section.id, { content: { ...section.content, url: e.target.value } })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none"
                                    placeholder="https://..."
                                  />
                                </div>
                              </>
                            )}

                            {section.type === 'text' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">Conteúdo</label>
                                <textarea 
                                  value={section.content.text} 
                                  onChange={e => updateSection(section.id, { content: { ...section.content, text: e.target.value } })}
                                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none h-32 resize-none"
                                />
                              </div>
                            )}

                            {section.type === 'image' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">URL da Imagem</label>
                                <input 
                                  type="text" 
                                  value={section.content.url} 
                                  onChange={e => updateSection(section.id, { content: { ...section.content, url: e.target.value } })}
                                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-shopify-green/20 outline-none"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400">Alinhamento</label>
                              <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                                {['left', 'center', 'right'].map(align => (
                                  <button 
                                    key={align}
                                    onClick={() => updateSection(section.id, { styles: { ...section.styles, textAlign: align } })}
                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${section.styles.textAlign === align ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400 hover:text-gray-600'}`}
                                  >
                                    {align === 'left' ? 'Esq' : align === 'center' ? 'Cen' : 'Dir'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => addSection('hero')}
                      className="p-3 bg-gray-50 hover:bg-shopify-green/5 border border-dashed border-gray-200 hover:border-shopify-green/20 rounded-xl transition-all group"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-shopify-green mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-shopify-green block">Banner Hero</span>
                    </button>
                    <button 
                      onClick={() => addSection('products')}
                      className="p-3 bg-gray-50 hover:bg-shopify-green/5 border border-dashed border-gray-200 hover:border-shopify-green/20 rounded-xl transition-all group"
                    >
                      <ShoppingCart className="w-4 h-4 text-gray-400 group-hover:text-shopify-green mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-shopify-green block">Produtos</span>
                    </button>
                    <button 
                      onClick={() => addSection('text')}
                      className="p-3 bg-gray-50 hover:bg-shopify-green/5 border border-dashed border-gray-200 hover:border-shopify-green/20 rounded-xl transition-all group"
                    >
                      <Type className="w-4 h-4 text-gray-400 group-hover:text-shopify-green mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-shopify-green block">Texto</span>
                    </button>
                    <button 
                      onClick={() => addSection('button')}
                      className="p-3 bg-gray-50 hover:bg-shopify-green/5 border border-dashed border-gray-200 hover:border-shopify-green/20 rounded-xl transition-all group"
                    >
                      <MousePointer2 className="w-4 h-4 text-gray-400 group-hover:text-shopify-green mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-shopify-green block">Botão</span>
                    </button>
                  </div>
                </section>

                <div className="h-px bg-gray-100 my-6" />

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Cores & Marca
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold">Cor de Fundo</span>
                      <input type="color" value={customization?.colors?.background} onChange={e => setCustomization({...customization, colors: {...customization.colors, background: e.target.value}})} className="w-8 h-8 rounded-lg cursor-pointer border-none" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold">Cor do Texto</span>
                      <input type="color" value={customization?.colors?.text} onChange={e => setCustomization({...customization, colors: {...customization.colors, text: e.target.value}})} className="w-8 h-8 rounded-lg cursor-pointer border-none" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold">Cor de Destaque</span>
                      <input type="color" value={customization?.colors?.accent} onChange={e => setCustomization({...customization, colors: {...customization.colors, accent: e.target.value}})} className="w-8 h-8 rounded-lg cursor-pointer border-none" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Header & Navegação
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold">Header Fixo</span>
                      <button 
                        onClick={() => setCustomization({...customization, header: {...customization.header, sticky: !customization.header.sticky}})}
                        className={`w-10 h-5 rounded-full transition-colors relative ${customization?.header?.sticky ? 'bg-shopify-green' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${customization?.header?.sticky ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-bold block px-1">Posição do Logo</span>
                      <div className="flex bg-gray-50 p-1 rounded-xl">
                        <button 
                          onClick={() => setCustomization({...customization, header: {...customization.header, logoPosition: 'left'}})}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${customization?.header?.logoPosition === 'left' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}
                        >
                          Esquerda
                        </button>
                        <button 
                          onClick={() => setCustomization({...customization, header: {...customization.header, logoPosition: 'center'}})}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${customization?.header?.logoPosition === 'center' ? 'bg-white shadow-sm text-shopify-green' : 'text-gray-400'}`}
                        >
                          Centro
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div 
            className={`bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 border border-gray-100 ${
              previewMode === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[750px]'
            }`}
          >
             {/* We'll pass the customization via state/postMessage or just render a component that uses it */}
             {/* For simplicity in this demo, I'll simulate the preview using a simplified version of the store page */}
             <div className="w-full h-full overflow-y-auto" style={{ 
               backgroundColor: customization?.colors?.background,
               color: customization?.colors?.text,
               fontFamily: customization?.fonts?.body
             }}>
                {/* Simplified Storefront Preview */}
                <header className={`${customization?.header?.sticky ? 'sticky top-0' : ''} z-40 border-b border-gray-100 px-6 py-4 transition-all`} style={{ 
                  height: `${customization?.header?.height}px`,
                  backgroundColor: `${customization?.colors?.background}CC`,
                  backdropBlur: '10px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div className={`w-full flex ${customization?.header?.logoPosition === 'center' ? 'justify-center' : 'justify-between'} items-center`}>
                    <span className="text-lg font-black tracking-tight">{store.name}</span>
                    {customization?.header?.logoPosition === 'left' && (
                      <div className="flex gap-4">
                        <div className="w-4 h-4 rounded-full bg-gray-100" />
                        <div className="w-4 h-4 rounded-full bg-gray-100" />
                      </div>
                    )}
                  </div>
                </header>

                {/* Dynamic Sections Preview */}
                <div className="flex flex-col">
                  {customization?.sections?.map((section: any) => {
                    if (section.type === 'hero') {
                      return (
                        <section 
                          key={section.id}
                          className="px-6 flex flex-col justify-center transition-all" 
                          style={{ 
                            minHeight: `${section.styles.height || 400}px`,
                            backgroundColor: `${customization?.colors?.accent}08`,
                            textAlign: section.styles.textAlign as any
                          }}
                        >
                          <div className="max-w-3xl mx-auto space-y-4">
                            <h1 className="text-4xl font-black tracking-tight" style={{ color: customization?.colors?.accent }}>{section.content.title}</h1>
                            <p className="text-lg font-medium opacity-60">{section.content.subtitle}</p>
                            {section.content.buttonText && (
                              <button className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-xl" style={{ backgroundColor: customization?.colors?.accent }}>
                                {section.content.buttonText}
                              </button>
                            )}
                          </div>
                        </section>
                      );
                    }

                    if (section.type === 'products') {
                      return (
                        <section key={section.id} className="p-8">
                          <div className="flex justify-between items-end mb-8">
                            <div>
                              <h2 className="text-2xl font-bold tracking-tight">{section.content.title}</h2>
                            </div>
                          </div>
                          
                          <div 
                            className="grid gap-6" 
                            style={{ 
                              gridTemplateColumns: `repeat(${previewMode === 'mobile' ? 1 : section.styles.columns || 4}, minmax(0, 1fr))` 
                            }}
                          >
                            {storeProducts.length > 0 ? storeProducts.slice(0, 4).map(product => (
                              <div key={product.id} className="group">
                                <div className={`bg-gray-50 rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100 aspect-[4/5] relative`}>
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1">
                                  <div className="font-bold text-sm">{product.name}</div>
                                  <div className="font-black text-xs text-shopify-green">{product.price}€</div>
                                </div>
                              </div>
                            )) : [1, 2, 3, 4].map(i => (
                              <div key={i} className="group">
                                <div className={`bg-gray-50 rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100 aspect-[4/5]`} />
                                <div className="space-y-1">
                                  <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                                  <div className="h-4 bg-gray-100 rounded-full w-1/4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    }

                    if (section.type === 'text') {
                      return (
                        <section key={section.id} className="px-8 py-12" style={{ textAlign: section.styles.textAlign as any }}>
                          <div className="max-w-3xl mx-auto">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">{section.content.text}</p>
                          </div>
                        </section>
                      );
                    }

                    if (section.type === 'button') {
                      return (
                        <section key={section.id} className="px-8 py-6" style={{ textAlign: section.styles.textAlign as any }}>
                          <button 
                            className="px-8 py-4 rounded-2xl font-black text-sm text-white transition-all shadow-xl hover:scale-105 active:scale-95" 
                            style={{ backgroundColor: customization?.colors?.accent }}
                          >
                            <div className="flex items-center gap-3">
                              {section.content.text}
                              {section.content.action === 'whatsapp' && <Phone className="w-4 h-4" />}
                              {section.content.action === 'link' && <ExternalLink className="w-4 h-4" />}
                              {section.content.action === 'checkout' && <ShoppingCart className="w-4 h-4" />}
                            </div>
                          </button>
                        </section>
                      );
                    }

                    if (section.type === 'image') {
                      return (
                        <section key={section.id} className="px-8 py-8">
                          <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                            <img src={section.content.url} alt={section.content.alt} className="w-full h-auto" />
                          </div>
                        </section>
                      );
                    }

                    if (section.type === 'spacer') {
                      return <div key={section.id} style={{ height: `${section.styles.height || 40}px` }} />;
                    }

                    return null;
                  })}
                </div>
             </div>
          </div>

          <div className="absolute bottom-12 bg-white/80 backdrop-blur-md border border-gray-100 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-8 z-20">
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-green-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ligação Segura</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Latência: 45ms</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
