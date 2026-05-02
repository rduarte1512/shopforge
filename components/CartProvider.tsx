'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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
