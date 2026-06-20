'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { getAbandonedCartsAction } from '@/lib/abandoned-cart-actions';
import CartsClient from './CartsClient';

export default function CartsPage() {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [carts, setCarts] = useState<any[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    async function loadCarts() {
      const selectedStoreId = localStorage.getItem('selectedStoreId');
      setStoreId(selectedStoreId);

      if (!selectedStoreId) {
        setLoading(false);
        return;
      }

      const result = await getAbandonedCartsAction(selectedStoreId);
      setCarts(result?.carts || []);
      setNeedsSetup(Boolean(result?.needsSetup));
      setLoading(false);
    }

    loadCarts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-border">
        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-black mb-2">Selecione uma loja primeiro</h1>
        <p className="text-sm text-text-muted">Depois poderá ver os carrinhos guardados dessa loja.</p>
      </div>
    );
  }

  return <CartsClient initialCarts={carts} selectedStoreId={storeId} needsSetup={needsSetup} />;
}
