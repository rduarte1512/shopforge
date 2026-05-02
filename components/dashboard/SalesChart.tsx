'use client';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LucideIcon } from 'lucide-react';

interface SalesChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  dataKey?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  gradientId?: string;
  color?: string;
}

export function SalesChart({
  data,
  dataKey = 'value',
  height = 280,
  showGrid = true,
  showTooltip = true,
  gradientId = 'colorSales',
  color = 'var(--color-primary)'
}: SalesChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          )}
          
          <XAxis 
            dataKey="name" 
            stroke="var(--color-text-muted)" 
            fontSize={11} 
            fontWeight={600}
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          
          <YAxis 
            stroke="var(--color-text-muted)" 
            fontSize={11} 
            fontWeight={600}
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `€${value}`}
          />
          
          {showTooltip && (
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-card-bg)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--color-text-primary)'
              }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
              labelStyle={{ color: 'var(--color-text-muted)' }}
              formatter={(value: any) => [`€ ${Number(value).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 'Vendas']}
            />
          )}
          
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface QuickStatProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
}

export function QuickStat({ title, value, change, icon: Icon }: QuickStatProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-card-bg rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
      <div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{title}</p>
        <p className="text-[20px] font-black text-text-primary mt-1">{value}</p>
      </div>
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
}