'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CreditCard,
  Eye,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store as StoreIcon,
  Ticket,
  Truck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { setSelectedStoreCookie } from '@/lib/dashboard-actions';
import { useMockDB } from '@/lib/store';

const navigation = [
  { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Minhas Lojas', href: '/dashboard/stores', icon: StoreIcon },
  { name: 'Produtos', href: '/dashboard/products', icon: Package },
  { name: 'Encomendas', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Contas da Loja', href: '/dashboard/store-accounts', icon: Users },
  { name: 'Equipa', href: '/dashboard/team', icon: Users },
  { name: 'Carrinhos Abandonados', href: '/dashboard/carts', icon: ShoppingCart },
  { name: 'Afiliados', href: '/dashboard/affiliates', icon: LinkIcon },
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Automações', href: '/dashboard/automations', icon: Zap },
  { name: 'Promoções', href: '/dashboard/promotions', icon: Megaphone },
  { name: 'Cupões', href: '/dashboard/coupons', icon: Ticket },
  { name: 'Frete e Envio', href: '/dashboard/shipping', icon: Truck },
  { name: 'E-mail Marketing', href: '/dashboard/email', icon: Mail },
  { name: 'Subscrição', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Integrações', href: '/dashboard/integrations', icon: Zap },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: any;
  initialStores: any[];
  initialSelectedStoreId: string | null;
}

export default function DashboardLayoutClient({ children, user, initialStores, initialSelectedStoreId }: DashboardLayoutClientProps) {
  const { signOut } = useClerk();
  const stores = initialStores || [];
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(initialSelectedStoreId);
  const [isSwitchingStore, setIsSwitchingStore] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentStore = selectedStoreId ? stores.find((store) => store.id === selectedStoreId) || stores[0] : stores[0];
  const subscriptionTier = user?.publicMetadata?.subscriptionTier || 'STARTER';

  // O cookie é a fonte de verdade da loja ativa. Quando router.refresh()
  // traz uma nova resposta do servidor, sincronizamos o seletor e os módulos
  // que ainda consultam o estado Zustand/localStorage.
  useEffect(() => {
    const activeId = stores.find(store => store.id === initialSelectedStoreId)?.id || stores[0]?.id || null;
    setSelectedStoreId(activeId);
    useMockDB.getState().setSelectedStore(activeId);
    if (activeId) localStorage.setItem('selectedStoreId', activeId);
    setIsSwitchingStore(false);
  }, [initialSelectedStoreId, initialStores]);

  async function changeStore(storeId: string) {
    if (isSwitchingStore || storeId === selectedStoreId || !stores.some(store => store.id === storeId)) return;
    setIsSwitchingStore(true);
    try {
      // Esperar pela confirmação do cookie ANTES de pedir o novo payload
      // do servidor. Um refresh prematuro podia renderizar a loja antiga.
      await setSelectedStoreCookie(storeId);
      localStorage.setItem('selectedStoreId', storeId);
      useMockDB.getState().setSelectedStore(storeId);
      setSelectedStoreId(storeId);
      router.refresh();
    } catch (error) {
      console.error('Erro ao mudar de loja:', error);
      setIsSwitchingStore(false);
      // A loja anterior permanece ativa caso a ação de servidor falhe.
      alert('Não foi possível mudar de loja. Tenta novamente.');
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white py-5 px-4">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center"><ShoppingBag className="w-6 h-6" /></div>
        <div><span className="block text-xl font-black">ShopForge</span><span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">Commerce OS</span></div>
      </Link>

      {stores.length > 0 && (
        <select aria-label="Selecionar loja" value={selectedStoreId || ''} onChange={(event) => void changeStore(event.target.value)} disabled={isSwitchingStore} className="mx-2 mb-4 rounded-2xl bg-white/10 border border-white/10 px-3 py-3 text-sm font-black text-white disabled:opacity-60">
          {stores.map((store) => <option key={store.id} value={store.id} className="text-slate-950">{store.name}</option>)}
        </select>
      )}

      <nav className="flex-1 overflow-y-auto space-y-1.5 px-2 no-scrollbar">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-[14px] ${active ? 'text-white font-black bg-white/[0.10]' : 'text-white/60 hover:text-white hover:bg-white/[0.06] font-bold'}`}>
              <item.icon className={`w-[18px] h-[18px] ${active ? 'text-emerald-300' : 'text-white/35'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 px-2 space-y-3">
        <div className="p-4 rounded-[1.5rem] bg-white/95 text-slate-950">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Seu Plano</p>
          <p className="text-lg font-black mt-1">{subscriptionTier}</p>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3.5 py-3 text-white/55 hover:bg-rose-500/10 hover:text-rose-200 rounded-2xl w-full text-left transition-all text-[14px] font-bold">
          <LogOut className="w-[18px] h-[18px]" /> Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-main flex font-sans antialiased text-text-primary transition-colors duration-300">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[300px] bg-slate-950 border-r border-white/10 z-40"><Sidebar /></aside>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/70" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[300px] bg-slate-950"><div className="p-4 border-b border-white/10 flex justify-between text-white"><span className="font-black">Menu</span><button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></button></div><Sidebar /></aside>
        </div>
      )}
      <div className="flex-1 lg:pl-[300px] flex flex-col min-h-screen">
        <header className="bg-card-bg/85 dark:bg-slate-950/82 backdrop-blur-xl sticky top-0 z-30 h-18 flex items-center justify-between px-4 lg:px-8 border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2.5 hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-2xl"><Menu className="w-5 h-5" /></button>
            <div className="relative hidden md:block"><Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" /><input placeholder="Pesquisar lojas, produtos, encomendas..." className="bg-bg-main/80 dark:bg-white/[0.05] border border-border pl-11 pr-4 py-3 rounded-2xl text-[13px] w-[360px] focus:outline-none font-semibold" /></div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-black bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full border border-emerald-100"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado</div>
            <ThemeToggle />
            <NotificationPanel />
            {currentStore && <Link href={`/s/${currentStore.domain}`} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 text-white text-[13px] font-black"><Eye className="w-4 h-4" /> Loja Online</Link>}
            <div className="hidden md:flex flex-col text-right"><span className="text-[13px] font-black text-text-primary">{user?.firstName || 'Conta'}</span><span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{subscriptionTier}</span></div>
          </div>
        </header>
        <main className="relative flex-1 p-4 lg:p-8 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_32%),linear-gradient(180deg,var(--color-bg-main)_0%,var(--color-bg-gray)_100%)] transition-colors duration-300">
          {isSwitchingStore && <div role="status" aria-live="polite" className="absolute inset-0 z-20 flex items-start justify-center bg-bg-main/80 pt-20 backdrop-blur-sm"><div className="rounded-2xl border border-border bg-card-bg px-5 py-3 text-sm font-bold shadow-lg">A atualizar os dados da loja...</div></div>}
          <div key={initialSelectedStoreId || 'no-store'} className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
