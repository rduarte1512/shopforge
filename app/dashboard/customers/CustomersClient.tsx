'use client';

import { useMemo, useState } from 'react';
import { Users, Mail, ShoppingBag, Euro, Calendar, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import { removeCustomerAction, updateCustomerDetailsAction } from '@/lib/order-management-actions';

interface Customer {
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
}

interface CustomersClientProps {
  initialOrders: any[];
  selectedStoreId: string | null;
}

export default function CustomersClient({ initialOrders, selectedStoreId }: CustomersClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    
    orders.forEach(order => {
      const email = String(order.customer_email || '').toLowerCase();
      if (!email) return;

      const existing = customerMap.get(email);
      
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += Number(order.total || 0);
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
        if (new Date(order.created_at) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.created_at;
        }
      } else {
        customerMap.set(email, {
          email: order.customer_email,
          name: order.customer_name || 'Cliente',
          totalOrders: 1,
          totalSpent: Number(order.total || 0),
          lastOrderDate: order.created_at,
          firstOrderDate: order.created_at
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
  }, [orders]);

  const stats = useMemo(() => {
    return {
      totalCustomers: customers.length,
      totalRevenue: customers.reduce((acc, c) => acc + c.totalSpent, 0),
      avgOrdersPerCustomer: customers.length > 0 
        ? (customers.reduce((acc, c) => acc + c.totalOrders, 0) / customers.length).toFixed(1)
        : 0
    };
  }, [customers]);

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditData({ name: customer.name, email: customer.email });
  };

  const saveCustomer = async () => {
    if (!selectedStoreId || !selectedCustomer) return;
    setSaving(true);

    try {
      const result = await updateCustomerDetailsAction(selectedStoreId, selectedCustomer.email, editData);
      if (!result?.success) throw new Error(result?.error || 'Erro ao editar cliente.');

      setOrders(prev => prev.map(order => String(order.customer_email || '').toLowerCase() === selectedCustomer.email.toLowerCase()
        ? { ...order, customer_name: editData.name, customer_email: editData.email }
        : order
      ));
      setSelectedCustomer(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao editar cliente.');
    } finally {
      setSaving(false);
    }
  };

  const removeCustomer = async (customer: Customer) => {
    if (!selectedStoreId) return;
    const ok = confirm(`Eliminar o cliente ${customer.name}?`);
    if (!ok) return;

    try {
      const result = await removeCustomerAction(selectedStoreId, customer.email);
      if (!result?.success) throw new Error(result?.error || 'Erro ao eliminar cliente.');
      setOrders(prev => prev.filter(order => String(order.customer_email || '').toLowerCase() !== customer.email.toLowerCase()));
      if (selectedCustomer?.email === customer.email) setSelectedCustomer(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar cliente.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] font-[600] tracking-tight text-text-dark">Clientes</h1>
        <p className="text-[14px] text-text-muted mt-1">Gerencie os clientes que compraram na sua loja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[8px] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] text-text-muted">Total de Clientes</p>
              <p className="text-[20px] font-[600] text-text-dark">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[8px] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[12px] text-text-muted">Receita Total</p>
              <p className="text-[20px] font-[600] text-text-dark">€ {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[8px] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[12px] text-text-muted">Média de Encomendas</p>
              <p className="text-[20px] font-[600] text-text-dark">{stats.avgOrdersPerCustomer}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[8px] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-5 overflow-x-auto">
        <table className="w-full border-collapse min-w-[760px]">
          <thead>
            <tr>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Cliente</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Email</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Encomendas</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Total Gasto</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Última Encomenda</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Primeira Encomenda</th>
              <th className="text-right text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.email}>
                <td className="py-3 border-b border-[#F1F1F1] text-[13px] font-[500] text-text-dark align-middle">
                  {customer.name}
                </td>
                <td className="py-3 border-b border-[#F1F1F1] align-middle">
                  <div className="flex items-center gap-2 text-[13px] text-text-muted">
                    <Mail className="w-3 h-3" />
                    {customer.email}
                  </div>
                </td>
                <td className="py-3 border-b border-[#F1F1F1] text-[13px] text-text-dark align-middle">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-[11px] font-[600]">
                    {customer.totalOrders} encomenda{customer.totalOrders > 1 ? 's' : ''}
                  </span>
                </td>
                <td className="py-3 border-b border-[#F1F1F1] text-[13px] font-[600] text-text-dark align-middle">
                  € {customer.totalSpent.toFixed(2)}
                </td>
                <td className="py-3 border-b border-[#F1F1F1] text-[13px] text-text-muted align-middle">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(customer.lastOrderDate).toLocaleDateString('pt-PT')}
                  </div>
                </td>
                <td className="py-3 border-b border-[#F1F1F1] text-[13px] text-text-muted align-middle">
                  {new Date(customer.firstOrderDate).toLocaleDateString('pt-PT')}
                </td>
                <td className="py-3 border-b border-[#F1F1F1] align-middle">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(customer)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar cliente">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeCustomer(customer)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar cliente">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[13px] text-text-muted border-b border-[#F1F1F1]">
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                    Ainda não tem clientes.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black">Editar Cliente</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Atualiza os dados do cliente</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-500">Nome</span>
                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-500">Email</span>
                <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary" />
              </label>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setSelectedCustomer(null)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={saveCustomer} disabled={saving} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
