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
  iconBgColor = 'var(--color-primary)',
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden bg-card-bg p-6 rounded-2xl border border-border shadow-premium hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500"
        style={{ backgroundColor: iconColor }}
      />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-text-muted mb-1 flex items-center gap-1.5">
            {label}
          </p>
          <p className="text-2xl font-bold text-text-primary leading-tight tracking-tight">
            {formattedValue(currentValue)}
          </p>
        </div>
        
        {Icon && (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${iconColor}10` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold ${
          trend.percentage === 0 
            ? 'bg-slate-100 text-text-muted' 
            : trend.isPositive 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-rose-50 text-rose-600'
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
        <span className="text-[11px] font-medium text-text-muted">{period}</span>
      </div>
    </motion.div>
  );
}