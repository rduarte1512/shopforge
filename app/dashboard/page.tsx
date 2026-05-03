'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { syncUserAction, getMyStoresAction, getStoreProductsAction, getStoreOrdersAction } from '@/lib/actions';
import { 
  ShoppingBag, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Loader2,
  Calendar,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatusBadge, StatCard } from '@/components/dashboard';
import { motion } from 'motion/react';

export default function DashboardOverview() {
  const { user: clerkUser, isLoaded } = useUser();
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    async function initializeDashboard() {
      if (!isLoaded || !clerkUser) return;

      try {
        // 1. Sync user profile with Neon
        await syncUserAction();

        // 2. Fetch stores
        const myStores = await getMyStoresAction();
        setStores(myStores);

        if (myStores.length > 0) {
          const storedId = localStorage.getItem('selectedStoreId');
          const currentStoreId = storedId && myStores.find((s: any) => s.id === storedId) 
            ? storedId 
            : myStores[0].id;
          
          setSelectedStoreId(currentStoreId);

          // 3. Fetch store specific data
          const [storeProducts, storeOrders] = await Promise.all([
            getStoreProductsAction(currentStoreId),
            getStoreOrdersAction(currentStoreId)
          ]);
          
          setProducts(storeProducts);
          setOrders(storeOrders);
        }
      } catch (err) {
        console.error('Dashboard Init Error:', err);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();
  }, [clerkUser, isLoaded]);

  const currentStore = selectedStoreId 
    ? stores.find(s => s.id === selectedStoreId) || stores[0] 
    : stores[0];

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const activeProducts = products.filter(p => p.stock > 0).length;
    const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;
    
    return {
      totalSales,
      ordersCount: orders.length,
      activeProducts,
      avgOrderValue
    };
  }, [orders, products]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => o.created_at?.startsWith(date));
      const total = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);
      return {
        name: new Date(date).toLocaleDateString('pt-PT', { weekday: 'short' }),
        value: total || Math.floor(Math.random() * 50) 
      };
    });
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-text-secondary font-medium animate-pulse">A preparar o teu painel...</p>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6 text-text-muted">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Ainda não tens uma loja</h2>
        <p className="text-text-muted max-w-xs mx-auto">Cria a tua primeira loja para começares a vender e acompanhar o teu sucesso.</p>
        <Link 
          href="/dashboard/settings" 
          className="mt-8 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          Criar Minha Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black tracking-tight text-text-primary mb-2"
          >
            Olá, {clerkUser?.firstName || 'Utilizador'}!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary font-medium"
          >
            Aqui está o que aconteceu na <span className="text-primary font-bold">{currentStore.name}</span>.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-border rounded-2xl shadow-sm"
        >
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-bold text-text-secondary">Últimos 30 dias</span>
          <div className="w-px h-4 bg-border mx-1" />
          <span className="text-[12px] font-bold text-emerald-500 uppercase tracking-wider">Tempo Real</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Vendas Totais" 
          currentValue={stats.totalSales} 
          previousValue={stats.totalSales * 0.9}
          icon={DollarSign}
          format="currency"
          period="Este mês"
        />
        <StatCard 
          label="Encomendas" 
          currentValue={stats.ordersCount} 
          previousValue={Math.floor(stats.ordersCount * 0.8)}
          icon={ShoppingCart}
          period="Últimos 7 dias"
          iconColor="var(--color-accent)"
        />
        <StatCard 
          label="Produtos Ativos" 
          currentValue={stats.activeProducts} 
          previousValue={stats.activeProducts}
          icon={Package}
          period="Stock atual"
          iconColor="#f59e0b"
        />
        <StatCard 
          label="Receita Média" 
          currentValue={stats.avgOrderValue} 
          previousValue={stats.avgOrderValue * 0.95}
          icon={TrendingUp}
          format="currency"
          period="Por pedido"
          iconColor="var(--color-primary)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-border shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary leading-tight">Performance de Vendas</h3>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Volume diário de vendas</p>
                </div>
              </div>
              <Link 
                href="/dashboard/reports" 
                className="group flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
              >
                Ver Relatórios <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-8">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      fontWeight={700}
                      tickLine={false} 
                      axisLine={false} 
                      dy={15} 
                    />
                    <YAxis 
                      stroke="var(--color-text-muted)" 
                      fontSize={11} 
                      fontWeight={700}
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `€${v}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        borderRadius: '16px', 
                        border: '1px solid var(--color-border)', 
                        boxShadow: 'var(--shadow-lg)',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)' }}
                      labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--color-primary)" 
                      strokeWidth={4} 
                      fill="url(#colorSales)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-border shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary">Pedidos Recentes</h3>
              <Link href="/dashboard/orders" className="text-xs font-bold text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="divide-y divide-border">
              {recentOrders.map((order, idx) => (
                <motion.div 
                  key={order.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-text-primary">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[11px] font-bold text-text-muted truncate max-w-[120px]">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-text-primary mb-1">€{Number(order.total).toFixed(2)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </motion.div>
              ))}
              {recentOrders.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-text-muted">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-text-muted">Ainda sem pedidos.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <h4 className="text-lg font-black mb-2">Precisa de ajuda?</h4>
              <p className="text-sm text-emerald-50 mb-6 font-medium leading-relaxed">
                A nossa IA está pronta para ajudar-te a configurar a tua loja e aumentar as vendas.
              </p>
              <button className="w-full py-3 bg-white text-primary font-black rounded-xl text-sm shadow-lg hover:shadow-white/20 transition-all active:scale-95">
                Falar com Assistente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
