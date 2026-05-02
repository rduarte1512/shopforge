'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMockDB } from '@/lib/store';
import { Plus, Edit2, Trash2, X, Ticket, Calendar, Percent, DollarSign, Loader2 } from 'lucide-react';

export default function CouponsPage() {
  const { user } = useAuth();
  const { selectedStoreId } = useMockDB();
  const [stores, setStores] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minPurchase: '0',
    maxUses: '',
    expiryDate: '',
    active: true
  });

  const fetchData = async () => {
    if (!user || !supabase) return;
    try {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id);
      
      if (storesError) throw storesError;
      setStores(storesData || []);

      const currentStore = selectedStoreId 
        ? storesData?.find(s => s.id === selectedStoreId) || storesData?.[0]
        : storesData?.[0];

      if (currentStore) {
        const { data: couponsData, error: couponsError } = await supabase
          .from('coupons')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('created_at', { ascending: false });
        
        if (couponsError) throw couponsError;
        setCoupons(couponsData || []);
      }
    } catch (err) {
      console.error('Error fetching coupons data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedStoreId]);

  const currentStoreId = selectedStoreId || stores[0]?.id;

  const openModal = (coupon?: any) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value.toString(),
        minPurchase: coupon.min_purchase.toString(),
        maxUses: coupon.max_uses?.toString() || '',
        expiryDate: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
        active: coupon.active
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: '0',
        maxUses: '',
        expiryDate: '',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStoreId || !supabase) return;

    const couponData = {
      store_id: currentStoreId,
      code: formData.code.toUpperCase(),
      discount_type: formData.discountType,
      discount_value: parseFloat(formData.discountValue),
      min_purchase: parseFloat(formData.minPurchase),
      max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiry_date: formData.expiryDate || null,
      active: formData.active
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao guardar cupão: ${err.message}`);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Tens a certeza que desejas eliminar este cupão?') || !supabase) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Erro ao eliminar cupão: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-shopify-green" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-[var(--color-text-dark)]">Cupões de Desconto</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Gere promoções e códigos de desconto para a sua loja.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[var(--color-shopify-green)] text-white px-4 py-2 rounded-md font-[600] text-[13px] flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4.5 h-4.5" /> Criar Cupão
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-gray-50)]">
                <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Código</th>
                <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Desconto</th>
                <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Uso</th>
                <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Estado</th>
                <th className="text-right text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-[var(--color-gray-50)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="font-mono font-bold text-[14px] text-[var(--color-text-dark)]">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[14px] font-[500]">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `€ ${Number(coupon.discount_value).toFixed(2)}`}
                    </span>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Mín. € {Number(coupon.min_purchase).toFixed(2)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[13px] text-[var(--color-text-dark)]">
                      {coupon.used_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : 'utilizações'}
                    </div>
                    {coupon.expiry_date && (
                      <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] mt-1">
                        <Calendar className="w-3 h-3" /> {new Date(coupon.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[600] ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-3 text-[var(--color-text-muted)]">
                      <button onClick={() => openModal(coupon)} className="hover:text-[var(--color-shopify-green)] transition-colors">
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="hover:text-red-600 transition-colors">
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                 <tr>
                   <td colSpan={5} className="py-20 text-center text-text-muted">
                     Nenhum cupão encontrado.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[var(--color-gray-50)]">
                 <h2 className="text-lg font-bold">{editingCoupon ? 'Editar Cupão' : 'Novo Cupão'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                   <X className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                 <div className="grid grid-cols-2 gap-5">
                    <input required type="text" placeholder="Código (EX: VERÃO20)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg" />
                    <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value as any})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg">
                       <option value="percentage">Percentagem (%)</option>
                       <option value="fixed">Valor Fixo (€)</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                    <input required type="number" step="0.01" placeholder="Valor" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg" />
                    <input required type="number" step="0.01" placeholder="Compra Mínima" value={formData.minPurchase} onChange={e => setFormData({...formData, minPurchase: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg" />
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                    <input type="number" placeholder="Limite de Usos" value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg" />
                    <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg" />
                 </div>
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="coupon-active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4" />
                    <label htmlFor="coupon-active" className="text-sm font-medium cursor-pointer">Cupão Ativo</label>
                 </div>
                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-[13px] hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 bg-[var(--color-text-dark)] text-white font-bold text-[13px] rounded-lg">Guardar Cupão</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
