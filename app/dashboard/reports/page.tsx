'use client';
import { ReportsOverview } from '@/components/dashboard/ReportsOverview';
import { AdvancedCharts } from '@/components/dashboard/AdvancedCharts';
import { TopProductsTable } from '@/components/dashboard/TopProductsTable';
import { DateRangeFilter, DateRange } from '@/components/dashboard/DateRangeFilter';
import { Download, Filter, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { subDays, endOfDay, startOfDay } from 'date-fns';
import { useReportsData } from '@/hooks/useReportsData';
import { useMockDB, SUBSCRIPTION_PLANS } from '@/lib/store';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const { currentUser } = useMockDB();
  const router = useRouter();
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === currentUser?.subscriptionTier) || SUBSCRIPTION_PLANS[0];
  const isPremium = plan.id !== 'FREE';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
    preset: 'last30days',
    label: 'Últimos 30 dias'
  });

  const { metrics, salesData, categoryData, topProducts, loading } = useReportsData(dateRange);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Relatórios Analíticos</h1>
          <p className="text-text-muted mt-1 font-medium">Acompanhe o desempenho da sua loja em tempo real</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button 
            onClick={handleRefresh}
            className={`p-2.5 bg-card-bg border border-border rounded-xl hover:bg-bg-gray transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-4 h-4 text-text-muted" />
          </button>
          
          <DateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 py-4 px-6 bg-card-bg/50 border border-border rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
          <Filter className="w-4 h-4" />
          Filtrar por:
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-500/20 cursor-pointer">Todas as Lojas</span>
          <span className="px-3 py-1.5 bg-bg-gray text-text-secondary text-xs font-bold rounded-lg border border-border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Pagos</span>
          <span className="px-3 py-1.5 bg-bg-gray text-text-secondary text-xs font-bold rounded-lg border border-border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Enviados</span>
        </div>
      </motion.div>

      {/* Reports Overview Metrics */}
      <ReportsOverview metrics={metrics} loading={loading} />
      
      {isPremium ? (
        <>
          <AdvancedCharts salesData={salesData} categoryData={categoryData} loading={loading} />
          <TopProductsTable topProducts={topProducts} loading={loading} />
        </>
      ) : (
        <div className="relative py-20 bg-card-bg rounded-3xl border border-border flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
          <div className="absolute inset-0 bg-bg-gray/50 backdrop-blur-[2px]" />
          <div className="relative z-10 space-y-4 px-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-card-bg shadow-lg">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-text-primary">Visualizações Avançadas Bloqueadas</h2>
              <p className="text-text-muted max-w-md mx-auto font-medium">
                Os gráficos de tendências, análise de categorias e tabelas detalhadas de produtos estão disponíveis apenas nos planos pagos.
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/subscription')}
              className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Ver Planos de Subscrição
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-text-muted font-medium"
      >
        Dados atualizados pela última vez às {new Date().toLocaleTimeString()} • ShopForge Analytics v2.4
      </motion.p>
    </div>
  );
}
