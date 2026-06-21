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

function hashString(value: string) {
  return value.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}

type ManualTemplateId = 'clean-premium' | 'dark-launch' | 'editorial-luxury' | 'bold-campaign' | 'boutique-gallery';

const MANUAL_TEMPLATES: Array<{
  id: ManualTemplateId;
  name: string;
  description: string;
  badge: string;
  preview: string;
  highlights: string[];
}> = [
  {
    id: 'clean-premium',
    name: 'Clean Premium',
    description: 'Layout branco, direto e profissional para qualquer nicho.',
    badge: 'Minimal',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 48%, #d1fae5 100%)',
    highlights: ['Hero central', 'Produtos em grelha', 'Mensagem de confiança'],
  },
  {
    id: 'dark-launch',
    name: 'Dark Launch',
    description: 'Visual escuro e forte para tech, moda, gaming ou produtos premium.',
    badge: 'Escuro',
    preview: 'linear-gradient(135deg, #020617 0%, #111827 52%, #22c55e 100%)',
    highlights: ['Impacto visual', 'CTA forte', 'Bloco editorial'],
  },
  {
    id: 'editorial-luxury',
    name: 'Editorial Luxury',
    description: 'Estilo revista, sofisticado e ideal para marcas premium.',
    badge: 'Luxo',
    preview: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 52%, #92400e 100%)',
    highlights: ['Imagem grande', 'Storytelling', 'Produtos selecionados'],
  },
  {
    id: 'bold-campaign',
    name: 'Bold Campaign',
    description: 'Template jovem, comercial e pensado para conversão rápida.',
    badge: 'Vendas',
    preview: 'linear-gradient(135deg, #fff1f2 0%, #fb7185 48%, #111827 100%)',
    highlights: ['Botão no topo', 'Cores fortes', 'Secções curtas'],
  },
  {
    id: 'boutique-gallery',
    name: 'Boutique Gallery',
    description: 'Layout visual com banner, galeria e sensação de marca artesanal.',
    badge: 'Galeria',
    preview: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 48%, #7c3aed 100%)',
    highlights: ['Banner visual', 'História da marca', 'Espaçamento premium'],
  },
];

const AI_LAYOUT_VARIANTS = [
  { id: 'ai-split-showcase', columns: 3, heroHeight: 620, logoPosition: 'left', textAlign: 'left', mood: 'showcase premium' },
  { id: 'ai-dark-impact', columns: 4, heroHeight: 660, logoPosition: 'center', textAlign: 'center', mood: 'lançamento escuro' },
  { id: 'ai-editorial-story', columns: 3, heroHeight: 580, logoPosition: 'center', textAlign: 'left', mood: 'editorial de marca' },
  { id: 'ai-bold-conversion', columns: 4, heroHeight: 540, logoPosition: 'left', textAlign: 'center', mood: 'campanha de vendas' },
  { id: 'ai-gallery-brand', columns: 3, heroHeight: 700, logoPosition: 'left', textAlign: 'left', mood: 'galeria aspiracional' },
  { id: 'ai-minimal-lab', columns: 4, heroHeight: 500, logoPosition: 'center', textAlign: 'center', mood: 'minimal premium' },
];

function getSection(config: any, type: string) {
  return Array.isArray(config?.sections) ? config.sections.find((section: any) => section.type === type) : null;
}

function buildManualCustomization(store: any, templateId: ManualTemplateId) {
  const accent = store.primary_color || store.primaryColor || '#008060';
  const name = store.name || 'A tua loja online';
  const description = store.description || 'Uma loja moderna, rápida e pronta para publicar.';
  const imageSeed = slugify(`${name}-${templateId}-${Date.now()}`);
  const accounts = { enabled: store.enableAccounts !== false, requireLoginForCheckout: false, allowRegistration: true };
  const commonProducts = { gap: 28, aspectRatio: 'portrait', showPrice: true, showStock: true };

  const templates: Record<ManualTemplateId, any> = {
    'clean-premium': {
      layoutVariant: 'manual-clean-premium',
      accounts,
      header: { sticky: true, logoPosition: 'left', height: 72 },
      hero: { height: 520, textAlign: 'center', showOverlay: true, overlayOpacity: 0.12, title: name, subtitle: description },
      products: { ...commonProducts, columns: 4 },
      colors: { background: '#ffffff', text: '#0f172a', accent, muted: '#64748b', primary: accent },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        { id: 'hero-1', type: 'hero', content: { title: name, subtitle: description, buttonText: 'Ver coleção' }, styles: { height: 520, textAlign: 'center' } },
        { id: 'text-1', type: 'text', content: { text: 'Uma experiência de compra simples, elegante e preparada para transmitir confiança desde o primeiro clique.' }, styles: { textAlign: 'center' } },
        { id: 'products-1', type: 'products', content: { title: 'Produtos em destaque' }, styles: { columns: 4, textAlign: 'left' } },
      ],
    },
    'dark-launch': {
      layoutVariant: 'manual-dark-launch',
      accounts,
      header: { sticky: true, logoPosition: 'center', height: 80 },
      hero: { height: 650, textAlign: 'center', showOverlay: true, overlayOpacity: 0.24, title: name, subtitle: description },
      products: { ...commonProducts, columns: 4, gap: 32 },
      colors: { background: '#020617', text: '#f8fafc', accent, muted: '#94a3b8', primary: accent },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        { id: 'hero-1', type: 'hero', content: { title: name, subtitle: description, buttonText: 'Entrar na coleção' }, styles: { height: 650, textAlign: 'center' } },
        { id: 'button-1', type: 'button', content: { text: 'Comprar agora', action: 'checkout', url: '#produtos' }, styles: { textAlign: 'center' } },
        { id: 'text-1', type: 'text', content: { text: 'Um visual forte para apresentar produtos com atitude, desejo e uma sensação de marca exclusiva.' }, styles: { textAlign: 'center' } },
        { id: 'products-1', type: 'products', content: { title: 'Coleção principal' }, styles: { columns: 4, textAlign: 'left' } },
      ],
    },
    'editorial-luxury': {
      layoutVariant: 'manual-editorial-luxury',
      accounts,
      header: { sticky: true, logoPosition: 'center', height: 78 },
      hero: { height: 600, textAlign: 'left', showOverlay: true, overlayOpacity: 0.16, title: name, subtitle: description },
      products: { ...commonProducts, columns: 3, gap: 34 },
      colors: { background: '#fffaf0', text: '#111827', accent: '#b7791f', muted: '#8a6f3d', primary: '#b7791f' },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        { id: 'hero-1', type: 'hero', content: { title: name, subtitle: description, buttonText: 'Descobrir seleção' }, styles: { height: 600, textAlign: 'left' } },
        { id: 'image-1', type: 'image', content: { url: `https://picsum.photos/seed/${imageSeed}-editorial/1400/560`, alt: `${name} editorial` }, styles: { textAlign: 'center' } },
        { id: 'text-1', type: 'text', content: { text: 'Criámos uma apresentação editorial para dar à loja uma sensação premium, cuidada e memorável.' }, styles: { textAlign: 'left' } },
        { id: 'products-1', type: 'products', content: { title: 'Seleção premium' }, styles: { columns: 3, textAlign: 'left' } },
        { id: 'button-1', type: 'button', content: { text: 'Finalizar compra', action: 'checkout', url: '#produtos' }, styles: { textAlign: 'center' } },
      ],
    },
    'bold-campaign': {
      layoutVariant: 'manual-bold-campaign',
      accounts,
      header: { sticky: true, logoPosition: 'left', height: 70 },
      hero: { height: 540, textAlign: 'center', showOverlay: true, overlayOpacity: 0.1, title: name, subtitle: description },
      products: { ...commonProducts, columns: 4, gap: 24 },
      colors: { background: '#fff7ed', text: '#1f2937', accent: '#f97316', muted: '#78716c', primary: '#f97316' },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        { id: 'hero-1', type: 'hero', content: { title: name, subtitle: description, buttonText: 'Comprar coleção' }, styles: { height: 540, textAlign: 'center' } },
        { id: 'button-1', type: 'button', content: { text: 'Ver ofertas', action: 'checkout', url: '#produtos' }, styles: { textAlign: 'center' } },
        { id: 'text-1', type: 'text', content: { text: 'Uma página criada para vender rápido: mensagem clara, chamada forte e produtos fáceis de explorar.' }, styles: { textAlign: 'center' } },
        { id: 'products-1', type: 'products', content: { title: 'Mais vendidos' }, styles: { columns: 4, textAlign: 'left' } },
      ],
    },
    'boutique-gallery': {
      layoutVariant: 'manual-boutique-gallery',
      accounts,
      header: { sticky: true, logoPosition: 'left', height: 76 },
      hero: { height: 700, textAlign: 'left', showOverlay: true, overlayOpacity: 0.2, title: name, subtitle: description },
      products: { ...commonProducts, columns: 3, gap: 36 },
      colors: { background: '#f5f3ff', text: '#18181b', accent: '#7c3aed', muted: '#71717a', primary: '#7c3aed' },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        { id: 'hero-1', type: 'hero', content: { title: name, subtitle: description, buttonText: 'Explorar boutique' }, styles: { height: 700, textAlign: 'left' } },
        { id: 'image-1', type: 'image', content: { url: `https://picsum.photos/seed/${imageSeed}-gallery/1400/640`, alt: `${name} gallery` }, styles: { textAlign: 'center' } },
        { id: 'text-1', type: 'text', content: { text: 'Uma montra visual para marcas que querem parecer cuidadas, exclusivas e próximas do cliente.' }, styles: { textAlign: 'center' } },
        { id: 'spacer-1', type: 'spacer', content: {}, styles: { height: 34 } },
        { id: 'products-1', type: 'products', content: { title: 'Peças escolhidas' }, styles: { columns: 3, textAlign: 'left' } },
      ],
    },
  };

  return templates[templateId];
}

function buildDefaultCustomization(store: any) {
  return buildManualCustomization(store, 'clean-premium');
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

function buildAiUniqueCustomization(config: any, store: any, prompt: string, bannerKeyword?: string) {
  const base = normalizeCustomization(config, store);
  const seed = `${prompt}-${store.name}-${store.domain}-${Date.now()}-${Math.random()}`;
  const variant = AI_LAYOUT_VARIANTS[Math.abs(hashString(seed)) % AI_LAYOUT_VARIANTS.length];
  const imageSeed = slugify(`${bannerKeyword || prompt || store.name}-${variant.id}-${Date.now()}`);
  const heroSection = getSection(base, 'hero');
  const textSection = getSection(base, 'text');
  const productsSection = getSection(base, 'products');
  const buttonSection = getSection(base, 'button');
  const imageSection = getSection(base, 'image');
  const title = heroSection?.content?.title || base.hero?.title || store.name;
  const subtitle = heroSection?.content?.subtitle || base.hero?.subtitle || store.description;
  const buttonText = heroSection?.content?.buttonText || 'Explorar coleção';
  const text = textSection?.content?.text || `Uma experiência de compra única, criada automaticamente pela IA para transmitir ${variant.mood}.`;
  const productTitle = productsSection?.content?.title || 'Produtos em destaque';

  const hero = { id: `hero-${variant.id}`, type: 'hero', content: { title, subtitle, buttonText }, styles: { height: variant.heroHeight, textAlign: variant.textAlign } };
  const story = { id: `story-${variant.id}`, type: 'text', content: { text }, styles: { textAlign: variant.textAlign } };
  const image = imageSection || { id: `image-${variant.id}`, type: 'image', content: { url: `https://picsum.photos/seed/${imageSeed}/1400/620`, alt: `${store.name} ${variant.mood}` }, styles: { textAlign: 'center' } };
  const button = buttonSection || { id: `cta-${variant.id}`, type: 'button', content: { text: 'Comprar agora', action: 'checkout', url: '#produtos' }, styles: { textAlign: 'center' } };
  const products = { id: `products-${variant.id}`, type: 'products', content: { title: productTitle }, styles: { columns: variant.columns, textAlign: 'left' } };
  const orders: Record<string, any[]> = {
    'ai-split-showcase': [hero, story, image, products, button],
    'ai-dark-impact': [hero, button, story, products],
    'ai-editorial-story': [hero, image, story, products, button],
    'ai-bold-conversion': [hero, button, products, story],
    'ai-gallery-brand': [hero, image, story, { id: `spacer-${variant.id}`, type: 'spacer', content: {}, styles: { height: 42 } }, products],
    'ai-minimal-lab': [hero, story, products],
  };

  return {
    ...base,
    layoutVariant: variant.id,
    header: { ...base.header, logoPosition: variant.logoPosition, height: variant.id === 'ai-dark-impact' ? 82 : base.header?.height || 76 },
    hero: { ...base.hero, height: variant.heroHeight, textAlign: variant.textAlign },
    products: { ...base.products, columns: variant.columns, gap: variant.columns === 3 ? 34 : 28 },
    sections: orders[variant.id] || [hero, story, products],
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
    templateId: 'clean-premium' as ManualTemplateId,
    enableAccounts: true,
  });
  const router = useRouter();

  const subscriptionTier = user?.subscriptionTier || 'STARTER';
  const plan = useMemo(() => SUBSCRIPTION_PLANS.find((item) => item.id === subscriptionTier) || SUBSCRIPTION_PLANS[0], [subscriptionTier]);
  const canCreateMoreStores = stores.length < plan.limits.stores;
  const isAiRestricted = plan.id === 'STARTER' || plan.id === 'GROWTH';

  const steps = [
    'Conceito e posicionamento da marca',
    'Identidade visual, cores e layout único',
    'Produtos iniciais com imagens certas',
    'Finalização e ligação ao dashboard',
  ];

  const resetNewStore = () => setNewStore({ name: '', domain: '', description: '', theme: 'light', primaryColor: '#008060', templateId: 'clean-premium', enableAccounts: true });

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

  const createProductsForStore = async (storeId: string, products: any[], storeContext = '') => {
    const safeProducts = Array.isArray(products) ? products : [];

    await Promise.all(
      safeProducts.slice(0, 8).map(async (product, index) => {
        try {
          await addProductAction({
            store_id: storeId,
            name: product.name || `Produto ${index + 1}`,
            description: product.description || 'Produto criado automaticamente pela IA.',
            price: Number(product.price) || 29.9,
            stock: Number(product.stock) || 50,
            image_url: getProductSmartImage(product, index, storeContext),
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
        enableAccounts: true,
      };

      const store = await createStoreAction(storePayload);
      const storeContext = `${aiPrompt} ${storePayload.name} ${storePayload.description}`;
      const customization = buildAiUniqueCustomization(config.customization, { ...storePayload, ...store, bannerKeyword: config.bannerKeyword }, aiPrompt, config.bannerKeyword);

      await updateStoreCustomizationAction(store.id, customization);
      await createProductsForStore(store.id, config.products || [], storeContext);
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
        enableAccounts: newStore.enableAccounts,
      };

      const store = await createStoreAction(storePayload);
      await updateStoreCustomizationAction(store.id, buildManualCustomization(storePayload, newStore.templateId));
      await selectCreatedStore(store.id);

      setIsCreating(false);
      resetNewStore();
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
              <p className="text-sm text-text-muted mt-1">
                {isAiMode ? 'A IA cria um template único, com estrutura e secções diferentes a cada geração.' : 'Escolhe um dos 5 templates para a loja não nascer igual às outras.'}
              </p>
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
                    <p className="text-sm text-emerald-900 font-bold">A IA agora cria um template único.</p>
                    <p className="text-sm text-emerald-700 mt-1">Mesmo que duas lojas sejam do mesmo nicho, a estrutura, ordem das secções, hero e grelha podem mudar.</p>
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl focus:outline-none focus:border-shopify-green text-sm resize-none"
                    placeholder="Ex: cria uma loja de relógios premium com estilo preto e dourado"
                  />

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-emerald-900">Contas de cliente ativadas</p>
                      <p className="text-xs text-emerald-700 mt-1">As lojas criadas por IA já vêm com login/criar conta no storefront. Podes desligar depois no botão Login de cada loja.</p>
                    </div>
                  </div>

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
              <form id="manual-store-form" onSubmit={handleCreate} className="space-y-5">
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
                    <label className="block text-[13px] font-bold text-text-dark mb-1">Tema base</label>
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-[13px] font-black text-text-dark">Escolhe um template</label>
                      <p className="text-xs text-text-muted mt-1">Cada template guarda uma estrutura diferente na loja.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-shopify-green bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">5 opções</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    {MANUAL_TEMPLATES.map((template) => {
                      const selected = newStore.templateId === template.id;

                      return (
                        <button
                          type="button"
                          key={template.id}
                          onClick={() => setNewStore({ ...newStore, templateId: template.id })}
                          className={`text-left rounded-2xl border p-3 transition-all ${selected ? 'border-shopify-green bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-[var(--color-border)] bg-white hover:border-shopify-green/50 hover:shadow-md'}`}
                        >
                          <div className="h-20 rounded-xl mb-3 border border-black/5" style={{ background: template.preview }} />
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-black text-text-dark">{template.name}</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${selected ? 'bg-shopify-green text-white' : 'bg-slate-100 text-slate-500'}`}>{template.badge}</span>
                          </div>
                          <p className="text-[11px] text-text-muted leading-relaxed">{template.description}</p>
                          <div className="mt-3 space-y-1">
                            {template.highlights.slice(0, 2).map((item) => <p key={item} className="text-[10px] font-bold text-slate-500">• {item}</p>)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-start gap-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 cursor-pointer">
                  <input type="checkbox" checked={newStore.enableAccounts} onChange={(event) => setNewStore({ ...newStore, enableAccounts: event.target.checked })} className="mt-1 h-4 w-4 accent-shopify-green" />
                  <div>
                    <p className="text-sm font-black text-emerald-900 flex items-center gap-2"><UserRound className="w-4 h-4" /> Ativar login e criar conta na loja</p>
                    <p className="text-xs text-emerald-700 mt-1">Clientes podem criar conta só nesta loja. No checkout o nome/email aparecem automaticamente e carrinhos abandonados ficam ligados à conta.</p>
                  </div>
                </label>
              </form>
            )}
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[var(--color-border)] p-4 flex items-center justify-between gap-4">
            <div className="hidden sm:block text-xs text-text-muted font-medium">
              {isAiMode ? 'Cria loja + layout único + produtos + imagens certas.' : `Template escolhido: ${MANUAL_TEMPLATES.find((template) => template.id === newStore.templateId)?.name || 'Clean Premium'}.`}
            </div>
            {isAiMode ? (
              <button onClick={handleAiGenerate} disabled={isGenerating || isAiRestricted} className="ml-auto bg-slate-950 text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xl">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'A criar loja completa...' : 'Criar loja com IA'}
                {!isGenerating && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button form="manual-store-form" type="submit" className="ml-auto bg-shopify-green text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xl">
                Criar com este template
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
          <p className="text-text-muted mt-2">Cria uma loja manualmente com template ou usa a IA para gerar uma loja completa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => {
            const accountsEnabled = store.customization?.accounts?.enabled !== false;
            const layoutName = store.customization?.layoutVariant ? String(store.customization.layoutVariant).replace(/^(manual|ai)-/, '').replace(/-/g, ' ') : 'template base';

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

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-border px-3 py-1.5 text-[11px] font-black text-text-muted">
                    <UserRound className="w-3.5 h-3.5" />
                    Login da loja: <span className={accountsEnabled ? 'text-emerald-600' : 'text-slate-400'}>{accountsEnabled ? 'Ativo' : 'Desativo'}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[11px] font-black text-emerald-700 capitalize">
                    <Sparkles className="w-3.5 h-3.5" /> {layoutName}
                  </div>
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
