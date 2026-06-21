'use client';

import { getStorefrontDataAction } from '@/lib/actions';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Loader2, LogOut, ShoppingCart, UserPlus, UserRound, X } from 'lucide-react';
import { useState, ReactNode, useEffect } from 'react';
import { CartProvider, useCart } from '@/components/CartProvider';

function readStoreCustomer(storeId: string) {
  try {
    const saved = localStorage.getItem(`shopforge-store-customer-${storeId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function StoreLayoutInner({ children, store }: { children: ReactNode, store: any }) {
  const { cartCount } = useCart();
  const pathname = usePathname();
  const isDark = store.theme === 'dark';
  const accountsEnabled = store.customization?.accounts?.enabled !== false;
  const [refCode, setRefCode] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const popupDismissKey = `shopforge-login-popup-dismissed-${store.id}`;

  const refreshCustomer = () => {
    if (!accountsEnabled) {
      setCustomer(null);
      return;
    }
    setCustomer(readStoreCustomer(store.id));
  };

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
    refreshCustomer();
    window.addEventListener('storage', refreshCustomer);
    window.addEventListener('shopforge-store-customer-changed', refreshCustomer);

    return () => {
      window.removeEventListener('storage', refreshCustomer);
      window.removeEventListener('shopforge-store-customer-changed', refreshCustomer);
    };
  }, [accountsEnabled, store.id, pathname]);

  useEffect(() => {
    if (!accountsEnabled || customer || pathname?.includes('/account')) {
      setShowLoginPopup(false);
      return;
    }

    if (sessionStorage.getItem(popupDismissKey) === 'true') return;

    const timer = window.setTimeout(() => {
      const latestCustomer = readStoreCustomer(store.id);
      if (!latestCustomer && sessionStorage.getItem(popupDismissKey) !== 'true') {
        setShowLoginPopup(true);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [accountsEnabled, customer, pathname, popupDismissKey, store.id]);

  const closePopup = () => {
    sessionStorage.setItem(popupDismissKey, 'true');
    setShowLoginPopup(false);
  };

  const logout = () => {
    localStorage.removeItem(`shopforge-store-customer-${store.id}`);
    sessionStorage.setItem(popupDismissKey, 'true');
    setCustomer(null);
    setAccountOpen(false);
    setShowLoginPopup(false);
    window.dispatchEvent(new Event('shopforge-store-customer-changed'));
  };

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
                <div className="relative">
                  {customer ? (
                    <button
                      onClick={() => setAccountOpen(!accountOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 bg-white/80 text-slate-950 shadow-sm hover:shadow-md transition-all"
                    >
                      <span className="w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-xs" style={{ backgroundColor: store.primary_color || '#111827' }}>
                        {String(customer.name || customer.email || 'C').charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden sm:flex flex-col text-left leading-none">
                        <span className="text-xs font-black max-w-[120px] truncate">{customer.name || 'Cliente'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">Conta ativa</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      href={`/s/${store.domain}/account`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-black shadow-lg shadow-black/10 hover:scale-[1.02] transition-all"
                      style={{ backgroundColor: store.primary_color || '#111827' }}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Criar conta / Login</span>
                      <span className="sm:hidden">Login</span>
                    </Link>
                  )}

                  {accountOpen && customer && (
                    <div className="absolute right-0 top-full mt-3 w-72 bg-white text-slate-950 border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-5 border-b border-slate-100">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black mb-2">Conta da loja</p>
                        <p className="font-black truncate">{customer.name || 'Cliente'}</p>
                        <p className="text-xs text-slate-500 font-semibold truncate mt-1">{customer.email}</p>
                      </div>
                      <div className="p-2">
                        <Link href={`/s/${store.domain}/account`} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-sm font-bold transition-colors">
                          <UserRound className="w-4 h-4" /> Ver conta
                        </Link>
                        <button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-50 text-red-600 text-sm font-black transition-colors">
                          <LogOut className="w-4 h-4" /> Terminar sessão
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

        {showLoginPopup && accountsEnabled && !customer && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white text-slate-950 rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <div className="p-6 relative">
                <button onClick={closePopup} className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mb-5" style={{ backgroundColor: store.primary_color || '#111827' }}>
                  <UserPlus className="w-7 h-7" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black mb-2">Conta da loja</p>
                <h2 className="text-2xl font-black tracking-tight mb-2">Crie conta ou inicie sessão</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                  Guarde os seus dados, recupere carrinhos e finalize compras mais rápido nesta loja.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href={`/s/${store.domain}/account`} onClick={closePopup} className="px-5 py-4 rounded-2xl text-white font-black text-center" style={{ backgroundColor: store.primary_color || '#111827' }}>
                    Criar conta / Login
                  </Link>
                  <button onClick={closePopup} className="px-5 py-4 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-colors">
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
