'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  currentValue: number;
  previousValue?: number;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  format?: 'currency' | 'number' | 'percentage';
  period?: string;
}

export function StatCard({ 
  label, 
  currentValue, 
  previousValue, 
  icon: Icon, 
  iconColor = 'var(--color-primary)',
  format = 'number',
  period = 'vs mês anterior'
}: StatCardProps) {
  const formattedValue = (val: number) => {
    if (format === 'currency') return `€ ${val.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`;
    if (format === 'percentage') return `${val.toFixed(1)}%`;
    return val.toLocaleString('pt-PT');
  };

  const calculateTrend = () => {
    if (!previousValue || previousValue === 0) {
      return { percentage: 0, isPositive: true };
    }
    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    return { 
      percentage: Math.abs(percentage), 
      isPositive: percentage >= 0 
    };
  };

  const trend = calculateTrend();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden bg-card-bg/95 dark:bg-slate-900/85 p-6 rounded-3xl border border-border shadow-premium hover:shadow-xl hover:border-primary/30 transition-all duration-300 backdrop-blur-xl"
    >
      <div 
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-[0.04] group-hover:opacity-[0.13] transition-opacity duration-500 dark:opacity-[0.10] dark:group-hover:opacity-[0.20]"
        style={{ backgroundColor: iconColor }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70 dark:via-white/10" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[12px] font-bold text-text-muted mb-1 flex items-center gap-1.5 uppercase tracking-[0.12em]">
            {label}
          </p>
          <p className="text-2xl font-black text-text-primary leading-tight tracking-tight">
            {formattedValue(currentValue)}
          </p>
        </div>
        
        {Icon && (
          <div 
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/10 group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${iconColor}18` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-black border ${
          trend.percentage === 0 
            ? 'bg-slate-100 text-text-muted border-slate-200 dark:bg-white/5 dark:border-white/10' 
            : trend.isPositive 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20' 
              : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/20'
        }`}>
          {trend.percentage === 0 ? (
            <Minus className="w-3 h-3" />
          ) : trend.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{trend.percentage.toFixed(1)}%</span>
        </div>
        <span className="text-[11px] font-bold text-text-muted">{period}</span>
      </div>
    </motion.div>
  );
}
