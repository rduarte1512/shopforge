'use client';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { useComparisonStore } from '@/lib/comparison-store';
import { Scale, X, ArrowRight, Check, Phone, ExternalLink, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StorefrontHomePage() {
  const params = useParams() as { domain: string };
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addItem } = useCart();
  const { formatPrice, currency, setCurrency, availableCurrencies } = useCurrency();
  const { productIds: comparisonIds, addProduct, removeProduct, isInComparison, clearComparison } = useComparisonStore();
  const fetchedRef = useRef(false);
  
  useEffect(() => {
    async function fetchData() {
      if (!params.domain || !isSupabaseConfigured || fetchedRef.current) {
        return;
      }
      
      // Try to get from cache first for preview stability
      const cacheKey = `store_data_${params.domain}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { store: s, products: p, promotions: pr } = JSON.parse(cached);
          setStore(s);
          setProducts(p);
          setPromotions(pr);
          setLoading(false);
          fetchedRef.current = true;
          return;
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        fetchedRef.current = true;
        const { data: storeData, error: storeError } = await supabase!
          .from('stores')
          .select('*')
          .eq('domain', params.domain)
          .single();
        
        if (storeError || !storeData) {
          setLoading(false);
          return;
        }

        setStore(storeData);

        // Parallel fetch with limit to avoid DB stress
        const [productsRes, promosRes] = await Promise.all([
          supabase!.from('products').select('*').eq('store_id', storeData.id).eq('is_active', true).limit(12),
          supabase!.from('promotions').select('*').eq('store_id', storeData.id).eq('active', true).limit(5)
        ]);

        const pData = productsRes.data || [];
        const prData = promosRes.data || [];

        setProducts(pData);
        setPromotions(prData);

        // Save to cache
        sessionStorage.setItem(cacheKey, JSON.stringify({ 
          store: storeData, 
          products: pData, 
          promotions: prData 
        }));

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Slight delay to prevent rapid fire
    const timer = setTimeout(fetchData, 100);
    return () => clearTimeout(timer);
  }, [params.domain]); // Only depend on the domain change

  if (!store && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
        <p className="text-gray-500 max-w-md mb-8">
          Não conseguimos encontrar a loja que procura. Verifique o endereço ou contacte o proprietário.
        </p>
        <Link 
          href="/"
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          Voltar ao ShopForge
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!store) return null;

  const storeProducts = products;
  const comparedProducts = products.filter(p => comparisonIds.includes(p.id));

  const customization = store.customization || {};
  const colors = customization.colors || { 
    background: '#ffffff', 
    text: '#000000', 
    accent: store.primary_color || '#008060', 
    muted: '#9ca3af', 
    primary: store.primary_color || '#008060' 
  };
  const fonts = customization.fonts || { heading: 'Inter', body: 'Inter' };
  const header = customization.header || { sticky: true, logoPosition: 'left', height: 70 };
  const sections = customization.sections || [
    { id: 'hero-1', type: 'hero', content: { title: store.name, subtitle: store.description, buttonText: 'Ver Coleção' }, styles: { height: 400, textAlign: 'center' } },
    { id: 'products-1', type: 'products', content: { title: 'Produtos em Destaque' }, styles: { columns: 4 } }
  ];

  const handleButtonAction = (action: string, url: string) => {
    if (action === 'link') {
      window.open(url, '_blank');
    } else if (action === 'whatsapp') {
      const cleanPhone = (store.phone || '').replace(/\s+/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else if (action === 'checkout') {
      window.location.href = `/s/${store.domain}/cart`;
    }
  };

  const handlePromoClick = async (promoId: string) => {
    try {
      await supabase!.rpc('increment_promo_clicks', { promo_id: promoId });
    } catch (err) {
      console.log('Click tracking not available');
    }
  };

  const bannerPromos = promotions.filter(p => p.position === 'banner');

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: colors.background, color: colors.text, fontFamily: fonts.body }}>
      {/* Header */}
      <header className={`${header.sticky ? 'fixed top-0' : 'relative'} left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 transition-all`} style={{ height: `${header.height}px`, display: 'flex', alignItems: 'center' }}>
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className={`flex items-center gap-8 ${header.logoPosition === 'center' ? 'flex-1 justify-center' : ''}`}>
            <Link href={`/s/${store.domain}`} className="text-xl font-bold tracking-tight">
              {store.name}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="text-xs font-bold bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-black/5"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Link href={`/dashboard`} className="text-xs font-medium text-gray-500 hover:text-black">
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic Sections */}
      <main className={`${header.sticky ? 'pt-[70px]' : ''}`}>
        {sections.map((section: any) => {
          if (section.type === 'hero') {
            const activePromo = promotions.length > 0 ? promotions[0] : null;
            return (
              <section 
                key={section.id}
                className="py-24 px-6 flex flex-col justify-center transition-all relative overflow-hidden" 
                style={{ 
                  minHeight: `${section.styles?.height || 400}px`,
                  backgroundColor: activePromo ? '#000000' : `${colors.accent}08`,
                  textAlign: (section.styles?.textAlign as any) || 'center'
                }}
              >
                {activePromo && activePromo.image_url && (
                  <div className="absolute inset-0">
                    <Image 
                      src={activePromo.image_url} 
                      alt={activePromo.title}
                      fill
                      className="object-cover opacity-40"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </div>
                )}
                <div className="max-w-7xl mx-auto w-full relative z-10">
                  {activePromo ? (
                    <>
                      <p className="text-sm font-bold text-white/60 tracking-widest mb-4 uppercase">Promoção</p>
                      <h1 className="text-6xl font-black mb-6 tracking-tight text-white">{activePromo.title}</h1>
                      {activePromo.subtitle && (
                        <p className="text-xl opacity-80 font-medium mb-10 max-w-2xl text-white/90" style={{ marginInline: section.styles?.textAlign === 'center' ? 'auto' : '0' }}>{activePromo.subtitle}</p>
                      )}
                      {activePromo.description && (
                        <p className="text-lg opacity-70 mb-8 max-w-xl text-white/70">{activePromo.description}</p>
                      )}
                      {activePromo.link_type !== 'none' && activePromo.link_value && (
                        <a 
                          href={activePromo.link_type === 'url' ? activePromo.link_value : `/s/${store.domain}/product/${activePromo.link_value}`}
                          className="inline-block px-10 py-4 rounded-2xl font-black text-lg text-black bg-white transition-all shadow-2xl hover:scale-105 active:scale-95"
                        >
                          Ver Oferta
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <h1 className="text-6xl font-black mb-6 tracking-tight" style={{ color: colors.accent }}>{section.content?.title}</h1>
                      <p className="text-xl opacity-60 font-medium mb-10 max-w-2xl mx-auto" style={{ marginInline: section.styles?.textAlign === 'center' ? 'auto' : '0' }}>{section.content?.subtitle}</p>
                      {section.content?.buttonText && (
                        <button 
                          className="px-10 py-4 rounded-2xl font-black text-lg text-white transition-all shadow-2xl hover:scale-105 active:scale-95" 
                          style={{ backgroundColor: colors.accent }}
                        >
                          {section.content.buttonText}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </section>
            );
          }

          if (section.type === 'products') {
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 py-24">
                 <div className="flex justify-between items-end mb-12">
                   <div>
                     <h2 className="text-3xl font-bold tracking-tight">{section.content?.title || 'Produtos'}</h2>
                   </div>
                 </div>

                 {storeProducts.length === 0 ? (
                   <div className="text-center py-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                     <p className="text-lg font-medium opacity-40">Ainda não existem produtos nesta loja.</p>
                   </div>
                 ) : (
                   <div 
                     className="grid gap-10"
                     style={{ 
                       gridTemplateColumns: `repeat(${section.styles?.columns || 4}, minmax(0, 1fr))` 
                     }}
                   >
                      {storeProducts.map(product => (
                        <div key={product.id} className="group relative">
                          <div className={`relative rounded-2xl overflow-hidden mb-6 bg-gray-100 shadow-sm transition-all aspect-[4/5]`}>
                             <Link href={`/s/${store.domain}/product/${product.id}`} className="block h-full w-full">
                               {product.image_url && (
                                 <Image 
                                   src={product.image_url} 
                                   alt={product.name} 
                                   fill 
                                   className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                   referrerPolicy="no-referrer"
                                 />
                               )}
                             </Link>
                             
                             <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                               <button 
                                 onClick={() => isInComparison(product.id) ? removeProduct(product.id) : addProduct(product.id)}
                                 className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${isInComparison(product.id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                               >
                                 {isInComparison(product.id) ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                               </button>
                             </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-bold text-lg leading-tight hover:underline cursor-pointer">
                                <Link href={`/s/${store.domain}/product/${product.id}`}>
                                  {product.name}
                                </Link>
                              </h3>
                              <p className="font-black text-lg">{formatPrice(product.price)}</p>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">{product.category}</p>
                          </div>
                          
                          <button 
                            onClick={() => addItem(product.id)}
                            className="w-full mt-6 py-3 bg-black text-white text-sm font-bold rounded-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-800 shadow-xl shadow-black/10"
                          >
                            Adicionar ao Carrinho
                          </button>
                        </div>
                      ))}
                   </div>
                 )}
              </section>
            );
          }

          if (section.type === 'text') {
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 py-16" style={{ textAlign: (section.styles?.textAlign as any) || 'left' }}>
                <div className="max-w-3xl mx-auto">
                  <p className="text-xl leading-relaxed whitespace-pre-wrap opacity-80">{section.content?.text}</p>
                </div>
              </section>
            );
          }

          if (section.type === 'button') {
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 py-8" style={{ textAlign: (section.styles?.textAlign as any) || 'center' }}>
                <button 
                  onClick={() => handleButtonAction(section.content?.action, section.content?.url)}
                  className="px-10 py-5 rounded-2xl font-black text-lg text-white transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3 inline-flex" 
                  style={{ backgroundColor: colors.accent }}
                >
                  {section.content?.text}
                  {section.content?.action === 'whatsapp' && <Phone className="w-5 h-5" />}
                  {section.content?.action === 'link' && <ExternalLink className="w-5 h-5" />}
                  {section.content?.action === 'checkout' && <ShoppingCart className="w-5 h-5" />}
                </button>
              </section>
            );
          }

          if (section.type === 'image') {
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 py-12">
                <div className="rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 group">
                  <img src={section.content?.url} alt={section.content?.alt} className="w-full h-auto group-hover:scale-105 transition-transform duration-1000" />
                </div>
              </section>
            );
          }

          if (section.type === 'spacer') {
            return <div key={section.id} style={{ height: `${section.styles?.height || 40}px` }} />;
          }

          return null;
        })}

        {bannerPromos.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 py-12 space-y-6">
            {bannerPromos.map((promo: any) => (
              <a 
                key={promo.id}
                href={promo.link_type === 'url' ? promo.link_value : promo.link_type !== 'none' ? `/s/${store.domain}/product/${promo.link_value}` : '#'}
                className="block relative rounded-2xl overflow-hidden h-48 group"
                onClick={() => handlePromoClick(promo.id)}
              >
                {promo.image_url ? (
                  <Image 
                    src={promo.image_url} 
                    alt={promo.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-white mb-2">{promo.title}</h3>
                    {promo.subtitle && <p className="text-white/80 font-medium">{promo.subtitle}</p>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Comparison Bar */}
      {comparisonIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-6 shadow-2xl border border-white/10">
            <div className="flex -space-x-3">
              {comparedProducts.map(p => (
                <div key={p.id} className="w-12 h-12 rounded-xl border-2 border-black bg-gray-100 overflow-hidden relative group">
                  {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" />}
                  <button 
                    onClick={() => removeProduct(p.id)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {Array.from({ length: 4 - comparedProducts.length }).map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-xl border-2 border-black bg-white/5 border-dashed flex items-center justify-center text-white/20">
                  <Scale className="w-4 h-4" />
                </div>
              ))}
            </div>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div className="flex items-center gap-4">
              <div className="text-white">
                <p className="text-xs font-black uppercase tracking-widest opacity-40">Comparação</p>
                <p className="text-sm font-bold">{comparisonIds.length} produtos selecionados</p>
              </div>
              <Link 
                href={`/s/${store.domain}/compare`}
                className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                Comparar <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={clearComparison}
                className="text-white/40 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

