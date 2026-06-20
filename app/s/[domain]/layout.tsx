'use client';

import { getStorefrontDataAction } from '@/lib/actions';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Loader2, UserRound } from 'lucide-react';
import { useState, ReactNode, useEffect } from 'react';
import { CartProvider, useCart } from '@/components/CartProvider';

function StoreLayoutInner({ children, store }: { children: ReactNode, store: any }) {
  const { cartCount } = useCart();
  const isDark = store.theme === 'dark';
  const accountsEnabled = store.customization?.accounts?.enabled === true;
  const [refCode, setRefCode] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref);
      sessionStorage.setItem('affiliate_ref', ref);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } else {
      const stored = sessionStorage.getItem('affiliate_ref');
      if (stored) setRefCode(stored);
    }
  }, [store.id]);

  useEffect(() => {
    if (!accountsEnabled) return;

    try {
      const saved = localStorage.getItem(`shopforge-store-customer-${store.id}`);
      setCustomer(saved ? JSON.parse(saved) : null);
    } catch {
      setCustomer(null);
    }
  }, [accountsEnabled, store.id]);

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
            <div className="flex items-center gap-4">
              {accountsEnabled && (
                <Link href={`/s/${store.domain}/account`} className="flex items-center gap-2 text-sm font-black opacity-80 hover:opacity-100 transition-opacity">
                  <UserRound className="w-5 h-5" />
                  <span className="hidden sm:inline">{customer?.name ? customer.name.split(' ')[0] : 'Conta'}</span>
                </Link>
              )}
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
      if (!params.domain) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getStorefrontDataAction(params.domain);
        if (data && data.store) {
          setStore(data.store);
        } else {
          setStore(null);
        }
      } catch (err: any) {
        console.error('Error fetching store:', err?.message || err);
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

  if (!store && !loading) {
    return <>{children}</>;
  }

  return (
    <CartProvider storeId={store.id} storeDomain={store.domain}>
      <StoreLayoutInner store={store}>
         {children}
      </StoreLayoutInner>
    </CartProvider>
  );
}
