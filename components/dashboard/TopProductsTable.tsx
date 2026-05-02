'use client';
import { motion } from 'motion/react';
import { ArrowUpRight, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';

interface TopProduct {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  stock: number;
  status: 'low_stock' | 'in_stock';
  image: string;
}

interface TopProductsTableProps {
  topProducts: TopProduct[];
  loading: boolean;
}

export function TopProductsTable({ topProducts, loading }: TopProductsTableProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-card-bg rounded-2xl border border-border shadow-sm overflow-hidden mt-8"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="h-6 bg-bg-gray rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-bg-gray rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-bg-gray rounded w-48 mb-2"></div>
                  <div className="h-3 bg-bg-gray rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card-bg rounded-2xl border border-border shadow-sm overflow-hidden mt-8"
    >
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Produtos Mais Vendidos</h3>
          <p className="text-sm text-text-muted">Top 4 produtos por volume de vendas</p>
        </div>
        <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
          Ver todos <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg-gray/50">
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Produto</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Vendas</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Receita</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              topProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-bg-gray relative">
                        <Image 
                          src={product.image} 
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm font-bold text-text-primary">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-bg-gray text-text-secondary rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-text-secondary">{product.sales}</td>
                  <td className="px-6 py-4 text-sm font-bold text-text-primary">{formatCurrency(product.revenue)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        product.status === 'in_stock' ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-sm font-medium text-text-secondary">{product.stock} un.</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-bg-gray rounded-lg transition-colors text-text-muted">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
