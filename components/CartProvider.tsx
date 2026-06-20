'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { deleteAbandonedCartBySessionAction, saveAbandonedCartAction } from '@/lib/abandoned-cart-actions';

type CartItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, variantId?: string | null) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [], 
  addItem: () => {}, 
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {}, 
  cartCount: 0
});

export const useCart = () => useContext(CartContext);

function getSessionId(storeKey: string) {
  const storageKey = `shopforge-cart-session-${storeKey}`;
  const existing = localStorage.getItem(storageKey);

  if (existing) return existing;

  const generated = `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, generated);
  return generated;
}

export function CartProvider({ children, storeId, storeDomain }: { children: ReactNode; storeId?: string; storeDomain?: string }) {
  const storeKey = storeId || storeDomain || 'global';
  const cartStorageKey = useMemo(() => `shopforge-cart-${storeKey}`, [storeKey]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed.filter(item => item?.productId && Number(item?.quantity) > 0));
        }
      }
    } catch (error) {
      console.warn('Could not restore cart:', error);
    } finally {
      setHydrated(true);
    }
  }, [cartStorageKey]);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));

    if (!storeId) return;

    const sessionId = getSessionId(storeKey);

    if (cartItems.length === 0) {
      deleteAbandonedCartBySessionAction(storeId, sessionId).catch(console.error);
      return;
    }

    const timeout = window.setTimeout(() => {
      saveAbandonedCartAction({
        store_id: storeId,
        session_id: sessionId,
        items: cartItems
      }).catch(console.error);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [cartItems, cartStorageKey, hydrated, storeId, storeKey]);

  const addItem = (productId: string, variantId?: string | null) => {
    setCartItems(prev => {
      const key = `${productId}-${variantId || 'base'}`;
      const existing = prev.find(i => `${i.productId}-${i.variantId || 'base'}` === key);
      if (existing) {
        return prev.map(i => `${i.productId}-${i.variantId || 'base'}` === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId, variantId: variantId || null, quantity: 1 }];
    });
  };

  const removeItem = (productId: string, variantId?: string | null) => {
    setCartItems(prev => prev.filter(i => !(i.productId === productId && (i.variantId || null) === (variantId || null))));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string | null) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setCartItems(prev => {
      const key = `${productId}-${variantId || 'base'}`;
      return prev.map(i => `${i.productId}-${i.variantId || 'base'}` === key ? { ...i, quantity } : i);
    });
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items: cartItems, addItem, removeItem, updateQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}
