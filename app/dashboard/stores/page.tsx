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
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { generateStoreConfig } from '@/lib/ai-actions';
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
  const hasSections = Array.isArray(config?.sections) && config.sections.length > 0;

  return {
    ...fallback,
    ...(config || {}),
    header: { ...fallback.header, ...(config?.header || {}) },
    hero: { ...fallback.hero, ...(config?.hero || {}) },
    products: { ...fallback.products, ...(config?.products || {}) },
    colors: { ...fallback.colors, ...(config?.colors || {}) },
    fonts: { ...fallback.fonts, ...(config?.fonts || {}) },
    sections: hasSections ? config.sections : fallback.sections,
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
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);
  const [newStore, setNewStore] = useState({
    name: '',
    domain: '',
    description: '',
    theme: 'light' as 'light' | 'dark',
    primaryColor: '#008060',
  });
  const router = useRouter();

  const subscriptionTier = user?.subscriptionTier || 'STARTER';
  const plan = useMemo(() => SUBSCRIPTION_PLANS.find((item) => item.id === subscriptionTier) || SUBSCRIPTION_PLANS[0], [subscriptionTier]);
  const canCreateMoreStores = stores.length < plan.limits.stores;
  const isAiRestricted = plan.id === 'STARTER' || plan.id === 'GROWTH';

  const steps = [
    'Conceito e posicionamento da marca',
    'Identidade visual, cores e layout',
    'Produtos iniciais e imagens',
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

  const createProductsForStore = async (storeId: string, products: any[]) => {
    const safeProducts = Array.isArray(products) ? products : [];

    await Promise.all(
      safeProducts.slice(0, 8).map(async (product, index) => {
        try {
          const seed = slugify(product.imageKeyword || product.name || `produto-${index}`);
          await addProductAction({
            store_id: storeId,
            name: product.name || `Produto ${index + 1}`,
            description: product.description || 'Produto criado automaticamente pela IA.',
            price: Number(product.price) || 29.9,
            stock: Number(product.stock) || 50,
            image_url: `https://picsum.photos/seed/${seed}/800/1000`,
            category: product.category || 'Destaques',
          });
        } catch (error) {
          console.error('Error creating AI product:', error);
        }
      })
    );
  };

  const handleAiGenerate = async () => {
    if (isAiRestricted || !canCreateMoreStores) {
      router.push('/dashboard/subscription');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationError(null);

    const stepInterval = setInterval(() => {
      setGenerationStep((previous) => (previous < 3 ? previous + 1 : previous));
    }, 1300);

    try {
      const config = await generateStoreConfig(aiPrompt.trim() || 'Cria uma loja incrível e perfeita.');
      const domainBase = config.domain || config.name || `loja-ia-${Date.now()}`;
      const storePayload = {
        name: config.name || 'Loja Gerada por IA',
        domain: withUniqueSuffix(domainBase),
        description: config.description || 'Loja criada automaticamente com IA.',
        theme: config.theme === 'dark' ? 'dark' : 'light',
        primary_color: config.primaryColor || '#008060',
        base_currency: 'EUR',
      };

      const store = await createStoreAction(storePayload);
      const customization = normalizeCustomization(config.customization, { ...storePayload, ...store });

      await updateStoreCustomizationAction(store.id, customization);
      await createProductsForStore(store.id, config.products || []);
      await selectCreatedStore(store.id);

      clearInterval(stepInterval);
      setGenerationStep(4);
      await fetchStores();
      router.refresh();

      setTimeout(() => {
        setIsGenerating(false);
        setIsCreating(false);
        setIsAiMode(false);
        setAiPrompt('Cria uma loja incrível, moderna, bonita e pronta para publicar.');
      }, 650);
    } catch (error: any) {
      clearInterval(stepInterval);
      console.error('Erro detalhado da IA:', error);
      setGenerationError(error.message || 'Erro inesperado ao gerar a loja.');
      setIsGenerating(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreateMoreStores) {
      router.push('/dashboard/subscription');
      return;
    }

    try {
      const storePayload = {
        name: newStore.name,
        domain: slugify(newStore.domain || newStore.name),
        description: newStore.description,
        theme: newStore.theme,
        primary_color: newStore.primaryColor,
        base_currency: 'EUR',
      };

      const store = await createStoreAction(storePayload);
      await updateStoreCustomizationAction(store.id, buildDefaultCustomization(storePayload));
      await selectCreatedStore(store.id);

      setIsCreating(false);
      setNewStore({ name: '', domain: '', description: '', theme: 'light', primaryColor: '#008060' });
      await fetchStores();
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao criar loja: ${err.message}`);
    }
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
              <p className="text-sm text-text-muted mt-1">A loja criada por IA já vem com layout, customização e produtos iniciais.</p>
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
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <p className="text-sm text-emerald-900 font-bold">Escreve pouco ou muito. A IA completa o resto.</p>
                    <p className="text-sm text-emerald-700 mt-1">Com um prompt simples, ela escolhe nicho, branding, cores, layout, secções e cria produtos reais na aba Produtos.</p>
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl focus:outline-none focus:border-shopify-green text-sm resize-none"
                    placeholder="Ex: cria uma loja incrível e perfeita"
                  />

                  {isGenerating && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      {steps.map((step, index) => (
                        <div key={step} className={`flex items-center gap-3 text-sm ${index <= generationStep ? 'text-shopify-green font-bold' : 'text-slate-400'}`}>
                          {index <= generationStep ? <Sparkles className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                          {step}
                        </div>
                      ))}
                    </div>
                  )}

                  {generationError && <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">{generationError}</div>}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-text-dark mb-1">Tema</label>
                    <select value={newStore.theme} onChange={(event) => setNewStore({ ...newStore, theme: event.target.value as 'light' | 'dark' })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-shopify-green text-sm">
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-text-dark mb-1">Cor principal</label>
                    <input type="color" value={newStore.primaryColor} onChange={(event) => setNewStore({ ...newStore, primaryColor: event.target.value })} className="w-full h-10 border border-[var(--color-border)] rounded-lg" />
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[var(--color-border)] p-4 flex items-center justify-between gap-4">
            <div className="hidden sm:block text-xs text-text-muted font-medium">
              {isAiMode ? 'Cria loja + layout + produtos automaticamente.' : 'Cria a loja e abre o editor visual depois.'}
            </div>
            {isAiMode ? (
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating || isAiRestricted}
                className="ml-auto bg-slate-950 text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'A criar loja completa...' : 'Criar loja com IA'}
                {!isGenerating && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                form="manual-store-form"
                type="submit"
                className="ml-auto bg-shopify-green text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xl"
              >
                Criar loja manualmente
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
          {stores.map((store) => (
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

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Link href={`/dashboard/stores/${store.id}/customize`} className="bg-slate-900 text-white py-2.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Customizar
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
          ))}
        </div>
      )}
    </div>
  );
}
