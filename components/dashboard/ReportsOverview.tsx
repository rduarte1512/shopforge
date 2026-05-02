'use client';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, CreditCard } from 'lucide-react';

interface ReportMetrics {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  averageOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  avgOrderChange: number;
}

interface ReportsOverviewProps {
  metrics: ReportMetrics | null;
  loading: boolean;
}

const MetricCard = ({ label, value, change, icon: Icon, color, index }: any) => {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card-bg/70 backdrop-blur-md border border-border/20 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-text-muted text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
      </div>
      <div className="mt-4 w-full h-1 bg-bg-gray rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
          className={`h-full ${color}`}
        />
      </div>
    </motion.div>
  );
};

export function ReportsOverview({ metrics, loading }: ReportsOverviewProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const metricsData = metrics ? [
    { label: 'Receita Total', value: formatCurrency(metrics.totalRevenue), change: metrics.revenueChange, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Total de Vendas', value: metrics.totalOrders.toString(), change: metrics.ordersChange, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Novos Clientes', value: metrics.newCustomers.toString(), change: metrics.customersChange, icon: Users, color: 'bg-purple-500' },
    { label: 'Ticket Médio', value: formatCurrency(metrics.averageOrderValue), change: metrics.avgOrderChange, icon: CreditCard, color: 'bg-orange-500' },
  ] : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card-bg/70 backdrop-blur-md border border-border/20 p-6 rounded-2xl shadow-sm animate-pulse">
            <div className="h-10 w-10 bg-bg-gray rounded-xl mb-4"></div>
            <div className="h-4 bg-bg-gray rounded w-24 mb-2"></div>
            <div className="h-8 bg-bg-gray rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, i) => (
        <MetricCard key={metric.label} {...metric} index={i} />
      ))}
    </div>
  );
}
