'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useComparisonStore } from '@/lib/comparison-store';
import { useCurrency } from '@/hooks/useCurrency';
import { ArrowLeft, ShoppingCart, Trash2, Scale, Loader2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { useState, useEffect } from 'react';

export default function ComparePage() {
  const params = useParams() as { domain: string };
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { productIds, removeProduct, clearComparison } = useComparisonStore();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchData() {
      if (!params.domain || !supabase) return;

      try {
        const { data: storeData, error: storeError } = await supabase          .from('stores')
          .select('*')
          .eq('domain', params.domain)
          .single();
        
        if (storeError) throw storeError;
        setStore(storeData);

        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);
          
          if (productsError) throw productsError;
          setProducts(productsData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.domain, productIds]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!store) return null;

  const comparedProducts = products;

  if (comparedProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
          <Scale className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sem produtos para comparar</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Adiciona produtos à tua lista de comparação para os veres lado a lado.</p>
        <Link 
          href={`/s/${store.domain}`}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          Voltar à Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <header className="bg-white border-b border-gray-100 px-6 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 font-bold text-sm hover:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight">Comparar Produtos</h1>
          <button 
            onClick={clearComparison}
            className="text-xs font-bold text-red-500 hover:underline"
          >
            Limpar Tudo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-8 text-left bg-gray-50/50 w-64 border-r border-gray-100">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Características</p>
                  </th>
                  {comparedProducts.map(product => (
                    <th key={product.id} className="p-8 min-w-[300px] align-top relative group">
                      <button 
                        onClick={() => removeProduct(product.id)}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-6 bg-gray-100 relative shadow-sm">
                        {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-cover" />}
                      </div>
                      
                      <h3 className="text-lg font-bold leading-tight mb-2">{product.name}</h3>
                      <p className="text-2xl font-black mb-6">{formatPrice(Number(product.price))}</p>
                      
                      <button 
                        onClick={() => addItem(product.id)}
                        disabled={product.stock === 0}
                        className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                      >
                        <ShoppingCart className="w-4 h-4" /> Comprar
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-8 font-bold text-sm bg-gray-50/50 border-r border-gray-100">Categoria</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-8 text-sm text-gray-600 font-medium">{p.category}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-8 font-bold text-sm bg-gray-50/50 border-r border-gray-100">Disponibilidade</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-8">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock > 0 ? `${p.stock} em stock` : 'Esgotado'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-8 font-bold text-sm bg-gray-50/50 border-r border-gray-100">Descrição</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-8 text-sm text-gray-500 leading-relaxed min-w-[300px]">{p.description}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
