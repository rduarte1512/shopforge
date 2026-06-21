'use client';

import Link from 'next/link';
import { ChevronDown, LogOut, UserPlus, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function readStoreCustomer(storeId: string) {
  try {
    const saved = localStorage.getItem(`shopforge-store-customer-${storeId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function StoreAccountWidget({ store, accentColor }: { store: any; accentColor?: string }) {
  const accountsEnabled = store?.customization?.accounts?.enabled !== false;
  const color = accentColor || store?.primary_color || '#111827';
  const [customer, setCustomer] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const popupDismissKey = `shopforge-login-popup-dismissed-${store?.id}`;

  const refreshCustomer = () => {
    if (!store?.id || !accountsEnabled) {
      setCustomer(null);
      return;
    }
    setCustomer(readStoreCustomer(store.id));
  };

  useEffect(() => {
    refreshCustomer();
    window.addEventListener('storage', refreshCustomer);
    window.addEventListener('shopforge-store-customer-changed', refreshCustomer);

    return () => {
      window.removeEventListener('storage', refreshCustomer);
      window.removeEventListener('shopforge-store-customer-changed', refreshCustomer);
    };
  }, [store?.id, accountsEnabled]);

  useEffect(() => {
    if (!store?.id || !accountsEnabled || customer) {
      setShowPopup(false);
      return;
    }

    if (window.location.pathname.includes('/account')) return;
    if (sessionStorage.getItem(popupDismissKey) === 'true') return;

    const timer = window.setTimeout(() => {
      const latestCustomer = readStoreCustomer(store.id);
      if (!latestCustomer && sessionStorage.getItem(popupDismissKey) !== 'true') {
        setShowPopup(true);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [store?.id, accountsEnabled, customer, popupDismissKey]);

  const closePopup = () => {
    sessionStorage.setItem(popupDismissKey, 'true');
    setShowPopup(false);
  };

  const logout = () => {
    localStorage.removeItem(`shopforge-store-customer-${store.id}`);
    sessionStorage.setItem(popupDismissKey, 'true');
    setCustomer(null);
    setOpen(false);
    setShowPopup(false);
    window.dispatchEvent(new Event('shopforge-store-customer-changed'));
  };

  if (!accountsEnabled || !store?.id) return null;

  return (
    <>
      <div className="relative">
        {customer ? (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2 text-slate-950 shadow-sm transition-all hover:shadow-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: color }}>
              {String(customer.name || customer.email || 'C').charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-black sm:inline">{customer.name || 'Conta'}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <Link
            href={`/s/${store.domain}/account`}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{ backgroundColor: color }}
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden lg:inline">Criar conta / Login</span>
            <span className="lg:hidden">Login</span>
          </Link>
        )}

        {open && customer && (
          <div className="absolute right-0 top-full z-[90] mt-3 w-72 overflow-hidden rounded-3xl border border-slate-100 bg-white text-slate-950 shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Conta da loja</p>
              <p className="truncate font-black">{customer.name || 'Cliente'}</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{customer.email}</p>
            </div>
            <div className="p-2">
              <Link href={`/s/${store.domain}/account`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 text-sm font-bold transition-colors hover:bg-slate-50">
                <UserRound className="h-4 w-4" /> Ver conta
              </Link>
              <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-black text-red-600 transition-colors hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Terminar sessão
              </button>
            </div>
          </div>
        )}
      </div>

      {showPopup && !customer && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white text-slate-950 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="relative p-6">
              <button onClick={closePopup} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: color }}>
                <UserPlus className="h-7 w-7" />
              </div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Conta da loja</p>
              <h2 className="mb-2 text-2xl font-black tracking-tight">Crie conta ou inicie sessão</h2>
              <p className="mb-6 text-sm font-medium leading-relaxed text-slate-500">Guarde os seus dados, recupere carrinhos e finalize compras mais rápido nesta loja.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href={`/s/${store.domain}/account`} onClick={closePopup} className="rounded-2xl px-5 py-4 text-center font-black text-white" style={{ backgroundColor: color }}>
                  Criar conta / Login
                </Link>
                <button onClick={closePopup} className="rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-700 transition-colors hover:bg-slate-200">Agora não</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
