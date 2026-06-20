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
  const subscriptionTier = authUser?.subscriptionTier || (user.publicMetadata?.subscriptionTier as string) || 'STARTER';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="px-2 mb-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">ShopForge</span>
        </Link>
      </div>
      
      {stores.length > 0 && (
        <div className="px-2 mb-6 relative">
          <button  
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 border border-border/50 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-border shrink-0 shadow-sm">
                <StoreIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted leading-none mb-1">Loja Ativa</span>
                <span className="text-[13px] font-bold text-text-primary truncate">{currentStore?.name || 'Selecionar Loja'}</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${storeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {storeDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-2 right-2 mt-2 bg-white border border-border shadow-2xl rounded-2xl py-2 z-50 overflow-hidden"
              >
                {stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreChange(store.id)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] transition-all ${
                      currentStore?.id === store.id 
                        ? 'bg-primary text-white font-bold' 
                        : 'text-text-secondary hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <span>{store.name}</span>
                    {currentStore?.id === store.id && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  <Link href="/dashboard/settings" onClick={() => setStoreDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-primary hover:bg-primary/5 transition-all">
                    <Plus className="w-4 h-4" />
                    Gerir Lojas
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto space-y-1 px-2 no-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'text-primary font-bold bg-primary/5' 
                  : 'text-text-secondary hover:text-primary hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
              <span className="text-[14px]">{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 px-2">
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl relative overflow-hidden group mb-4">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Seu Plano</span>
              <div className="p-1 rounded-md bg-white/10">
                {subscriptionTier === 'STARTER' ? <Zap className="w-3 h-3" /> :
                 subscriptionTier === 'PRO' ? <Star className="w-3 h-3 text-amber-400" /> :
                 <Crown className="w-3 h-3 text-primary" />}
              </div>
            </div>
            <p className="text-sm font-bold mb-1">{subscriptionTier}</p>
            {subscriptionTier === 'STARTER' && (
              <Link href="/dashboard/subscription" className="text-[11px] font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                Fazer Upgrade <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-text-secondary hover:bg-rose-50 hover:text-rose-600 rounded-xl w-full text-left transition-all text-[14px] font-medium group"
        >
          <LogOut className="w-[18px] h-[18px] group-hover:-translate-x-1 transition-transform" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex font-sans antialiased text-text-primary">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[280px] bg-white border-r border-border z-40">
        <SidebarContent />
      </aside>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-border shadow-2xl lg:hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-bold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:pl-[280px] flex flex-col min-h-screen">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Pesquisar em tudo..." 
                className="bg-slate-50 border border-border/50 pl-10 pr-4 py-2 rounded-xl text-[13px] w-[320px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </div>

            <ThemeToggle />

            <NotificationPanel />
            
            {currentStore && (
              <Link  
                href={`/s/${currentStore.domain}`} 
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-[13px] font-bold hover:bg-slate-50 hover:border-primary/30 transition-all text-text-secondary shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Loja Online</span>
              </Link>
            )}
            
            <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-all">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-emerald-400 rounded-full flex items-center justify-center text-white font-black text-[12px] shadow-sm">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-[13px] font-bold text-text-secondary">{user?.firstName || 'Conta'}</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 bg-slate-50/30">
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
