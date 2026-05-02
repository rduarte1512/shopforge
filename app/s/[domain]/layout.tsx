'use client';

import { supabase } from '@/lib/supabase';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useState, ReactNode, useEffect } from 'react';
import { CartProvider, useCart } from '@/components/CartProvider';

function StoreLayoutInner({ children, store }: { children: ReactNode, store: any }) {
  const { cartCount } = useCart();
  const isDark = store.theme === 'dark';
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref);
      sessionStorage.setItem('affiliate_ref', ref);
      fetch('/api/affiliates/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref, storeId: store.id }),
      }).catch(console.error);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } else {
      const stored = sessionStorage.getItem('affiliate_ref');
      if (stored) setRefCode(stored);
    }
  }, [store.id]);

  return (
      <div 
        className={`min-h-screen flex flex-col ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}
        style={isDark ? { '--primary': store.primary_color, color: 'white' } as any : { '--primary': store.primary_color } as any}
      >
        <header className="border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href={`/s/${store.domain}`} className="text-2xl font-bold tracking-tight">
              {store.name}
            </Link>
            <div className="flex items-center gap-6">
              <Link href={`/s/${store.domain}/cart`} className="relative p-2">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span 
                    className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: store.primary_color }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
        
        <main className="flex-1">
          {children}
        </main>

        <footer className="py-12 text-center" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
          <p className="opacity-60 text-sm">© {new Date().getFullYear()} {store.name}. Powered by ShopForge.</p>
        </footer>
      </div>
  );
}

export default function StoreLayout({ children }: { children: ReactNode }) {
  const params = useParams() as { domain: string };
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStore() {
      if (!params.domain) return;
      
      try {
        console.log('Tentando procurar loja com domínio:', params.domain);
        
        if (!supabase) {
          console.error('Supabase client is NULL. Verifica as variáveis de ambiente.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('domain', params.domain)
          .single();
        
        if (error) {
          console.error('Erro detalhado do Supabase:', JSON.stringify(error, null, 2));
          console.error('Mensagem de erro:', error.message);
          setStore(null);
        } else {
          console.log('Loja encontrada:', data.name);
          setStore(data);
        }
      } catch (err: any) {
        console.error('Erro inesperado na execução:', err?.message || err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStore();
  }, [params.domain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!store) return notFound();

  return (
    <CartProvider>
      <StoreLayoutInner store={store}>
         {children}
      </StoreLayoutInner>
    </CartProvider>
  );
}
