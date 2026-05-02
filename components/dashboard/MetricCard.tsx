'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    percentage: number;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  iconColor?: string;
  format?: 'currency' | 'number' | 'text';
}

export function MetricCard({ title, value, trend, icon: Icon, iconColor = 'var(--color-shopify-green)', format = 'text' }: MetricCardProps) {
  const formattedValue = () => {
    if (format === 'currency' && typeof value === 'number') {
      return `€ ${value.toFixed(2)}`;
    }
    return value;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.percentage === 0) return <Minus className="w-3 h-3" />;
    return trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-text-muted';
    if (trend.percentage === 0) return 'text-text-muted';
    return trend.isPositive ? 'text-emerald-500' : 'text-rose-500';
  };

  const getTrendText = () => {
    if (!trend) return 'Sem alterações';
    if (trend.percentage === 0) return 'Sem alterações';
    const prefix = trend.isPositive ? '↑' : '↓';
    return `${prefix} ${Math.abs(trend.percentage)}% vs mês anterior`;
  };

  return (
    <div className="group bg-card-bg p-5 rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[12px] font-[600] uppercase text-text-muted mb-2 tracking-[0.5px]">
          {title}
        </div>
        {Icon && (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300"
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
      </div>
      <p className="text-[28px] font-[700] text-text-primary tracking-tight">{formattedValue()}</p>
      <div className={`text-[12px] mt-2 flex items-center gap-1 ${getTrendColor()}`}>
        {getTrendIcon()}
        <span>{getTrendText()}</span>
      </div>
    </div>
  );
}