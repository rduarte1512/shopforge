'use client';

import { useMemo } from 'react';
import { Users, Mail, ShoppingBag, Euro, Calendar } from 'lucide-react';

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
}

export default function CustomersClient({ initialOrders }: CustomersClientProps) {
  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    
    initialOrders.forEach(order => {
      const existing = customerMap.get(order.customer_email);
      
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += Number(order.total);
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
        if (new Date(order.created_at) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.created_at;
        }
      } else {
        customerMap.set(order.customer_email, {
          email: order.customer_email,
          name: order.customer_name,
          totalOrders: 1,
          totalSpent: Number(order.total),
          lastOrderDate: order.created_at,
          firstOrderDate: order.created_at
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
  }, [initialOrders]);

  const stats = useMemo(() => {
    return {
      totalCustomers: customers.length,
      totalRevenue: customers.reduce((acc, c) => acc + c.totalSpent, 0),
      avgOrdersPerCustomer: customers.length > 0 
        ? (customers.reduce((acc, c) => acc + c.totalOrders, 0) / customers.length).toFixed(1)
        : 0
    };
  }, [customers]);

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
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Cliente</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Email</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Encomendas</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Total Gasto</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Última Encomenda</th>
              <th className="text-left text-[12px] text-text-muted py-3 border-b border-[var(--color-border)] font-normal">Primeira Encomenda</th>
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
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[13px] text-text-muted border-b border-[#F1F1F1]">
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
    </div>
  );
}
