'use client';

import { useState, useEffect } from 'react';
import { Bell, Package, AlertCircle, ShoppingCart, CheckCircle, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMockDB } from '@/lib/store';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'low_stock' | 'order' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export function NotificationPanel() {
  const { user } = useAuth();
  const { selectedStoreId } = useMockDB();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStockNotifications = async () => {
    if (!user || !supabase || !selectedStoreId) return [];

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('store_id', selectedStoreId)
        .lt('stock', 5); // Default threshold of 5

      if (error) throw error;

      return (products || []).map(p => ({
        id: `low-stock-${p.id}`,
        type: 'low_stock' as const,
        title: 'Stock Baixo',
        message: `O produto "${p.name}" tem apenas ${p.stock} unidades.`,
        timestamp: new Date(),
        read: false,
        link: '/dashboard/products'
      }));
    } catch (err) {
      console.error('Error fetching low stock notifications:', err);
      return [];
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    const lowStock = await fetchLowStockNotifications();
    
    // In a real app, we would fetch from a notifications table
    // For now, we'll combine low stock with some mock system notifications
    const mockNotifications: Notification[] = [
      {
        id: 'welcome',
        type: 'system',
        title: 'Bem-vindo ao ShopForge',
        message: 'A sua loja está pronta para começar a vender.',
        timestamp: new Date(Date.now() - 3600000 * 24),
        read: true,
      }
    ];

    setNotifications([...lowStock, ...mockNotifications]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, selectedStoreId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-all text-text-secondary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-card-bg">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-[350px] bg-white rounded-3xl shadow-2xl border border-border overflow-hidden z-50"
            >
              <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-sm uppercase tracking-widest text-text-primary">Notificações</h3>
                <button 
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Marcar todas como lidas
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-10 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[11px] font-bold text-text-muted">A carregar...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 hover:bg-slate-50 transition-colors flex gap-4 ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          n.type === 'low_stock' ? 'bg-orange-100 text-orange-600' :
                          n.type === 'order' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'low_stock' ? <Package className="w-5 h-5" /> :
                           n.type === 'order' ? <ShoppingCart className="w-5 h-5" /> :
                           <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-[13px] font-black text-text-primary">{n.title}</p>
                            <span className="text-[9px] font-bold text-text-muted">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[12px] text-text-secondary leading-snug line-clamp-2 mb-2">{n.message}</p>
                          {n.link && (
                            <Link 
                              href={n.link} 
                              onClick={() => setIsOpen(false)}
                              className="text-[10px] font-black text-primary flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-widest"
                            >
                              Ver detalhes <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[12px] font-bold text-text-muted">Tudo em dia! Nenhuma notificação nova.</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-border text-center">
                  <button className="text-[11px] font-black text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">
                    Ver Histórico Completo
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
