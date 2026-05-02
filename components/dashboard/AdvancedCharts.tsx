'use client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

interface SalesData {
  name: string;
  sales: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface AdvancedChartsProps {
  salesData: SalesData[];
  categoryData: CategoryData[];
  loading: boolean;
}

export function AdvancedCharts({ salesData, categoryData, loading }: AdvancedChartsProps) {

  const totalCategory = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-2xl border border-border shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 mb-8"></div>
          <div className="h-[300px] bg-bg-gray rounded"></div>
        </div>
        <div className="bg-card-bg p-6 rounded-2xl border border-border shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 mb-8"></div>
          <div className="h-[240px] bg-bg-gray rounded"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Revenue Trend Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2 bg-card-bg p-6 rounded-2xl border border-border shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Tendência de Receita</h3>
            <p className="text-sm text-text-muted">Acompanhamento de vendas semanais</p>
          </div>
          <select className="bg-bg-gray border border-border text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
          </select>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card-bg)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--color-border)', 
                  boxShadow: 'var(--shadow-lg)' 
                }}
                itemStyle={{ color: 'var(--color-text-primary)' }}
                labelStyle={{ color: 'var(--color-text-muted)' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Distribution Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card-bg p-6 rounded-2xl border border-border shadow-sm"
      >
        <h3 className="text-lg font-bold text-text-primary mb-1">Vendas por Categoria</h3>
        <p className="text-sm text-text-muted mb-8">Distribuição do volume total</p>
        
        <div className="h-[240px] w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold">{totalCategory}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {categoryData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-text-secondary">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{totalCategory > 0 ? Math.round((item.value / totalCategory) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
