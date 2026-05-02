'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMockDB } from '@/lib/store';
import { Plus, Edit2, Trash2, X, Truck, Clock, Euro, ShieldCheck, Loader2 } from 'lucide-react';

export default function ShippingPage() {
  const { user } = useAuth();
  const { selectedStoreId } = useMockDB();
  const [stores, setStores] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    minOrderForFree: '',
    deliveryTime: '',
    active: true
  });

  const fetchData = async () => {
    if (!user) return;
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
        const { data: shippingData, error: shippingError } = await supabase
          .from('shipping_methods')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('created_at', { ascending: false });
        
        if (shippingError) throw shippingError;
        setShippingMethods(shippingData || []);
      }
    } catch (err) {
      console.error('Error fetching shipping data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedStoreId]);

  const currentStoreId = selectedStoreId || stores[0]?.id;

  const openModal = (method?: any) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        description: method.description,
        cost: method.cost.toString(),
        minOrderForFree: method.min_order_for_free?.toString() || '',
        deliveryTime: method.delivery_time,
        active: method.active
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        description: '',
        cost: '',
        minOrderForFree: '',
        deliveryTime: '',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStoreId) return;

    const methodData = {
      store_id: currentStoreId,
      name: formData.name,
      description: formData.description,
      cost: parseFloat(formData.cost),
      min_order_for_free: formData.minOrderForFree ? parseFloat(formData.minOrderForFree) : null,
      delivery_time: formData.deliveryTime,
      active: formData.active
    };

    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('shipping_methods')
          .update(methodData)
          .eq('id', editingMethod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_methods')
          .insert(methodData);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao guardar método de envio: ${err.message}`);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Tens a certeza que desejas eliminar este método de envio?')) return;
    try {
      const { error } = await supabase.from('shipping_methods').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Erro ao eliminar método de envio: ${err.message}`);
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
          <h1 className="text-[24px] font-[600] tracking-tight text-[var(--color-text-dark)]">Frete e Envio</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Configura as opções de entrega para os teus clientes.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[var(--color-shopify-green)] text-white px-4 py-2 rounded-md font-[600] text-[13px] flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4.5 h-4.5" /> Adicionar Opção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shippingMethods.map((method) => (
          <div key={method.id} className={`bg-white rounded-xl border-2 transition-all p-6 relative ${method.active ? 'border-[var(--color-border)] shadow-[var(--shadow-card)]' : 'border-dashed border-gray-200 grayscale opacity-70'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method.active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(method)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[var(--color-shopify-green)] transition-all">
                  <Edit2 className="w-4.5 h-4.5" />
                </button>
                <button onClick={() => handleDeleteMethod(method.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all">
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
            
            <h3 className="text-[16px] font-bold text-[var(--color-text-dark)] mb-1">{method.name}</h3>
            <p className="text-[13px] text-[var(--color-text-muted)] line-clamp-2 mb-6 h-10">{method.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--color-text-dark)]">
                <Euro className="w-4 h-4 text-gray-400" />
                <span>{Number(method.cost) === 0 ? 'Grátis' : `€ ${Number(method.cost).toFixed(2)}`}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--color-text-dark)]">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{method.delivery_time}</span>
              </div>
              {method.min_order_for_free && (
                <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--color-shopify-green)]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grátis em pedidos {'>'} € {Number(method.min_order_for_free).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${method.active ? 'text-green-600' : 'text-gray-400'}`}>
                {method.active ? 'Disponível' : 'Indisponível'}
              </span>
              <div className={`w-2 h-2 rounded-full ${method.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        ))}
        {shippingMethods.length === 0 && (
          <div className="col-span-full py-20 bg-[var(--color-gray-50)] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
              <Truck className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-dark)]">Sem métodos de envio</h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm mt-1">Cria opções de envio para começar a vender.</p>
            <button onClick={() => openModal()} className="mt-6 text-[13px] font-bold text-[var(--color-shopify-green)] hover:underline">Adicionar a minha primeira opção</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[var(--color-gray-50)]">
                 <h2 className="text-lg font-bold">{editingMethod ? 'Editar Opção de Envio' : 'Nova Opção de Envio'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                   <X className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                 <div>
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Nome da Opção</label>
                    <input required type="text" placeholder="EX: Envio Standard" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-lg focus:outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Descrição Curta</label>
                    <textarea required rows={2} placeholder="EX: Entrega em mão." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-lg focus:outline-none" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-5">
                   <div>
                     <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Custo (€)</label>
                     <input required type="number" step="0.01" min="0" placeholder="0.00" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-lg focus:outline-none" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Tempo de Entrega</label>
                     <input required type="text" placeholder="EX: 2-3 dias úteis" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-lg focus:outline-none" />
                   </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Grátis a partir de (€)</label>
                    <input type="number" step="0.01" min="0" placeholder="Opcional" value={formData.minOrderForFree} onChange={e => setFormData({...formData, minOrderForFree: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-lg focus:outline-none" />
                 </div>

                 <div className="flex items-center gap-2 py-2">
                    <input type="checkbox" id="method-active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4" />
                    <label htmlFor="method-active" className="text-sm font-medium cursor-pointer">Opção Ativa</label>
                 </div>
                 
                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-[13px] hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 bg-[var(--color-text-dark)] text-white font-bold text-[13px] rounded-lg">Guardar Configuração</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
