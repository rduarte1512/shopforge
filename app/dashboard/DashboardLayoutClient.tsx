'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  Store as StoreIcon, 
  ChevronDown,
  Menu,
  X,
  Search,
  Eye,
  Plus,
  Ticket,
  Truck,
  BarChart3,
  Users,
  Megaphone,
  Mail,
  Link as LinkIcon,
  Star,
  Crown,
  Zap,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { useAuth } from '@/lib/auth-context';
import { setSelectedStoreCookie } from '@/lib/dashboard-actions';

const navigation = [
  { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Minhas Lojas', href: '/dashboard/stores', icon: StoreIcon },
  { name: 'Produtos', href: '/dashboard/products', icon: Package },
  { name: 'Encomendas', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Contas da Loja', href: '/dashboard/store-accounts', icon: Users },
  { name: 'Carrinhos Abandonados', href: '/dashboard/carts', icon: ShoppingCart },
  { name: 'Afiliados', href: '/dashboard/affiliates', icon: LinkIcon },
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
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
}

export default function DashboardLayoutClient({ children, user, initialStores }: DashboardLayoutClientProps) {
  const { signOut } = useClerk();
  const { user: authUser } = useAuth();
  const [stores] = useState<any[]>(initialStores);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncStore = async () => {
      const storedId = localStorage.getItem('selectedStoreId');
      if (storedId && stores.some((s: any) => s.id === storedId)) {
        setSelectedStoreId(storedId);
        await setSelectedStoreCookie(storedId);
      } else if (stores.length > 0) {
        setSelectedStoreId(stores[0].id);
        localStorage.setItem('selectedStoreId', stores[0].id);
        await setSelectedStoreCookie(stores[0].id);
      }
    };
    
    syncStore();
  }, [stores]);

  const handleStoreChange = async (storeId: string) => {
    setSelectedStoreId(storeId);
    localStorage.setItem('selectedStoreId', storeId);
    await setSelectedStoreCookie(storeId);
    setStoreDropdownOpen(false);
    router.refresh();
  };

  const currentStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) || stores[0] : stores[0];
  const subscriptionTier = authUser?.subscriptionTier || (user?.publicMetadata?.subscriptionTier as string) || 'STARTER';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isNavActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const SidebarContent = () => (
    <div className="relative flex flex-col h-full py-5 px-4 overflow-hidden bg-slate-950 text-white">
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-primary/25 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -right-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 px-2 mb-7">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-2xl shadow-primary/25 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="block text-xl font-black tracking-tight text-white">ShopForge</span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">Commerce OS</span>
          </div>
        </Link>
      </div>
      
      {stores.length > 0 && (
        <div className="relative z-20 px-2 mb-5">
          <button  
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center justify-between w-full p-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] hover:border-white/20 transition-all group shadow-2xl shadow-black/20"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                <StoreIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[10px] uppercase tracking-[0.22em] font-black text-white/35 leading-none mb-1">Loja Ativa</span>
                <span className="text-[13px] font-black text-white truncate">{currentStore?.name || 'Selecionar Loja'}</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/45 transition-transform duration-300 ${storeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {storeDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                className="absolute left-2 right-2 mt-2 bg-card-bg/95 dark:bg-slate-900/95 text-text-primary border border-border dark:border-white/10 shadow-2xl shadow-black/25 rounded-2xl py-2 z-50 overflow-hidden backdrop-blur-xl"
              >
                {stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreChange(store.id)}
                    className={`flex items-center justify-between w-full px-4 py-3 text-[13px] transition-all ${
                      currentStore?.id === store.id 
                        ? 'bg-primary text-white font-black dark:text-slate-950' 
                        : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-text-primary font-bold'
                    }`}
                  >
                    <span className="truncate">{store.name}</span>
                    {currentStore?.id === store.id && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  <Link href="/dashboard/settings" onClick={() => setStoreDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-black text-primary hover:bg-primary/5 transition-all">
                    <Plus className="w-4 h-4" />
                    Gerir Lojas
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="relative z-10 flex-1 overflow-y-auto space-y-1.5 px-2 no-scrollbar pr-1">
        {navigation.map((item) => {
          const isActive = isNavActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'text-white font-black bg-white/[0.10] shadow-lg shadow-black/10' 
                  : 'text-white/58 hover:text-white hover:bg-white/[0.06] font-bold'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary to-emerald-400"
                />
              )}
              <item.icon className={`w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-emerald-300' : 'text-white/35 group-hover:text-white/80'}`} />
              <span className="text-[14px] truncate">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white/50" />}
            </Link>
          );
        })}
      </div>

      <div className="relative z-10 mt-auto pt-5 px-2">
        <div className="p-4 rounded-[1.6rem] bg-white/95 dark:bg-white/[0.07] text-slate-950 dark:text-white shadow-2xl shadow-black/20 relative overflow-hidden group mb-4 border border-transparent dark:border-white/10">
          <div className="absolute -top-10 -right-8 w-24 h-24 bg-primary/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/35">Seu Plano</span>
              <div className="p-1.5 rounded-lg bg-slate-950 dark:bg-white/10 text-white">
                {subscriptionTier === 'STARTER' ? <Zap className="w-3.5 h-3.5" /> :
                 subscriptionTier === 'PRO' ? <Star className="w-3.5 h-3.5 text-amber-300" /> :
                 <Crown className="w-3.5 h-3.5 text-emerald-300" />}
              </div>
            </div>
            <p className="text-lg font-black mb-1 tracking-tight">{subscriptionTier}</p>
            <p className="text-[11px] text-slate-500 dark:text-white/45 font-semibold mb-3">Funcionalidades desbloqueadas conforme o teu plano.</p>
            {subscriptionTier === 'STARTER' && (
              <Link href="/dashboard/subscription" className="text-[12px] font-black text-primary flex items-center gap-1 hover:gap-2 transition-all">
                Fazer Upgrade <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3.5 py-3 text-white/55 hover:bg-rose-500/10 hover:text-rose-200 rounded-2xl w-full text-left transition-all text-[14px] font-bold group"
        >
          <LogOut className="w-[18px] h-[18px] group-hover:-translate-x-1 transition-transform" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-main flex font-sans antialiased text-text-primary transition-colors duration-300">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[300px] bg-slate-950 border-r border-white/10 z-40 shadow-2xl shadow-black/30">
        <SidebarContent />
      </aside>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] bg-slate-950 border-r border-white/10 shadow-2xl lg:hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950 text-white">
                <span className="font-black">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto h-[calc(100%-65px)]">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:pl-[300px] flex flex-col min-h-screen">
        <header className="bg-card-bg/85 dark:bg-slate-950/82 backdrop-blur-xl sticky top-0 z-30 h-18 flex items-center justify-between px-4 lg:px-8 border-b border-border shadow-sm shadow-black/[0.02] dark:shadow-black/30 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-2xl transition-colors text-text-secondary hover:text-text-primary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Pesquisar lojas, produtos, encomendas..." 
                className="bg-bg-main/80 dark:bg-white/[0.05] border border-border pl-11 pr-4 py-3 rounded-2xl text-[13px] w-[360px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold shadow-inner shadow-black/[0.02] dark:shadow-black/20"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-black bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full border border-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/40" />
              Sincronizado
            </div>

            <ThemeToggle />

            <NotificationPanel />
            
            {currentStore && (
              <Link  
                href={`/s/${currentStore.domain}`} 
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 text-white border border-slate-900 text-[13px] font-black hover:bg-slate-800 dark:bg-primary dark:text-slate-950 dark:border-primary dark:hover:bg-emerald-400 transition-all shadow-lg shadow-black/10 dark:shadow-primary/20"
              >
                <Eye className="w-4 h-4" />
                <span>Loja Online</span>
              </Link>
            )}
            
            <button className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-all border border-transparent hover:border-border">
              <div className="w-9 h-9 bg-gradient-to-tr from-primary to-emerald-400 rounded-full flex items-center justify-center text-white font-black text-[12px] shadow-sm">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-[13px] font-black text-text-primary">{user?.firstName || 'Conta'}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{subscriptionTier}</span>
              </div>
            </button>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_32%),linear-gradient(180deg,var(--color-bg-main)_0%,var(--color-bg-gray)_100%)] transition-colors duration-300">
          <motion.div 
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
