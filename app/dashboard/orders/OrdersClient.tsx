'use client';

import { useState } from 'react';
import { Package, Eye, CheckCircle2, Truck, X, Search, Filter, Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard';
import { getStoreOrdersAction, updateOrderStatusAction } from '@/lib/actions';
import { removeOrderAction, updateOrderDetailsAction } from '@/lib/order-management-actions';

interface OrdersClientProps {
  initialOrders: any[];
  selectedStoreId: string | null;
}

const emptyEditOrder = {
  customer_name: '',
  customer_email: '',
  status: 'pending',
  subtotal: 0,
  shipping_cost: 0,
  discount_amount: 0,
  total: 0,
  payment_method_type: '',
  payment_instructions: '',
};

export default function OrdersClient({ initialOrders, selectedStoreId }: OrdersClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(emptyEditOrder);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshOrders = async () => {
    if (!selectedStoreId) return;
    try {
      const ordersData = await getStoreOrdersAction(selectedStoreId);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatusAction(orderId, status);
      
      if (status === 'paid') {
        fetch('/api/affiliates/commission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        }).catch(console.error);
      }
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      
      refreshOrders();
    } catch (err: any) {
      alert(`Erro ao atualizar estado: ${err.message}`);
    }
  };

  const openEdit = (order: any) => {
    setSelectedOrder(order);
    setEditOrder({
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      status: order.status || 'pending',
      subtotal: Number(order.subtotal || 0),
      shipping_cost: Number(order.shipping_cost || 0),
      discount_amount: Number(order.discount_amount || 0),
      total: Number(order.total || 0),
      payment_method_type: order.payment_method_type || '',
      payment_instructions: order.payment_instructions || '',
    });
    setIsEditOpen(true);
  };

  const saveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const result = await updateOrderDetailsAction(selectedOrder.id, editOrder);
      if (!result?.success) throw new Error(result?.error || 'Erro ao editar encomenda.');
      await refreshOrders();
      setIsEditOpen(false);
      setSelectedOrder(result.order || { ...selectedOrder, ...editOrder });
    } catch (err: any) {
      alert(err.message || 'Erro ao editar encomenda.');
    } finally {
      setSaving(false);
    }
  };

  const removeOrder = async (order: any) => {
    const ok = confirm(`Eliminar a encomenda #${String(order.id).slice(0, 8).toUpperCase()}? Esta ação também remove os itens desta encomenda.`);
    if (!ok) return;

    try {
      const result = await removeOrderAction(order.id);
      if (!result?.success) throw new Error(result?.error || 'Erro ao eliminar encomenda.');
      setOrders(prev => prev.filter(item => item.id !== order.id));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
        setIsModalOpen(false);
        setIsEditOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar encomenda.');
    }
  };

  const filteredOrders = orders.filter(o => 
    String(o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(o.id || '').includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-text-dark">Encomendas</h1>
          <p className="text-[14px] text-text-muted mt-1">Gere as vendas e o estado das entregas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar encomenda..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-[12px] font-[600] text-text-muted py-4 px-6 border-b border-gray-100 uppercase">Encomenda</th>
                <th className="text-left text-[12px] font-[600] text-text-muted py-4 px-6 border-b border-gray-100 uppercase">Cliente</th>
                <th className="text-left text-[12px] font-[600] text-text-muted py-4 px-6 border-b border-gray-100 uppercase">Data</th>
                <th className="text-left text-[12px] font-[600] text-text-muted py-4 px-6 border-b border-gray-100 uppercase">Total</th>
                <th className="text-left text-[12px] font-[600] text-text-muted py-4 px-6 border-b border-gray-100 uppercase">Estado</th>
                <th className="text-right text-[12px] font-[600] text-text-muted py-4 px-6 border-b border-gray-100 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-[13px] font-bold text-gray-900">
                    #{String(order.id).slice(0, 8).toUpperCase()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-[13px] font-[600] text-text-dark">{order.customer_name}</div>
                    <div className="text-[11px] text-text-muted">{order.customer_email}</div>
                  </td>
                  <td className="py-4 px-6 text-[13px] text-text-muted">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-[13px] font-bold text-text-dark">
                    € {Number(order.total).toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-[11px] font-[700] uppercase rounded-full px-3 py-1 border-none focus:ring-0 cursor-pointer transition-all ${
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'paid' ? 'bg-green-100 text-green-700' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                      </select>
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'paid')}
                          className="p-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                          title="Marcar como Pago"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => openEdit(order)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => removeOrder(order)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Package className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Sem encomendas</h3>
              <p className="text-sm text-gray-500">Não foram encontradas encomendas com estes critérios.</p>
            </div>
          )}
        </div>
      </div>

      {isEditOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black">Editar Encomenda</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">#{String(selectedOrder.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Nome do cliente</span>
                <input value={editOrder.customer_name} onChange={e => setEditOrder({ ...editOrder, customer_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Email</span>
                <input type="email" value={editOrder.customer_email} onChange={e => setEditOrder({ ...editOrder, customer_email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Estado</span>
                <select value={editOrder.status} onChange={e => setEditOrder({ ...editOrder, status: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary">
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Método de pagamento</span>
                <input value={editOrder.payment_method_type} onChange={e => setEditOrder({ ...editOrder, payment_method_type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Subtotal</span>
                <input type="number" step="0.01" value={editOrder.subtotal} onChange={e => setEditOrder({ ...editOrder, subtotal: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Envio</span>
                <input type="number" step="0.01" value={editOrder.shipping_cost} onChange={e => setEditOrder({ ...editOrder, shipping_cost: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Desconto</span>
                <input type="number" step="0.01" value={editOrder.discount_amount} onChange={e => setEditOrder({ ...editOrder, discount_amount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">Total</span>
                <input type="number" step="0.01" value={editOrder.total} onChange={e => setEditOrder({ ...editOrder, total: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-bold text-gray-500">Instruções de pagamento</span>
                <textarea value={editOrder.payment_instructions || ''} onChange={e => setEditOrder({ ...editOrder, payment_instructions: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsEditOpen(false)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={saveOrder} disabled={saving} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                 <h2 className="text-xl font-black">Detalhes da Encomenda</h2>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">#{selectedOrder.id}</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Atual</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                
                <div className="flex gap-2">
                   {selectedOrder.status === 'pending' && (
                     <button 
                       onClick={() => updateStatus(selectedOrder.id, 'paid')}
                       className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:scale-105 transition-all"
                     >
                       <CheckCircle2 className="w-4 h-4" /> Marcar como Pago
                     </button>
                   )}
                   {selectedOrder.status === 'paid' && (
                     <button 
                       onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
                     >
                       <Truck className="w-4 h-4" /> Marcar como Enviado
                     </button>
                   )}
                   <button onClick={() => openEdit(selectedOrder)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all">
                    <Pencil className="w-4 h-4" /> Editar
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Cliente</h3>
                  <div>
                    <p className="font-bold text-lg">{selectedOrder.customer_name}</p>
                    <p className="text-gray-500 font-medium">{selectedOrder.customer_email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pagamento</h3>
                  <div>
                    <p className="font-bold">{selectedOrder.payment_method_type?.toUpperCase() || 'Multibanco'}</p>
                    <p className="text-xs text-gray-400">Moeda: {selectedOrder.currency}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Itens da Encomenda</h3>
                <div className="divide-y divide-gray-100 border rounded-2xl overflow-hidden bg-white">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.product?.image_url && <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.product?.name || 'Produto'}</p>
                          <p className="text-xs text-gray-400">{item.quantity}x €{Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="font-black">€{(item.quantity * Number(item.price)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col items-end space-y-2">
                <div className="flex justify-between w-48 text-sm font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-black">€{Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48 text-sm font-medium text-gray-500">
                  <span>Envio</span>
                  <span className="text-black">€{Number(selectedOrder.shipping_cost).toFixed(2)}</span>
                </div>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between w-48 text-sm font-bold text-green-600">
                    <span>Desconto</span>
                    <span>- €{Number(selectedOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 pt-4 border-t border-gray-100">
                  <span className="font-black text-lg">Total</span>
                  <span className="font-black text-xl">€{Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button onClick={() => removeOrder(selectedOrder)} className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
