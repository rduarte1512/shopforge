'use client';

import { getStorefrontDataAction } from '@/lib/actions';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { useComparisonStore } from '@/lib/comparison-store';
import {
  ArrowRight,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Phone,
  Scale,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function hexToRgb(hex: string) {
  const clean = hex?.replace('#', '') || '008060';
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const bigint = parseInt(value, 16);
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

function getProductImage(product: any, index = 0) {
  if (product?.image_url) return product.image_url;
  return `https://picsum.photos/seed/${encodeURIComponent(product?.name || `produto-${index}`)}/900/1100`;
}

function getSafeSections(store: any, customization: any) {
  const sections = customization?.sections;

  if (Array.isArray(sections) && sections.length > 0) return sections;

  return [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        title: store.name,
        subtitle: store.description || 'Uma experiência de compra premium, rápida e pensada para ti.',
        buttonText: 'Explorar coleção',
      },
      styles: { height: 640, textAlign: 'left' },
    },
    {
      id: 'text-1',
      type: 'text',
      content: { text: 'Produtos selecionados com cuidado, apresentados numa experiência moderna e profissional.' },
      styles: { textAlign: 'center' },
    },
    {
      id: 'products-1',
      type: 'products',
      content: { title: 'Produtos em destaque' },
      styles: { columns: 4, textAlign: 'left' },
    },
  ];
}

function ProductCard({ product, index, store, formatPrice, addItem, isInComparison, addProduct, removeProduct, colors }: any) {
  return (
    <article className="group relative rounded-[32px] border border-black/5 bg-white/70 p-3 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/10">
      <Link href={`/s/${store.domain}/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-100">
        <Image
          src={getProductImage(product, index)}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm backdrop-blur">
          {product.category || 'Premium'}
        </div>
      </Link>

      <button
        onClick={() => isInComparison(product.id) ? removeProduct(product.id) : addProduct(product.id)}
        className={`absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full shadow-xl transition-all ${isInComparison(product.id) ? 'bg-slate-950 text-white' : 'bg-white/90 text-slate-950 hover:bg-slate-950 hover:text-white'}`}
      >
        {isInComparison(product.id) ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      </button>

      <div className="space-y-4 px-2 pb-3 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/s/${store.domain}/product/${product.id}`} className="block text-base font-black leading-tight tracking-tight text-slate-950 transition-colors hover:opacity-70">
              {product.name}
            </Link>
            {product.description && <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">{product.description}</p>}
          </div>
          <p className="shrink-0 text-lg font-black" style={{ color: colors.accent }}>{formatPrice(product.price)}</p>
        </div>

        <button
          onClick={() => addItem(product.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          style={{ backgroundColor: colors.accent }}
        >
          <ShoppingCart className="h-4 w-4" />
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}

export default function StorefrontHomePage() {
  const params = useParams() as { domain: string };
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { addItem } = useCart();
  const { formatPrice, currency, setCurrency, availableCurrencies } = useCurrency();
  const { productIds: comparisonIds, addProduct, removeProduct, isInComparison, clearComparison } = useComparisonStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    async function fetchData() {
      if (!params.domain || fetchedRef.current) return;

      const cacheKey = `store_data_${params.domain}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { store: s, products: p, promotions: pr } = JSON.parse(cached);
          setStore(s);
          setProducts(p || []);
          setPromotions(pr || []);
          setLoading(false);
          fetchedRef.current = true;
          return;
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        fetchedRef.current = true;
        const data = await getStorefrontDataAction(params.domain);

        if (!data) {
          setLoading(false);
          return;
        }

        setStore(data.store);
        setProducts(data.products || []);
        setPromotions(data.promotions || []);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchData, 100);
    return () => clearTimeout(timer);
  }, [params.domain]);

  const comparedProducts = products.filter((product) => comparisonIds.includes(product.id));

  const customization = store?.customization || {};
  const colors = customization.colors || {
    background: '#ffffff',
    text: '#0f172a',
    accent: store?.primary_color || '#008060',
    muted: '#64748b',
    primary: store?.primary_color || '#008060',
  };
  const rgbAccent = hexToRgb(colors.accent);
  const fonts = customization.fonts || { heading: 'Inter', body: 'Inter' };
  const header = customization.header || { sticky: true, logoPosition: 'left', height: 74 };
  const sections = store ? getSafeSections(store, customization) : [];
  const heroSection = sections.find((section: any) => section.type === 'hero');
  const productSection = sections.find((section: any) => section.type === 'products');
  const bannerPromos = promotions.filter((promo) => promo.position === 'banner');
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))], [products]);
  const filteredProducts = selectedCategory === 'Todos' ? products : products.filter((product) => product.category === selectedCategory);
  const featuredProducts = products.slice(0, 3);
  const heroProduct = products[0];

  const handleButtonAction = (action?: string, url?: string) => {
    if (action === 'link' && url) window.open(url, '_blank');
    else if (action === 'whatsapp') {
      const cleanPhone = (store.phone || '').replace(/\s+/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else if (action === 'checkout') window.location.href = `/s/${store.domain}/cart`;
    else document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderDynamicSection = (section: any) => {
    if (section.type === 'hero' || section.type === 'products') return null;

    if (section.type === 'text') {
      return (
        <section key={section.id} className="mx-auto max-w-7xl px-6 py-16" style={{ textAlign: (section.styles?.textAlign as any) || 'left' }}>
          <div className="rounded-[40px] border border-black/5 bg-white/60 p-8 shadow-sm backdrop-blur md:p-12">
            <p className="mx-auto max-w-4xl whitespace-pre-wrap text-xl font-semibold leading-relaxed text-slate-700 md:text-2xl">{section.content?.text}</p>
          </div>
        </section>
      );
    }

    if (section.type === 'button') {
      return (
        <section key={section.id} className="mx-auto max-w-7xl px-6 py-8" style={{ textAlign: (section.styles?.textAlign as any) || 'center' }}>
          <button
            onClick={() => handleButtonAction(section.content?.action, section.content?.url)}
            className="inline-flex items-center gap-3 rounded-2xl px-10 py-5 text-lg font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: colors.accent }}
          >
            {section.content?.text || 'Comprar agora'}
            {section.content?.action === 'whatsapp' && <Phone className="h-5 w-5" />}
            {section.content?.action === 'link' && <ExternalLink className="h-5 w-5" />}
            {section.content?.action === 'checkout' && <ShoppingCart className="h-5 w-5" />}
          </button>
        </section>
      );
    }

    if (section.type === 'image') {
      return (
        <section key={section.id} className="mx-auto max-w-7xl px-6 py-12">
          <div className="group overflow-hidden rounded-[44px] border border-black/5 shadow-2xl">
            <img src={section.content?.url} alt={section.content?.alt || store.name} className="h-auto w-full transition-transform duration-1000 group-hover:scale-105" />
          </div>
        </section>
      );
    }

    if (section.type === 'spacer') return <div key={section.id} style={{ height: `${section.styles?.height || 40}px` }} />;
    return null;
  };

  if (!store && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100"><ShoppingCart className="h-10 w-10 text-gray-300" /></div>
        <h1 className="mb-2 text-2xl font-bold">Loja não encontrada</h1>
        <p className="mb-8 max-w-md text-gray-500">Não conseguimos encontrar a loja que procura. Verifique o endereço ou contacte o proprietário.</p>
        <Link href="/" className="rounded-xl bg-black px-8 py-3 font-bold text-white transition-colors hover:bg-gray-800">Voltar ao ShopForge</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  if (!store) return null;

  const activePromo = promotions.length > 0 ? promotions[0] : null;

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: colors.background, color: colors.text, fontFamily: fonts.body }}>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950 px-4 py-2 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center text-[11px] font-black uppercase tracking-[0.22em] text-white/75">
          <Sparkles className="h-3.5 w-3.5" style={{ color: colors.accent }} />
          Envio seguro · Pagamento protegido · Coleção selecionada
        </div>
      </div>

      <header
        className={`${header.sticky ? 'fixed top-8' : 'relative mt-8'} left-0 right-0 z-40 border-b border-black/5 bg-white/75 px-6 py-4 shadow-sm backdrop-blur-xl transition-all`}
        style={{ height: `${header.height}px`, display: 'flex', alignItems: 'center' }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6">
          <Link href={`/s/${store.domain}`} className={`flex items-center gap-3 ${header.logoPosition === 'center' ? 'flex-1 justify-center' : ''}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: colors.accent }}>
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="text-xl font-black tracking-tight text-slate-950">{store.name}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-black text-slate-500 md:flex">
            <button onClick={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })} className="transition-colors hover:text-slate-950">Coleção</button>
            <button onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })} className="transition-colors hover:text-slate-950">Sobre</button>
            <Link href={`/s/${store.domain}/cart`} className="transition-colors hover:text-slate-950">Carrinho</Link>
          </nav>

          <div className="flex items-center gap-3">
            <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="rounded-full border-none bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 focus:ring-2 focus:ring-black/5">
              {availableCurrencies.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Link href={`/s/${store.domain}/cart`} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className={`${header.sticky ? 'pt-[calc(32px+74px)]' : ''}`}>
        <section
          className="relative overflow-hidden px-6 py-20 md:py-28"
          style={{ minHeight: `${heroSection?.styles?.height || 700}px`, background: `radial-gradient(circle at 15% 20%, rgba(${rgbAccent}, 0.18), transparent 28%), radial-gradient(circle at 90% 10%, rgba(${rgbAccent}, 0.10), transparent 25%)` }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ backgroundColor: `rgba(${rgbAccent}, .2)` }} />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm backdrop-blur">
                <Star className="h-4 w-4" style={{ color: colors.accent }} />
                Marca premium online
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 md:text-7xl lg:text-8xl" style={{ fontFamily: fonts.heading }}>
                {activePromo?.title || heroSection?.content?.title || store.name}
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-semibold leading-relaxed text-slate-600 md:text-xl">
                {activePromo?.subtitle || heroSection?.content?.subtitle || store.description}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleButtonAction('products')}
                  className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-black text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
                  style={{ backgroundColor: colors.accent }}
                >
                  {heroSection?.content?.buttonText || 'Explorar coleção'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link href={`/s/${store.domain}/cart`} className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-8 py-4 text-sm font-black text-slate-950 shadow-sm backdrop-blur transition-all hover:bg-white">
                  Ver carrinho
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ['+8', 'Produtos curados'],
                  ['24h', 'Resposta rápida'],
                  ['100%', 'Pagamento seguro'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur">
                    <p className="text-2xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="absolute -left-8 top-12 h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: `rgba(${rgbAccent}, .35)` }} />
              <div className="relative rounded-[44px] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[34px] bg-slate-100">
                  {heroProduct ? (
                    <Image src={getProductImage(heroProduct, 0)} alt={heroProduct.name} fill className="object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full items-center justify-center" style={{ background: `linear-gradient(135deg, rgba(${rgbAccent}, .18), rgba(${rgbAccent}, .04))` }}><ShoppingBag className="h-20 w-20 opacity-20" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-white/90 p-4 shadow-xl backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produto em destaque</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="font-black leading-tight text-slate-950">{heroProduct?.name || store.name}</p>
                        {heroProduct?.category && <p className="mt-1 text-xs font-bold text-slate-400">{heroProduct.category}</p>}
                      </div>
                      {heroProduct && <p className="text-lg font-black" style={{ color: colors.accent }}>{formatPrice(heroProduct.price)}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {featuredProducts.length > 1 && (
                <div className="absolute -bottom-6 -left-6 hidden rounded-3xl border border-black/5 bg-white/90 p-3 shadow-2xl backdrop-blur md:block">
                  <div className="flex -space-x-3">
                    {featuredProducts.map((product, index) => (
                      <div key={product.id} className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-slate-100">
                        <Image src={getProductImage(product, index)} alt={product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-black/5 bg-slate-950 px-6 py-5 text-white">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
            {[
              [ShieldCheck, 'Compra segura', 'Proteção em todo o checkout'],
              [Truck, 'Envio preparado', 'Processamento rápido de pedidos'],
              [CreditCard, 'Pagamentos flexíveis', 'Métodos modernos e seguros'],
              [Star, 'Curadoria premium', 'Produtos escolhidos com detalhe'],
            ].map(([Icon, title, subtitle]: any) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `rgba(${rgbAccent}, .22)`, color: colors.accent }}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-black">{title}</p>
                  <p className="text-xs font-medium text-white/45">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {sections.filter((section: any) => section.type !== 'hero' && section.type !== 'products').map(renderDynamicSection)}

        <section id="sobre" className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: colors.accent }}>Experiência de marca</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">Uma loja pensada para parecer uma marca real.</h2>
          </div>
          <div className="grid gap-4 lg:col-span-7 md:grid-cols-3">
            {[
              ['01', 'Visual premium', 'Layout moderno, espaçamento elegante e foco na apresentação dos produtos.'],
              ['02', 'Compra simples', 'Botões claros, produto em destaque e carrinho sempre acessível.'],
              ['03', 'Confiança', 'Secções de segurança, curadoria e experiência profissional.'],
            ].map(([number, title, text]) => (
              <div key={title} className="rounded-[32px] border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
                <p className="text-sm font-black" style={{ color: colors.accent }}>{number}</p>
                <h3 className="mt-8 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="produtos" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: colors.accent }}>Coleção</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{productSection?.content?.title || 'Produtos em destaque'}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">Explora uma seleção apresentada com detalhe, clareza e foco numa experiência de compra profissional.</p>
            </div>

            {categories.length > 1 && (
              <div className="flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1">
                {categories.map((category) => (
                  <button key={category} onClick={() => setSelectedCategory(category)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black transition-all ${selectedCategory === category ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500 hover:text-slate-950'}`}>
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-[40px] border-2 border-dashed border-black/5 bg-white/60 py-32 text-center">
              <p className="text-lg font-black text-slate-300">Ainda não existem produtos nesta categoria.</p>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} store={store} formatPrice={formatPrice} addItem={addItem} isInComparison={isInComparison} addProduct={addProduct} removeProduct={removeProduct} colors={colors} />
              ))}
            </div>
          )}
        </section>

        {bannerPromos.length > 0 && (
          <div className="mx-auto max-w-7xl space-y-6 px-6 py-12">
            {bannerPromos.map((promo: any) => (
              <a key={promo.id} href={promo.link_type === 'url' ? promo.link_value : promo.link_type !== 'none' ? `/s/${store.domain}/product/${promo.link_value}` : '#'} className="group relative block h-64 overflow-hidden rounded-[40px]" onClick={() => console.log('Promo click tracking temporarily disabled')}>
                {promo.image_url ? <Image src={promo.image_url} alt={promo.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.accent}, #0f172a)` }} />}
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-8 text-center">
                  <div><h3 className="mb-2 text-3xl font-black text-white">{promo.title}</h3>{promo.subtitle && <p className="font-semibold text-white/80">{promo.subtitle}</p>}</div>
                </div>
              </a>
            ))}
          </div>
        )}

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[48px] bg-slate-950 p-10 text-white shadow-2xl md:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.25em]" style={{ color: colors.accent }}>Pronto para comprar?</p>
                <h2 className="text-4xl font-black tracking-tight md:text-6xl">Descobre a coleção completa de {store.name}.</h2>
                <p className="mt-5 max-w-2xl font-medium leading-relaxed text-white/55">Uma experiência de compra rápida, visual e segura, criada para destacar cada produto com impacto profissional.</p>
              </div>
              <div className="lg:col-span-4 lg:text-right">
                <button onClick={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-black text-white shadow-2xl transition-all hover:scale-105" style={{ backgroundColor: colors.accent }}>
                  Ver produtos
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white/70 px-6 py-10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xl font-black text-slate-950">{store.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{store.description || 'Loja online criada com ShopForge.'}</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Pagamento seguro</span>
            <span>·</span>
            <span>ShopForge</span>
          </div>
        </div>
      </footer>

      {comparisonIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex -space-x-3">
              {comparedProducts.map((product) => (
                <div key={product.id} className="group relative h-12 w-12 overflow-hidden rounded-xl border-2 border-black bg-gray-100">
                  {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-cover" />}
                  <button onClick={() => removeProduct(product.id)} className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"><X className="h-4 w-4 text-white" /></button>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - comparedProducts.length) }).map((_, index) => (
                <div key={index} className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-black bg-white/5 text-white/20"><Scale className="h-4 w-4" /></div>
              ))}
            </div>

            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <div className="text-white"><p className="text-xs font-black uppercase tracking-widest opacity-40">Comparação</p><p className="text-sm font-bold">{comparisonIds.length} produtos selecionados</p></div>
              <Link href={`/s/${store.domain}/compare`} className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gray-200">Comparar <ArrowRight className="h-4 w-4" /></Link>
              <button onClick={clearComparison} className="p-2 text-white/40 transition-colors hover:text-white"><X className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
