'use client';

import { supabase } from '@/lib/supabase';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';
import { useState, useEffect } from 'react';
import { Check, Loader2, CheckCircle2 } from 'lucide-react';

export default function ProductPage() {
  const params = useParams() as { domain: string, productId: string };
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  
  const { addItem } = useCart();
  
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      if (!params.domain || !params.productId || !supabase) return;

      try {
        const { data: storeData, error: storeError } = await supabase          .from('stores')
          .select('*')
          .eq('domain', params.domain)
          .single();
        
        if (storeError) throw storeError;
        setStore(storeData);

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.productId)
          .eq('store_id', storeData.id)
          .single();
        
        if (productError) {
           console.error('Product not found or error:', productError);
           setProduct(null);
        } else {
           setProduct(productData);
           setActiveImage(productData.image_url);
           
           if (productData.has_variants) {
             const { data: variantsData } = await supabase
               .from('product_variants')
               .select('*')
               .eq('product_id', params.productId)
               .eq('is_active', true);
             
             if (variantsData && variantsData.length > 0) {
               setVariants(variantsData);
               setSelectedVariant(variantsData[0]);
               setSelectedAttributes(variantsData[0].attributes || {});
               if (variantsData[0].image_url) {
                 setActiveImage(variantsData[0].image_url);
               }
             }
           }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.domain, params.productId]);

  const handleAttributeChange = (attrName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attrName]: value };
    setSelectedAttributes(newAttributes);
    
    const matchedVariant = variants.find(v => {
      const attrs = v.attributes || {};
      return Object.keys(newAttributes).every(key => attrs[key] === newAttributes[key]);
    });
    
    if (matchedVariant) {
      setSelectedVariant(matchedVariant);
      if (matchedVariant.image_url) {
        setActiveImage(matchedVariant.image_url);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product.id, selectedVariant?.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const currentSku = selectedVariant?.sku ?? product?.sku;
  const displayImage = activeImage || product?.image_url;

  const allImages = [displayImage, ...(Array.isArray(product?.images) ? product.images : [])].filter(Boolean);

  const attributeOptions = Object.keys(selectedAttributes).length > 0 
    ? selectedAttributes 
    : (variants.length > 0 ? variants[0].attributes : {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!store || !product) return notFound();

  const hasActiveStock = currentStock > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
             {displayImage && (
               <Image 
                 src={displayImage} 
                 alt={product.name} 
                 fill 
                 className="object-cover"
                 referrerPolicy="no-referrer"
                 priority
               />
             )}
          </div>
          
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {allImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${displayImage === img ? 'border-shopify-green ring-2 ring-shopify-green/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {product.video_url && (
            <div className="mt-8 rounded-2xl overflow-hidden shadow-sm aspect-video bg-black">
              <iframe 
                src={product.video_url.replace('watch?v=', 'embed/')} 
                className="w-full h-full" 
                allowFullScreen 
              />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <p className="opacity-60 uppercase text-xs font-bold tracking-wider">{product.category}</p>
            {product.brand && (
              <>
                <span className="w-1 h-1 rounded-full bg-current opacity-20"></span>
                <p className="opacity-60 uppercase text-xs font-bold tracking-wider">{product.brand}</p>
              </>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <p className="text-2xl font-bold">€ {Number(currentPrice).toFixed(2)}</p>
            {product.compare_at_price && (
              <p className="text-xl opacity-40 line-through">€ {Number(product.compare_at_price).toFixed(2)}</p>
            )}
          </div>

          {variants.length > 0 && Object.keys(attributeOptions).length > 0 && (
            <div className="space-y-4 mb-8">
              {Object.entries(attributeOptions).map(([attrName, attrValue]) => (
                <div key={attrName}>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">
                    {attrName}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants
                      .filter(v => v.attributes?.[attrName])
                      .map(v => v.attributes?.[attrName])
                      .filter((val, idx, arr) => arr.indexOf(val) === idx)
                      .map(value => (
                        <button
                          key={value}
                          onClick={() => handleAttributeChange(attrName, value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedAttributes[attrName] === value
                              ? 'text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={selectedAttributes[attrName] === value ? { backgroundColor: store.primary_color } : {}}
                        >
                          {value}
                        </button>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="prose prose-sm opacity-80 mb-10">
            {product.short_description && (
              <p className="text-lg font-medium mb-4">{product.short_description}</p>
            )}
            <p className="whitespace-pre-wrap">{product.description}</p>
          </div>

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {product.tags.map((tag: string, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs opacity-70">#{tag}</span>
              ))}
            </div>
          )}

          <div className="border-t pt-8" style={{ borderColor: store.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <button
              onClick={handleAddToCart}
              disabled={!hasActiveStock}
              className={`w-full py-4 px-8 rounded-full font-bold text-white transition-all flex justify-center items-center gap-2 ${
                !hasActiveStock ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'hover:opacity-90 active:scale-95'
              }`}
              style={hasActiveStock ? { backgroundColor: store.primary_color } : {}}
            >
              {added ? <><Check className="w-5 h-5"/> Adicionado</> : hasActiveStock ? 'Adicionar ao Carrinho' : 'Esgotado'}
            </button>
            <p className="text-center mt-4 opacity-60 text-sm flex items-center justify-center gap-2">
              {hasActiveStock ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> {currentStock} unidades em stock</> : 'Sem stock disponível'}
            </p>
          </div>

          {currentSku && (
            <p className="mt-8 text-[10px] opacity-40 uppercase tracking-widest text-center">SKU: {currentSku}</p>
          )}
        </div>
      </div>
    </div>
  );
}
