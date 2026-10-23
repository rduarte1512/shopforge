'use client';

import { useUser } from '@clerk/nextjs';
import {
  addProductAction,
  createStoreAction,
  deleteStoreAction,
  getMyStoresAction,
  updateStoreCustomizationAction,
} from '@/lib/actions';
import { setSelectedStoreCookie } from '@/lib/dashboard-actions';
import { SUBSCRIPTION_PLANS, useMockDB } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { getProductSmartImage, replaceRandomImagesInCustomization } from '@/lib/smart-images';
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  UserRound,
  Wand2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { generateStoreConfig, generateMultipleProductsForStore } from '@/lib/ai-actions';
import StoreProductReview, { StoreDraftProduct, toDraftProducts } from '@/components/dashboard/StoreProductReview';
import { STORE_TEMPLATES, StoreTemplateId, buildTemplateCustomization } from '@/lib/store-templates';
import { findProductPhotos } from '@/lib/product-image-actions';
import { useRouter } from 'next/navigation';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'loja-online';
}

function withUniqueSuffix(value: string) {
  return `${slugify(value)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildDefaultCustomization(store: any) {
  const accent = store.primary_color || store.primaryColor || '#008060';

  return {
    accounts: { enabled: store.enableAccounts !== false, requireLoginForCheckout: false, allowRegistration: true },
    header: { sticky: true, logoPosition: 'left', height: 72 },
    hero: { height: 520, textAlign: 'center', showOverlay: true, overlayOpacity: 0.12, title: store.name, subtitle: store.description },
    products: { columns: 4, gap: 28, aspectRatio: 'portrait', showPrice: true, showStock: true },
    colors: { background: '#ffffff', text: '#0f172a', accent, muted: '#64748b', primary: accent },
    fonts: { heading: 'Inter', body: 'Inter' },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        content: { title: store.name, subtitle: store.description || 'Uma loja moderna, rápida e pronta para publicar.', buttonText: 'Ver coleção' },
        styles: { height: 520, textAlign: 'center' },
      },
      {
        id: 'text-1',
        type: 'text',
        content: { text: 'Uma experiência de compra criada para transmitir confiança, desejo e qualidade desde o primeiro clique.' },
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
  const fallback = buildDefaultCustomization(store);
  const sanitizedConfig = replaceRandomImagesInCustomization(
    config,
    `${store.name || ''} ${store.description || ''} ${store.domain || ''}`
  );
  const hasSections = Array.isArray(sanitizedConfig?.sections) && sanitizedConfig.sections.length > 0;

  return {
    ...fallback,
    ...(sanitizedConfig || {}),
    accounts: { ...fallback.accounts, ...(sanitizedConfig?.accounts || {}) },
    header: { ...fallback.header, ...(sanitizedConfig?.header || {}) },
    hero: { ...fallback.hero, ...(sanitizedConfig?.hero || {}) },
    products: { ...fallback.products, ...(sanitizedConfig?.products || {}) },
    colors: { ...fallback.colors, ...(sanitizedConfig?.colors || {}) },
    fonts: { ...fallback.fonts, ...(sanitizedConfig?.fonts || {}) },
    sections: hasSections ? sanitizedConfig.sections : fallback.sections,
  };
}

export default function StoresPage() {
  const { user: clerkUser } = useUser();
  const { user } = useAuth();
  const { setSelectedStore } = useMockDB();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Cria uma loja incrível, moderna, bonita e pronta para publicar.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isGeneratingProducts, setIsGeneratingProducts] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [draftProducts, setDraftProducts] = useState<StoreDraftProduct[]>([]);
  const [includeAiProducts, setIncludeAiProducts] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);
  const [newStore, setNewStore] = useState({
    name: '',
    domain: '',
    description: '',
    theme: 'light' as 'light' | 'dark',
    templateId: 'minimal' as StoreTemplateId,
    primaryColor: '#008060',
    enableAccounts: true,
  });
  const router = useRouter();

  const subscriptionTier = user?.subscriptionTier || 'STARTER';
  const plan = useMemo(() => SUBSCRIPTION_PLANS.find((item) => item.id === subscriptionTier) || SUBSCRIPTION_PLANS[0], [subscriptionTier]);
  const canCreateMoreStores = stores.length < plan.limits.stores;
  const isAiRestricted = plan.id === 'STARTER' || plan.id === 'GROWTH';

  const steps = [
    'Conceito e posicionamento da marca',
    'Identidade visual, cores e layout',
    'Produtos iniciais com imagens certas',
    'Finalização e ligação ao dashboard',
  ];

  const fetchStores = async () => {
    try {
      const data = await getMyStoresAction();
      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkUser) void fetchStores();
  }, [clerkUser]);

  const selectCreatedStore = async (storeId: string) => {
    setSelectedStore(storeId);
    localStorage.setItem('selectedStoreId', storeId);
    await setSelectedStoreCookie(storeId);
  };

  const createProductsForStore = async (storeId: string, products: StoreDraftProduct[], context = '') => {
    const selected = products.filter((product) => product.selected && product.name.trim());
    const results = await Promise.allSettled(selected.map((product, index) =>
      addProductAction({
        store_id: storeId,
        name: product.name.trim(),
        description: product.description.trim(),
        price: Number(product.price) || 0,
        stock: Math.max(0, Number(product.stock) || 0),
        image_url: product.image_url || getProductSmartImage(product, index, context),
        category: product.category.trim() || 'Geral',
      })
    ));
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length) {
      console.error('Alguns produtos não foram guardados:', failed);
      throw new Error('Loja criada, mas ' + failed.length + ' produto(s) não foram guardados. Consulta o catálogo antes de repetir a operação.');
    }
  };

  // Esta fase prepara uma proposta. Não cria loja nem produtos na base de dados.
  const handleAiGenerate = async () => {
    if (isAiRestricted || !canCreateMoreStores) {
      router.push('/dashboard/subscription');
      return;
    }
    if (!aiPrompt.trim()) {
      setGenerationError('Descreve o tipo de loja que pretendes criar.');
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStep(0);
    try {
      const config = await generateStoreConfig(aiPrompt.trim(), false);
      setAiConfig(config);
      setDraftProducts([]);
      setIncludeAiProducts(false);
      setGenerationStep(4);
    } catch (error: any) {
      setGenerationError(error?.message || 'Não foi possível preparar a proposta.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProductGeneration = async (count: number) => {
    if (!includeAiProducts || !aiConfig) return;
    setIsGeneratingProducts(true);
    setGenerationError(null);
    try {
      // O nicho vem exclusivamente do pedido original, não do nome da marca gerado pela IA.
      const description = aiPrompt.trim();
      const result = await generateMultipleProductsForStore(description, count);
      if (!result.ok) {
        setGenerationError(result.error);
        return;
      }
      const generated = result.products;
      // Falhar a pesquisa externa de fotografias não deve impedir o
      // utilizador de rever os produtos nem mostrar um erro de servidor.
      let photos: string[] = [];
      try {
        photos = await findProductPhotos(generated, description);
      } catch (photoError) {
        console.warn('Fotografias indisponíveis. Produtos mantidos para revisão:', photoError);
      }
      const next = toDraftProducts(generated, photos, description);
      // As propostas anteriores são substituídas; os produtos manuais permanecem.
      setDraftProducts((existing) => [...existing.filter((product) => product.source === 'manual'), ...next]);
    } catch (error: any) {
      setGenerationError(error?.message || 'Não foi possível gerar produtos. Podes adicioná-los manualmente.');
    } finally {
      setIsGeneratingProducts(false);
    }
  };

  const finishCreation = async (payload: any, customization: any, context: string) => {
    setIsSavingStore(true);
    setGenerationError(null);
    let createdStore: any = null;
    try {
      const invalidProduct = draftProducts.find((product) => product.selected && (!product.name.trim() || !Number.isFinite(Number(product.price)) || Number(product.price) < 0));
      if (invalidProduct) throw new Error('Confirma o nome e o preço de todos os produtos selecionados.');
      createdStore = await createStoreAction(payload);
      await updateStoreCustomizationAction(createdStore.id, customization);
      await createProductsForStore(createdStore.id, draftProducts, context);
      await selectCreatedStore(createdStore.id);
      await fetchStores();
      router.refresh();
      setIsCreating(false);
      setIsAiMode(false);
      setAiConfig(null);
      setDraftProducts([]);
      setIncludeAiProducts(false);
      setAiPrompt('Cria uma loja incrível, moderna, bonita e pronta para publicar.');
      setNewStore({ name: '', domain: '', description: '', theme: 'light', templateId: 'minimal', primaryColor: '#008060', enableAccounts: true });
    } catch (error: any) {
      const message = error?.message || 'Ocorreu um erro ao criar a loja.';
      if (createdStore) {
        // A loja já foi persistida. Fechamos o formulário para evitar duplicados.
        await selectCreatedStore(createdStore.id);
        await fetchStores();
        setIsCreating(false);
        alert(message + ' A loja foi criada. Podes verificar o catálogo e completar os produtos em falta.');
      } else {
        setGenerationError(message);
      }
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleAiCreate = async () => {
    if (!aiConfig || isAiRestricted || !canCreateMoreStores || isSavingStore) return;
    const storePayload = {
      name: String(aiConfig.name || 'Loja criada por IA').trim(),
      domain: withUniqueSuffix(aiConfig.domain || aiConfig.name || 'loja-ia'),
      description: String(aiConfig.description || ''),
      theme: aiConfig.theme === 'dark' ? 'dark' : 'light',
      primary_color: aiConfig.primaryColor || '#008060',
      base_currency: 'EUR',
      enableAccounts: true,
    };
    const customization = normalizeCustomization(aiConfig.customization, storePayload);
    customization.templateId = 'ai-custom';
    customization.templateLayout = aiConfig.customization?.templateLayout || 'split';
    customization.sections = customization.sections.map((section: any) =>
      section.type === 'hero'
        ? { ...section, content: { ...section.content, title: storePayload.name } }
        : section
    );
    await finishCreation(storePayload, customization, aiPrompt);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreateMoreStores || isSavingStore) return;
    const selectedTemplate = STORE_TEMPLATES.find((template) => template.id === newStore.templateId) || STORE_TEMPLATES[0];
    const payload = {
      name: newStore.name.trim(),
      domain: slugify(newStore.domain || newStore.name),
      description: newStore.description.trim(),
      theme: newStore.templateId === 'tech' ? 'dark' : 'light',
      primary_color: newStore.primaryColor,
      base_currency: 'EUR',
      enableAccounts: newStore.enableAccounts,
    };
    const config = buildTemplateCustomization(payload, newStore.templateId, newStore.primaryColor || selectedTemplate.accent);
    await finishCreation(payload, config, payload.name + ' ' + payload.description);
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      await deleteStoreAction(storeId);
      await fetchStores();
      setDeleteConfirmStoreId(null);
    } catch (err: any) {
      alert(`Erro ao eliminar loja: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-shopify-green" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[24px] font-[700] tracking-tight text-text-dark">Minhas Lojas</h1>
          <p className="text-[14px] text-text-muted mt-1">Gere as suas lojas ou crie uma loja completa com IA.</p>
        </div>
        <button
          onClick={() => canCreateMoreStores ? setIsCreating(true) : router.push('/dashboard/subscription')}
          className={`${canCreateMoreStores ? 'bg-shopify-green' : 'bg-orange-500'} text-white px-4 py-2 rounded-lg font-bold text-[13px] border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity`}
        >
          {canCreateMoreStores ? <Plus className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {canCreateMoreStores ? 'Criar nova loja' : 'Fazer upgrade'}
        </button>
      </div>

      {!canCreateMoreStores && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-orange-600 w-5 h-5" />
            <p className="text-sm text-orange-800 font-medium">
              Atingiu o limite de lojas do plano <span className="font-bold">{plan.name}</span> ({stores.length}/{plan.limits.stores}).
            </p>
          </div>
          <Link href="/dashboard/subscription" className="text-sm font-black text-orange-700 hover:underline whitespace-nowrap">
            Ver planos →
          </Link>
        </div>
      )}

      {isCreating && (
        <div className="bg-white rounded-[28px] shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden mb-8">
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-start gap-4">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-text-dark">
                {isAiMode ? <Sparkles className="w-5 h-5 text-shopify-green" /> : <Plus className="w-5 h-5" />}
                {isAiMode ? 'Gerar loja completa com IA' : 'Criar loja manualmente'}
              </h2>
              <p className="text-sm text-text-muted mt-1">A loja criada por IA já vem com layout, customização, produtos e imagens do nicho pedido.</p>
            </div>
            <button onClick={() => setIsCreating(false)} className="text-text-muted hover:text-text-dark border-none bg-transparent cursor-pointer font-bold">Esc</button>
          </div>

          <div className="p-6 max-h-[72vh] overflow-y-auto">
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => !isAiRestricted && setIsAiMode(true)}
                className={`relative px-4 py-2.5 text-[13px] font-bold rounded-xl transition-colors ${isAiMode ? 'bg-shopify-green text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 hover:bg-gray-100 text-text-muted'} ${isAiRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="inline-flex items-center gap-2"><Wand2 className="w-4 h-4" /> IA completa</span>
                {isAiRestricted && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />}
              </button>
              <button
                onClick={() => setIsAiMode(false)}
                className={`px-4 py-2.5 text-[13px] font-bold rounded-xl transition-colors ${!isAiMode ? 'bg-shopify-green text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 hover:bg-gray-100 text-text-muted'}`}
              >
                Manual
              </button>
            </div>

            {isAiMode ? (
              isAiRestricted ? (
                <div className="text-center py-10 space-y-4">
                  <Sparkles className="w-12 h-12 text-orange-500 mx-auto" />
                  <div>
                    <h3 className="font-black text-text-dark">Funcionalidade exclusiva PRO</h3>
                    <p className="text-sm text-text-muted mt-1">A criação automática com IA está disponível nos planos Pro, Business e Enterprise.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/subscription')} className="bg-shopify-green text-white px-6 py-2 rounded-lg font-bold text-sm border-none cursor-pointer">
                    Fazer upgrade agora
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-900">1. Descreve a loja que queres criar</p>
                    <p className="mt-1 text-xs text-emerald-700">A IA prepara a marca e o design. Só criamos a loja quando aprovares a proposta e os produtos.</p>
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(event) => { setAiPrompt(event.target.value); setAiConfig(null); setDraftProducts([]); setIncludeAiProducts(false); }}
                    rows={4}
                    disabled={isGenerating || isSavingStore}
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl focus:outline-none focus:border-shopify-green text-sm resize-none"
                    placeholder="Ex: loja de relógios premium, estilo preto e dourado, visual luxuoso"
                  />
                  {isGenerating && <div className="flex gap-2 items-center rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700"><Loader2 className="w-4 h-4 animate-spin" /> A criar uma proposta personalizada...</div>}
                  {aiConfig && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white">
                        <h3 className="text-base font-black text-slate-900">2. Revê a identidade visual e os dados</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-bold text-slate-600">Nome da loja
                            <input value={aiConfig.name || ''} onChange={(e) => setAiConfig({ ...aiConfig, name: e.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-900" />
                          </label>
                          <label className="text-xs font-bold text-slate-600">Endereço sugerido
                            <input value={aiConfig.domain || ''} onChange={(e) => setAiConfig({ ...aiConfig, domain: slugify(e.target.value) })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-900" />
                          </label>
                          <label className="text-xs font-bold text-slate-600 sm:col-span-2">Descrição
                            <textarea rows={2} value={aiConfig.description || ''} onChange={(e) => setAiConfig({ ...aiConfig, description: e.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-900" />
                          </label>
                          <label className="text-xs font-bold text-slate-600 flex items-center gap-3">Cor de destaque
                            <input type="color" value={aiConfig.primaryColor || '#008060'} onChange={(e) => setAiConfig({ ...aiConfig, primaryColor: e.target.value, customization: { ...aiConfig.customization, colors: { ...aiConfig.customization?.colors, accent: e.target.value, primary: e.target.value } } })} className="h-9 w-16 rounded-lg" />
                          </label>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ backgroundColor: aiConfig.customization?.colors?.background || '#ffffff', color: aiConfig.customization?.colors?.text || '#0f172a' }}>
                          <div className="p-3 border-b border-current/10 font-black text-sm">{aiConfig.name}</div>
                          <div className="p-6 md:p-8 text-center space-y-3" style={{ background: 'linear-gradient(140deg, transparent, ' + (aiConfig.primaryColor || '#008060') + '1c)' }}>
                            <span className="text-[10px] font-black uppercase tracking-widest">Pré-visualização da identidade</span>
                            <h4 className="text-2xl font-black" style={{ fontFamily: aiConfig.customization?.fonts?.heading || 'Inter' }}>{aiConfig.customization?.sections?.find((section: any) => section.type === 'hero')?.content?.title || aiConfig.name}</h4>
                            <p className="text-xs opacity-70">{aiConfig.customization?.hero?.subtitle || aiConfig.description}</p>
                            <span className="inline-block px-4 py-2 rounded-xl text-xs text-white font-bold" style={{ backgroundColor: aiConfig.primaryColor || '#008060' }}>Explorar coleção</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-base font-black text-slate-900">3. Escolhe os produtos</h3>
                      <StoreProductReview
                        products={draftProducts} onChange={setDraftProducts}
                        generateEnabled={includeAiProducts}
                        onGenerateEnabledChange={(enabled) => { setIncludeAiProducts(enabled); if (!enabled) setDraftProducts((list) => list.filter((p) => p.source === 'manual')); }}
                        onGenerate={handleProductGeneration} generating={isGeneratingProducts}
                        allowGeneration={true} storeContext={aiPrompt}
                      />
                    </div>
                  )}
                  {generationError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{generationError}</div>}
                </div>
              )
            ) : (
              <form id="manual-store-form" onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-text-dark mb-1">Nome da loja</label>
                    <input required type="text" value={newStore.name} onChange={(event) => setNewStore({ ...newStore, name: event.target.value })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-shopify-green text-sm" placeholder="Ex: Éclat Joias" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-text-dark mb-1">Domínio</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--color-border)] bg-bg-gray text-text-muted text-sm">/s/</span>
                      <input required type="text" value={newStore.domain} onChange={(event) => setNewStore({ ...newStore, domain: slugify(event.target.value) })} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border border-[var(--color-border)] focus:outline-none focus:border-shopify-green text-sm" placeholder="minha-loja" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-text-dark mb-1">Descrição</label>
                  <textarea rows={3} value={newStore.description} onChange={(event) => setNewStore({ ...newStore, description: event.target.value })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-shopify-green text-sm resize-none" placeholder="Breve descrição da loja..." />
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-900">Escolhe um template de loja</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STORE_TEMPLATES.map((template) => (
                      <button
                        key={template.id} type="button"
                        onClick={() => setNewStore({ ...newStore, templateId: template.id, primaryColor: template.accent, theme: template.id === 'tech' ? 'dark' : 'light' })}
                        aria-pressed={newStore.templateId === template.id}
                        className={'text-left overflow-hidden rounded-2xl border-2 transition-all ' + (newStore.templateId === template.id ? 'border-emerald-600 shadow-md' : 'border-slate-200 hover:border-emerald-300')}
                      >
                        <div className="h-24 p-3" style={{ backgroundColor: template.background, color: template.text }}>
                          <div className="flex justify-between items-center text-[10px] font-black"><span>{template.name}</span><span className="rounded-full w-3 h-3" style={{ backgroundColor: template.accent }} /></div>
                          <div className="mt-3 h-3 w-2/3 rounded" style={{ backgroundColor: template.text, opacity: .8 }} />
                          <div className="mt-2 h-2 w-1/2 rounded" style={{ backgroundColor: template.text, opacity: .25 }} />
                          <div className="mt-2 h-2 w-1/3 rounded" style={{ backgroundColor: template.accent }} />
                        </div>
                        <div className="bg-white p-3">
                          <p className="text-xs font-black text-slate-900">{template.name}</p>
                          <p className="text-[11px] text-slate-500">{template.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-3 text-xs font-bold text-slate-600">Personalizar cor principal
                    <input type="color" value={newStore.primaryColor} onChange={(event) => setNewStore({ ...newStore, primaryColor: event.target.value })} className="w-14 h-9 rounded-lg" />
                  </label>
                </div>

                <label className="flex items-start gap-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 cursor-pointer">
                  <input type="checkbox" checked={newStore.enableAccounts} onChange={(event) => setNewStore({ ...newStore, enableAccounts: event.target.checked })} className="mt-1 h-4 w-4 accent-shopify-green" />
                  <div>
                    <p className="text-sm font-black text-emerald-900 flex items-center gap-2"><UserRound className="w-4 h-4" /> Ativar login e criar conta na loja</p>
                    <p className="text-xs text-emerald-700 mt-1">Clientes podem criar conta só nesta loja. No checkout o nome/email aparecem automaticamente e carrinhos abandonados ficam ligados à conta.</p>
                  </div>
                </label>
                <StoreProductReview
                  products={draftProducts} onChange={setDraftProducts}
                  generateEnabled={false} onGenerateEnabledChange={() => {}}
                  onGenerate={async () => {}} generating={false}
                  allowGeneration={false} storeContext={newStore.name + ' ' + newStore.description}
                />
                {generationError && <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4">{generationError}</div>}
              </form>
            )}
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[var(--color-border)] p-4 flex items-center justify-between gap-4">
            <div className="hidden sm:block text-xs text-text-muted font-medium">
              {isAiMode ? (aiConfig ? 'Revê o design e aprova os produtos antes de criar.' : 'Primeiro vamos preparar uma proposta.') : 'Escolhe o template e adiciona produtos opcionais.'}
            </div>
            {isAiMode ? (
              <button
                type="button" onClick={aiConfig ? handleAiCreate : handleAiGenerate}
                disabled={isGenerating || isSavingStore || isGeneratingProducts || isAiRestricted}
                className="ml-auto bg-slate-950 text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-xl"
              >
                {isGenerating || isSavingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isSavingStore ? 'A criar loja...' : isGenerating ? 'A preparar design...' : aiConfig ? 'Confirmar e criar loja' : 'Preparar proposta com IA'}
                {!isGenerating && !isSavingStore && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button form="manual-store-form" type="submit" disabled={isSavingStore} className="ml-auto bg-shopify-green text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-xl">
                {isSavingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSavingStore ? 'A criar loja...' : 'Criar loja com este template'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="bg-white border border-border rounded-3xl p-12 text-center shadow-sm">
          <StoreIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-black text-text-dark">Ainda não tens lojas</h2>
          <p className="text-text-muted mt-2">Cria uma loja manualmente ou usa a IA para gerar uma loja completa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => {
            const accountsEnabled = store.customization?.accounts?.enabled !== false;

            return (
              <div key={store.id} className="bg-white border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: store.primary_color || '#008060' }}>
                      <StoreIcon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-text-dark truncate">{store.name}</h3>
                      <p className="text-xs text-text-muted truncate">/s/{store.domain}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteConfirmStoreId(store.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-text-muted min-h-[44px] line-clamp-2">{store.description || 'Sem descrição.'}</p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 border border-border px-3 py-1.5 text-[11px] font-black text-text-muted">
                  <UserRound className="w-3.5 h-3.5" />
                  Login da loja: <span className={accountsEnabled ? 'text-emerald-600' : 'text-slate-400'}>{accountsEnabled ? 'Ativo' : 'Desativo'}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <Link href={`/dashboard/stores/${store.id}/customize`} className="bg-slate-900 text-white py-2.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Customizar
                  </Link>
                  <Link href={`/dashboard/stores/${store.id}/accounts`} className="bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-2">
                    <UserRound className="w-4 h-4" /> Login
                  </Link>
                  <Link href={`/s/${store.domain}`} target="_blank" className="bg-slate-50 text-text-dark border border-border py-2.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Ver loja
                  </Link>
                </div>

                {deleteConfirmStoreId === store.id && (
                  <div className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
                    <p className="text-sm text-red-800 font-bold">Eliminar esta loja?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteStore(store.id)} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-xs font-black">Eliminar</button>
                      <button onClick={() => setDeleteConfirmStoreId(null)} className="flex-1 bg-white text-red-700 border border-red-100 rounded-lg py-2 text-xs font-black">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
