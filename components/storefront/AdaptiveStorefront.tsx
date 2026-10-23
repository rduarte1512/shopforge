'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, CreditCard, Headphones, Menu, PackageCheck, Scale, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, X } from 'lucide-react';
import { getProductSmartImage } from '@/lib/smart-images';

type Props = {
  store: any;
  customization: any;
  products: any[];
  promotions?: any[];
  formatPrice: (price: number) => string;
  currency: string;
  setCurrency: (currency: string) => void;
  availableCurrencies: string[];
  addItem: (id: string) => void;
  comparisonIds: string[];
  isInComparison: (id: string) => boolean;
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  clearComparison: () => void;
};

const imageOf = (product: any) => product?.image_url || getProductSmartImage(product);
function contrastOn(hex: string) {
  if (!/^#[a-f\d]{6}$/i.test(hex || '')) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (r * .299 + g * .587 + b * .114) > 155 ? '#171717' : '#ffffff';
}
function productId(product: any) { return String(product.id); }
const safeAlign = (value: unknown): 'left' | 'center' | 'right' => value === 'center' || value === 'right' ? value : 'left';

export default function AdaptiveStorefront({
  store, customization, products, promotions = [], formatPrice, currency, setCurrency,
  availableCurrencies, addItem, comparisonIds, isInComparison, addProduct, removeProduct, clearComparison,
}: Props) {
  const [category, setCategory] = useState('Todos');
  const [menuOpen, setMenuOpen] = useState(false);
  const colors = customization.colors || {};
  const accent = colors.accent || store.primary_color || '#008060';
  const foreground = colors.text || '#152432';
  const muted = colors.muted || '#64748b';
  const background = colors.background || '#ffffff';
  const heading = customization.fonts?.heading || 'Inter';
  const dark = /^#[0-2][0-9a-f]{5}$/i.test(background);
  const surface = dark ? '#18243a' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,.14)' : 'rgba(15,23,42,.10)';
  const sections = Array.isArray(customization.sections) ? customization.sections : [];
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))).slice(0, 9), [products]);
  const primaryProduct = products[0];
  const primaryImage = primaryProduct ? imageOf(primaryProduct) : '';
  const brand = String(store.name || 'Loja online');
  const promo = promotions[0];
  const buttonStyle = { backgroundColor: accent, color: contrastOn(accent) };
  const navToProducts = () => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  const execute = (action?: string, url?: string) => {
    if (action === 'checkout') { window.location.href = '/s/' + store.domain + '/cart'; return; }
    if (action === 'link' && typeof url === 'string' && /^https?:\/\//i.test(url)) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
    if (action === 'whatsapp' && store.phone) { window.open('https://wa.me/' + String(store.phone).replace(/\D/g, ''), '_blank', 'noopener,noreferrer'); return; }
    navToProducts();
  };

  function Visual({ className = '' }: { className?: string }) {
    return (
      <div className={'relative isolate overflow-hidden ' + className} style={{ background: 'linear-gradient(145deg,' + accent + '22,' + (dark ? '#16253b' : '#f1f5f9') + ')' }}>
        {primaryImage ? (
          <Image src={primaryImage} alt={primaryProduct.name} fill className="object-cover transition-transform duration-700 hover:scale-105" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full min-h-52 items-center justify-center" style={{ color: accent }}>
            <ShoppingBag className="h-16 w-16 opacity-30" />
          </div>
        )}
        {primaryProduct && <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl bg-white/95 p-3 text-slate-900 shadow-lg backdrop-blur">
          <p className="truncate text-sm font-semibold">{primaryProduct.name}</p>
          <p className="text-sm font-black" style={{ color: accent }}>{formatPrice(primaryProduct.price)}</p>
        </div>}
      </div>
    );
  }

  function ProductTile({ product, index, variant }: { product: any; index: number; variant: string }) {
    const img = imageOf(product);
    const boxed = variant === 'cards';
    const compact = variant === 'compact';
    return (
      <article className={'group min-w-0 overflow-hidden transition-all duration-300 hover:-translate-y-1 ' + (boxed ? 'rounded-3xl border p-3 shadow-sm hover:shadow-xl' : compact ? 'rounded-lg border p-2' : variant === 'bordered' ? 'rounded-sm border p-3' : '')} style={{ borderColor: boxed || compact || variant === 'bordered' ? border : 'transparent', backgroundColor: boxed || compact ? surface : 'transparent' }}>
        <Link href={'/s/' + store.domain + '/product/' + product.id} className={'relative block overflow-hidden bg-slate-100 ' + (compact ? 'aspect-square rounded-lg' : variant === 'editorial' ? 'aspect-[3/4]' : 'aspect-[4/5] rounded-xl')}>
          {img ? <Image src={img} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" /> :
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400"><ShoppingBag className="h-9 w-9" /><span className="text-xs">Imagem por adicionar</span></span>}
        </Link>
        <div className="flex flex-col gap-2 px-1 py-4">
          {product.category && <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: muted }}>{product.category}</span>}
          <Link href={'/s/' + store.domain + '/product/' + product.id} className="line-clamp-2 text-base font-semibold hover:underline">{product.name}</Link>
          <div className="flex items-center justify-between gap-2">
            <strong className="text-lg" style={{ color: accent }}>{formatPrice(product.price)}</strong>
            <button aria-label={'Comparar ' + product.name} title="Comparar" onClick={() => isInComparison(productId(product)) ? removeProduct(productId(product)) : addProduct(productId(product))} className="rounded-full border p-2 transition-colors hover:opacity-70" style={{ borderColor: border }}>
              {isInComparison(productId(product)) ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={() => addItem(productId(product))} className="mt-1 flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition-transform hover:scale-[1.02]" style={buttonStyle}><ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho</button>
        </div>
      </article>
    );
  }

  function Section({ section }: { section: any }) {
    const type = section.type;
    const c = section.content || {};
    const s = section.styles || {};
    const variant = s.variant || (type === 'hero' ? customization.heroVariant : customization.productVariant);
    const align = safeAlign(s.textAlign);
    const baseWidth = 'mx-auto max-w-7xl px-5 sm:px-8';
    const headingStyle = { fontFamily: heading, color: foreground };

    if (type === 'hero') {
      const label = c.eyebrow || 'Descobre a nossa coleção';
      const title = c.title || brand, subtitle = c.subtitle || store.description || '';
      const tall = Math.max(400, Math.min(760, Number(s.height) || 550));
      const cta = <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={navToProducts} className="inline-flex items-center gap-2 rounded-lg px-7 py-4 text-sm font-bold shadow-lg transition-transform hover:scale-[1.03]" style={buttonStyle}>{c.buttonText || 'Explorar produtos'} <ArrowRight className="h-4 w-4" /></button>
        <Link href={'/s/' + store.domain + '/cart'} className="inline-flex items-center rounded-lg border px-6 py-4 text-sm font-semibold" style={{ borderColor: border }}>Ver carrinho</Link>
      </div>;
      const copy = <div className="relative z-10">
        <span className="text-xs font-bold uppercase tracking-[.22em]" style={{ color: accent }}>{label}</span>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl" style={headingStyle}>{title}</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: muted }}>{subtitle}</p>
        {cta}
      </div>;
      if (variant === 'full-bleed') return <section key={section.id} className="relative isolate flex items-center overflow-hidden py-24" style={{ minHeight: tall, background: 'linear-gradient(115deg,' + foreground + ', ' + accent + ')' }}>
        {primaryImage && <div className="absolute inset-0 opacity-25"><Image src={primaryImage} alt="" fill className="object-cover" /></div>}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
        <div className="relative mx-auto w-full max-w-5xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/75">{label}</span>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-7xl" style={{ fontFamily: heading }}>{title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-white/85">{subtitle}</p>
          <button onClick={navToProducts} className="mt-8 rounded-lg bg-white px-8 py-4 text-sm font-bold text-slate-950">{c.buttonText || 'Explorar coleção'} <ArrowRight className="ml-1 inline h-4 w-4" /></button>
        </div>
      </section>;
      if (variant === 'centered') return <section key={section.id} className="px-5 py-20 sm:py-28" style={{ minHeight: tall, background: 'radial-gradient(ellipse at top,' + accent + '1f,transparent 70%)' }}>
        <div className="mx-auto max-w-4xl text-center"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{label}</span><h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-7xl" style={headingStyle}>{title}</h1><p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: muted }}>{subtitle}</p><div className="mt-8 flex justify-center"><button onClick={navToProducts} className="rounded-lg px-8 py-4 text-sm font-bold" style={buttonStyle}>{c.buttonText || 'Explorar coleção'} <ArrowRight className="ml-1 inline h-4 w-4" /></button></div></div>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-3">{products.slice(0, 3).map((p: any) => <Link key={p.id} href={'/s/' + store.domain + '/product/' + p.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">{imageOf(p) && <Image src={imageOf(p)} alt={p.name} fill className="object-cover" />}</Link>)}</div>
      </section>;
      if (variant === 'product-led') return <section key={section.id} className={baseWidth + ' py-16 sm:py-24'} style={{ minHeight: tall }}>
        <div className="mx-auto max-w-3xl text-center"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{label}</span><h1 className="mt-5 text-4xl font-bold sm:text-6xl" style={headingStyle}>{title}</h1><p className="mx-auto mt-5 max-w-xl" style={{ color: muted }}>{subtitle}</p></div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">{products.slice(0, 3).map((p: any, i: number) => <ProductTile key={p.id} product={p} index={i} variant="compact" />)}</div>
        {products.length === 0 && <button onClick={navToProducts} className="mx-auto mt-8 block rounded-lg px-8 py-3 font-semibold" style={buttonStyle}>{c.buttonText || 'Ver catálogo'}</button>}
      </section>;
      if (variant === 'editorial') return <section key={section.id} className="grid min-h-[500px] lg:grid-cols-2" style={{ minHeight: tall }}>
        <Visual className="min-h-80 lg:min-h-[580px]" />
        <div className="flex items-center px-8 py-16 sm:px-14 lg:px-20" style={{ backgroundColor: accent + '13' }}><div>{copy}</div></div>
      </section>;
      return <section key={section.id} className={baseWidth + ' py-14 sm:py-24'} style={{ minHeight: tall, background: variant === 'asymmetric' ? 'linear-gradient(125deg,' + accent + '18,transparent 60%)' : 'transparent' }}>
        <div className={'grid items-center gap-12 lg:grid-cols-12 ' + (variant === 'asymmetric' ? 'lg:gap-20' : '')}>
          <div className={'lg:col-span-6 ' + (variant === 'asymmetric' ? 'lg:order-2' : '')}>{copy}</div>
          <Visual className={'lg:col-span-6 min-h-[390px] sm:min-h-[490px] ' + (variant === 'asymmetric' ? 'lg:order-1 rounded-[50%_50%_12px_12px]' : 'rounded-2xl')} />
        </div>
      </section>;
    }

    if (type === 'trust') {
      const entries = Array.isArray(c.items) ? c.items.slice(0, 4) : ['Compra simples', 'Apoio ao cliente', 'Acompanhamento do pedido'];
      const icons = [ShieldCheck, Headphones, PackageCheck, CreditCard];
      return <section key={section.id} className="border-y py-6" style={{ borderColor: border, backgroundColor: surface }}>
        <div className={baseWidth + ' grid gap-6 sm:grid-cols-3'}>{entries.map((entry: any, i: number) => {const Icon = icons[i % icons.length];return <div key={i} className="flex items-center gap-3"><Icon className="h-6 w-6 shrink-0" style={{ color: accent }} /><span className="text-sm font-semibold">{typeof entry === 'string' ? entry : entry?.title || 'Vantagem da loja'}</span></div>})}</div>
      </section>;
    }

    if (type === 'categories') return <section key={section.id} className={baseWidth + ' py-16 sm:py-24'}>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Categorias</span>
      <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={headingStyle}>{c.title || 'Descobre as categorias'}</h2>
      <p className="mt-4" style={{ color: muted }}>{c.subtitle || ''}</p>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(categories.length ? categories : ['Explorar coleção']).map((entry: string, i: number) => <button key={entry} onClick={() => {setCategory(categories.length ? entry : 'Todos');navToProducts()}} className="group flex min-h-36 items-end justify-between rounded-xl border p-6 text-left transition-transform hover:-translate-y-1" style={{ background: accent + (i % 2 ? '12' : '1f'), borderColor: border }}><span className="text-xl font-semibold">{entry}</span><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ color: accent }} /></button>)}
      </div>
    </section>;

    if (type === 'products') {
      const options = ['Todos', ...categories];
      const filtered = (category === 'Todos' ? products : products.filter(p => p.category === category)).slice(0, Math.max(2, Math.min(12, Number(c.limit) || 8)));
      const cardVariant = ['cards', 'editorial', 'compact', 'bordered'].includes(variant) ? variant : 'cards';
      const cols = Math.max(2, Math.min(4, Number(s.columns) || 4));
      const grid = cols === 2 ? 'lg:grid-cols-2' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
      return <section key={section.id} id="produtos" className={baseWidth + ' py-16 sm:py-24'}>
        <div className="flex flex-wrap items-end justify-between gap-6"><div><span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Selecionados para ti</span><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl" style={headingStyle}>{c.title || 'A nossa coleção'}</h2><p className="mt-3 max-w-2xl text-sm" style={{ color: muted }}>{c.subtitle || ''}</p></div>
        {options.length > 1 && <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{options.map(opt => <button key={opt} onClick={() => setCategory(opt)} className="whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: border, backgroundColor: category === opt ? accent : 'transparent', color: category === opt ? contrastOn(accent) : foreground }}>{opt}</button>)}</div>}</div>
        {filtered.length ? <div className={'mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 ' + grid}>{filtered.map((p: any, i: number) => <ProductTile key={p.id} product={p} index={i} variant={cardVariant} />)}</div> :
        <div className="mt-8 rounded-xl border border-dashed p-12 text-center" style={{ borderColor: border }}><ShoppingBag className="mx-auto mb-3 h-8 w-8 opacity-40" /><p className="text-sm" style={{ color: muted }}>Ainda não existem produtos nesta categoria.</p></div>}
      </section>;
    }

    if (type === 'story' || type === 'text') return <section key={section.id} id="sobre" className={baseWidth + ' py-14 sm:py-24'}>
      <div className={'grid items-center gap-10 ' + (type === 'story' ? 'lg:grid-cols-2' : '')}>
        <div className="max-w-3xl"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{c.eyebrow || 'A nossa marca'}</span><h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl" style={headingStyle}>{c.title || (type === 'story' ? 'Sobre nós' : '')}</h2><p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed" style={{ color: muted }}>{c.text || store.description || ''}</p>{type === 'story' && <button onClick={navToProducts} className="mt-7 inline-flex items-center gap-2 border-b-2 pb-2 text-sm font-bold" style={{ borderColor: accent }}>{c.buttonText || 'Explorar coleção'} <ArrowRight className="h-4 w-4" /></button>}</div>
        {type === 'story' && <div className="rounded-2xl p-10 sm:p-14" style={{ backgroundColor: accent + '16' }}><Sparkles className="mb-10 h-11 w-11" style={{ color: accent }} /><p className="text-2xl font-semibold leading-relaxed sm:text-3xl" style={{ fontFamily: heading }}>{store.description || 'Uma seleção pensada ao detalhe.'}</p></div>}
      </div>
    </section>;

    if (type === 'image') return c.url ? <section key={section.id} className={baseWidth + ' py-8'}><div className="relative min-h-72 overflow-hidden rounded-2xl sm:min-h-[480px]"><Image src={c.url} alt={c.alt || brand} fill className="object-cover" unoptimized referrerPolicy="no-referrer" /></div></section> : null;

    if (type === 'reviews') {
      const items = Array.isArray(c.items) ? c.items.slice(0, 4) : [];
      return <section key={section.id} className={baseWidth + ' py-16 sm:py-20'}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>O nosso compromisso</span><h2 className="mt-4 text-3xl font-semibold sm:text-4xl" style={headingStyle}>{c.title || 'Uma experiência feita para ti'}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">{items.map((item: any, i: number) => <div key={i} className="rounded-2xl border p-6" style={{ borderColor: border, backgroundColor: surface }}><Star className="mb-5 h-6 w-6" style={{ color: accent }} /><p className="text-lg font-semibold">{typeof item === 'string' ? item : item.title || 'Uma experiência cuidada'}</p></div>)}</div>
      </section>;
    }

    if (type === 'faq') return <section key={section.id} className={baseWidth + ' py-16 sm:py-20'}>
      <h2 className="mb-8 text-3xl font-semibold sm:text-4xl" style={headingStyle}>{c.title || 'Perguntas frequentes'}</h2>
      <div className="mx-auto max-w-3xl">{(Array.isArray(c.items) ? c.items : []).slice(0, 6).map((item: any, i: number) => <details key={i} className="group border-b py-5" style={{ borderColor: border }}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{item.question || 'Pergunta frequente'}<ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" /></summary><p className="mt-4 text-sm leading-relaxed" style={{ color: muted }}>{item.answer || ''}</p></details>)}</div>
    </section>;

    if (type === 'newsletter' || type === 'button') return <section key={section.id} className={baseWidth + ' py-12 sm:py-20'}>
      <div className="rounded-2xl px-7 py-12 text-center sm:px-16 sm:py-20" style={{ background: 'linear-gradient(135deg,' + accent + '27,' + accent + '09)', border: '1px solid ' + border }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{c.eyebrow || 'Explora a nossa loja'}</p><h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl" style={headingStyle}>{c.title || (type === 'newsletter' ? 'Descobre as novidades' : 'A coleção espera por ti')}</h2>
        {c.text && <p className="mx-auto mt-5 max-w-xl" style={{ color: muted }}>{c.text}</p>}
        <button onClick={() => execute(c.action, c.url)} className="mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-4 text-sm font-bold" style={buttonStyle}>{c.buttonText || c.text || 'Ver coleção'} <ArrowRight className="h-4 w-4" /></button>
      </div>
    </section>;

    if (type === 'spacer') return <div key={section.id} style={{ height: Math.max(12, Math.min(120, Number(s.height) || 40)) }} />;
    return null;
  }

  return <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: background, color: foreground, fontFamily: customization.fonts?.body || 'Inter' }}>
    <div className="px-4 py-2 text-center text-[11px] font-semibold tracking-wider" style={{ backgroundColor: accent, color: contrastOn(accent) }}>{customization.announcementText || 'Descobre a nossa coleção'}</div>
    <header className={customization.header?.sticky ? 'sticky top-0 z-40 border-b backdrop-blur-xl' : 'relative z-40 border-b'} style={{ borderColor: border, backgroundColor: dark ? 'rgba(10,18,36,.94)' : 'rgba(255,255,255,.95)' }}>
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link href={'/s/' + store.domain} className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight" style={{ fontFamily: heading }}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={buttonStyle}><ShoppingBag className="h-5 w-5" /></span><span className="truncate">{brand}</span></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex"><button onClick={navToProducts}>Coleção</button><button onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}>Sobre</button><Link href={'/s/' + store.domain + '/cart'}>Carrinho</Link></nav>
        <div className="flex items-center gap-3"><select aria-label="Moeda" value={currency} onChange={event => setCurrency(event.target.value)} className="max-w-[86px] rounded-lg border bg-transparent px-2 py-2 text-xs font-semibold" style={{ borderColor: border }}>{availableCurrencies.map(item => <option key={item} value={item} className="text-slate-900">{item}</option>)}</select><Link aria-label="Carrinho" href={'/s/' + store.domain + '/cart'} className="relative rounded-lg p-2"><ShoppingCart className="h-6 w-6" /></Link><button className="rounded-lg p-2 md:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button></div>
      </div>
      {menuOpen && <div className="flex flex-col gap-3 border-t px-6 py-5 md:hidden" style={{ borderColor: border }}><button className="text-left" onClick={() => {setMenuOpen(false);navToProducts()}}>Coleção</button><button className="text-left" onClick={() => {setMenuOpen(false);document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}}>Sobre</button><Link href={'/s/' + store.domain + '/cart'}>Carrinho</Link></div>}
    </header>

    <main>{sections.map((section: any, i: number) => <Section key={section.id || i} section={section} />)}</main>

    <footer className="border-t px-6 py-12" style={{ borderColor: border, backgroundColor: surface }}><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row"><div><p className="text-xl font-bold" style={{ fontFamily: heading }}>{brand}</p><p className="mt-2 max-w-md text-sm" style={{ color: muted }}>{store.description || 'Loja online'}</p></div><div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: muted }}><Link href={'/s/' + store.domain + '/cart'}>Carrinho</Link><span>Loja criada com ShopForge</span></div></div></footer>

    {comparisonIds.length > 0 && <div className="fixed bottom-4 left-1/2 z-50 flex w-[min(95%,420px)] -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-slate-950 p-4 text-white shadow-2xl"><span className="text-sm font-semibold">{comparisonIds.length} para comparar</span><Link href={'/s/' + store.domain + '/compare'} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900">Comparar</Link><button aria-label="Limpar comparação" onClick={clearComparison}><X className="h-5 w-5" /></button></div>}
  </div>;
}
