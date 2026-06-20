'use client';

import { useMemo, useState } from 'react';
import { ShoppingCart, Trash2, Mail, Clock, Package, AlertTriangle } from 'lucide-react';
import { deleteAbandonedCartAction } from '@/lib/abandoned-cart-actions';

interface CartsClientProps {
  initialCarts: any[];
  selectedStoreId: string | null;
  needsSetup: boolean;
}

function parseItems(items: any) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatDate(value: any) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-PT');
}

export default function CartsClient({ initialCarts, selectedStoreId, needsSetup }: CartsClientProps) {
  const [carts, setCarts] = useState<any[]>(initialCarts);

  const stats = useMemo(() => {
    const open = carts.filter(cart => cart.status !== 'recovered').length;
    const recovered = carts.filter(cart => cart.status === 'recovered').length;
    const items = carts.reduce((sum, cart) => sum + (Number(cart.item_count) || parseItems(cart.items).reduce((s: number, item: any) => s + (Number(item.quantity) || 0), 0)), 0);
    return { open, recovered, items };
  }, [carts]);

  const removeCart = async (cart: any) => {
    const ok = confirm('Eliminar este carrinho?');
    if (!ok) return;

    const result = await deleteAbandonedCartAction(cart.id);
    if (!result?.success) {
      alert(result?.error || 'Não foi possível eliminar o carrinho.');
      return;
    }

    setCarts(prev => prev.filter(item => item.id !== cart.id));
  };

  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-text-dark">Carrinhos Abandonados</h1>
          <p className="text-[14px] text-text-muted mt-1">Acompanhe os carrinhos que ficaram guardados nas lojas.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-900 mb-2">Falta criar a tabela na Neon</h2>
              <p className="text-sm text-amber-800 leading-relaxed mb-4">Corre o SQL que te deixei no chat no editor SQL da Neon/Vercel Postgres para ativar esta área.</p>
              <code className="block bg-white/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 overflow-x-auto">CREATE TABLE IF NOT EXISTS abandoned_carts (...)</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-text-dark">Carrinhos Abandonados</h1>
          <p className="text-[14px] text-text-muted mt-1">Veja os carrinhos guardados quando um cliente fecha a loja sem comprar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Em aberto</p>
          <p className="text-3xl font-black text-text-dark">{stats.open}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Recuperados</p>
          <p className="text-3xl font-black text-text-dark">{stats.recovered}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Produtos guardados</p>
          <p className="text-3xl font-black text-text-dark">{stats.items}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-[12px] font-bold text-text-muted py-4 px-6 uppercase">Sessão</th>
                <th className="text-left text-[12px] font-bold text-text-muted py-4 px-6 uppercase">Cliente</th>
                <th className="text-left text-[12px] font-bold text-text-muted py-4 px-6 uppercase">Produtos</th>
                <th className="text-left text-[12px] font-bold text-text-muted py-4 px-6 uppercase">Estado</th>
                <th className="text-left text-[12px] font-bold text-text-muted py-4 px-6 uppercase">Última atividade</th>
                <th className="text-right text-[12px] font-bold text-text-muted py-4 px-6 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carts.map(cart => {
                const items = parseItems(cart.items);
                return (
                  <tr key={cart.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-text-dark">{String(cart.session_id || '').slice(0, 18)}</p>
                          <p className="text-[11px] text-text-muted">Loja: {selectedStoreId?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-text-dark">{cart.customer_name || 'Cliente anónimo'}</p>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {cart.customer_email || 'Sem email'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-text-dark">{Number(cart.item_count) || items.length} item(ns)</p>
                        <p className="text-xs text-text-muted line-clamp-2">
                          {items.map((item: any) => `${item.quantity || 1}x ${String(item.productId || item.product_id || '').slice(0, 8)}`).join(', ') || 'Sem itens'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase ${cart.status === 'recovered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {cart.status === 'recovered' ? 'Recuperado' : 'Em aberto'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-text-muted">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDate(cart.last_activity_at || cart.updated_at || cart.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => removeCart(cart)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {carts.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Package className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Ainda não existem carrinhos guardados</h3>
              <p className="text-sm text-gray-500">Quando alguém adicionar produtos e sair da loja, aparecerá aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
