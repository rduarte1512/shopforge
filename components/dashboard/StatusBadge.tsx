'use client';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  paid: { label: 'Pago', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  failed: { label: 'Falhou', variant: 'error' },
  shipped: { label: 'Enviado', variant: 'info' },
  delivered: { label: 'Entregue', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'error' },
  processing: { label: 'Processando', variant: 'info' },
  out_of_stock: { label: 'Esgotado', variant: 'error' },
  in_stock: { label: 'Em Stock', variant: 'success' },
  low_stock: { label: 'Stock Baixo', variant: 'warning' },
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'neutral' },
};

const variantStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/50',
  error: 'bg-rose-50 text-rose-700 border-rose-200/50',
  info: 'bg-blue-50 text-blue-700 border-blue-200/50',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200/50',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { label: status, variant: variant || 'neutral' };
  const finalVariant = config.variant;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${variantStyles[finalVariant]} transition-colors duration-200`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        finalVariant === 'success' ? 'bg-emerald-500' :
        finalVariant === 'warning' ? 'bg-amber-500' :
        finalVariant === 'error' ? 'bg-rose-500' :
        finalVariant === 'info' ? 'bg-blue-500' : 'bg-slate-500'
      }`} />
      {config.label}
    </span>
  );
}