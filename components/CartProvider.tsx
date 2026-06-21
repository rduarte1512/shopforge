'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { saveAbandonedCartAction } from '@/lib/abandoned-cart-actions';

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
  cartCount: 0,
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

function getStoredCustomer(storeId?: string) {
  if (!storeId) return null;

  try {
    const saved = localStorage.getItem(`shopforge-store-customer-${storeId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getCartSignature(items: CartItem[]) {
  return JSON.stringify(
    items
      .filter((item) => item?.productId && Number(item?.quantity) > 0)
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: Number(item.quantity),
      }))
      .sort((a, b) => `${a.productId}-${a.variantId || 'base'}`.localeCompare(`${b.productId}-${b.variantId || 'base'}`))
  );
}

export function CartProvider({ children, storeId, storeDomain }: { children: ReactNode; storeId?: string; storeDomain?: string }) {
  const storeKey = storeId || storeDomain || 'global';
  const cartStorageKey = useMemo(() => `shopforge-cart-${storeKey}`, [storeKey]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastSavedSignatureRef = useRef('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(item => item?.productId && Number(item?.quantity) > 0);
          setCartItems(validItems);
          lastSavedSignatureRef.current = getCartSignature(validItems);
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

    if (!storeId || cartItems.length === 0) {
      lastSavedSignatureRef.current = '';
      return;
    }

    const signature = getCartSignature(cartItems);
    if (signature === lastSavedSignatureRef.current) return;

    const sessionId = getSessionId(storeKey);

    const timeout = window.setTimeout(() => {
      const customer = getStoredCustomer(storeId);

      saveAbandonedCartAction({
        store_id: storeId,
        session_id: sessionId,
        customer_email: customer?.email || null,
        customer_name: customer?.name || null,
        items: cartItems,
      })
        .then((result) => {
          if (result?.success) lastSavedSignatureRef.current = signature;
        })
        .catch(console.error);
    }, 3000);

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
