'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { supabase, isSupabaseConfigured, type Store, type Product, type Order, type Coupon, type ShippingMethod } from './supabase';

interface UseSupabaseDBReturn {
  stores: Store[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  shippingMethods: ShippingMethod[];
  loading: boolean;
  selectedStoreId: string | null;
  setSelectedStore: (id: string | null) => void;
  addStore: (store: Partial<Store>) => Promise<void>;
  updateStore: (id: string, data: Partial<Store>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOrder: (order: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  addCoupon: (coupon: Partial<Coupon>) => Promise<void>;
  updateCoupon: (id: string, data: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  addShippingMethod: (method: Partial<ShippingMethod>) => Promise<void>;
  updateShippingMethod: (id: string, data: Partial<ShippingMethod>) => Promise<void>;
  deleteShippingMethod: (id: string) => Promise<void>;
}

export function useSupabaseDB(): UseSupabaseDBReturn {
  const { user, session } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const isConnected = isSupabaseConfigured && session !== null;

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    async function loadData() {
      if (!supabase || !user) return;

      try {
        const [storesRes, productsRes, ordersRes, couponsRes, shippingRes] = await Promise.all([
          supabase.from('stores').select('*').eq('user_id', user.id),
          supabase.from('products').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('coupons').select('*'),
          supabase.from('shipping_methods').select('*'),
        ]);

        if (storesRes.data) setStores(storesRes.data);
        if (productsRes.data) setProducts(productsRes.data);
        if (ordersRes.data) setOrders(ordersRes.data);
        if (couponsRes.data) setCoupons(couponsRes.data);
        if (shippingRes.data) setShippingMethods(shippingRes.data);

        if (storesRes.data && storesRes.data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(storesRes.data[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, session, isConnected]);

  const setSelectedStore = useCallback((id: string | null) => {
    setSelectedStoreId(id);
    if (id) {
      localStorage.setItem('selectedStoreId', id);
    }
  }, []);

  const addStore = useCallback(async (store: Partial<Store>) => {
    if (!isConnected || !supabase || !user) return;

    const newStore = {
      user_id: user.id,
      name: store.name || 'Nova Loja',
      domain: store.domain || `loja-${Date.now()}`,
      description: store.description || '',
      theme: store.theme || 'light',
      primary_color: store.primary_color || '#008060',
      phone: store.phone || '',
      email: store.email || user.email,
      address: store.address || '',
      business_hours: store.business_hours || '',
      currency: store.currency || 'EUR',
      currency_symbol: store.currency_symbol || '€',
      base_currency: store.base_currency || 'EUR',
      return_policy: store.return_policy || '',
      terms_and_conditions: store.terms_and_conditions || '',
      privacy_policy: store.privacy_policy || '',
      low_stock_threshold: store.low_stock_threshold || 10,
      notify_low_stock: store.notify_low_stock ?? true,
      logo_url: store.logo_url || '',
      banner_url: store.banner_url || '',
      favicon_url: store.favicon_url || '',
      secondary_color: store.secondary_color || '#2D3748',
      meta_title: store.meta_title || '',
      meta_description: store.meta_description || '',
      notify_new_order: store.notify_new_order ?? true,
      notify_order_status: store.notify_order_status ?? true,
    };

    const { data, error } = await supabase.from('stores').insert(newStore).select().single();
    if (error) throw error;
    if (data) setStores(prev => [...prev, data]);
  }, [isConnected, user]);

  const updateStore = useCallback(async (id: string, data: Partial<Store>) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('stores').update(data).eq('id', id);
    if (error) throw error;
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, [isConnected]);

  const deleteStore = useCallback(async (id: string) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) throw error;
    setStores(prev => prev.filter(s => s.id !== id));
    if (selectedStoreId === id) setSelectedStoreId(null);
  }, [isConnected, selectedStoreId, setSelectedStore]);

  const addProduct = useCallback(async (product: Partial<Product>) => {
    if (!isConnected || !supabase || !selectedStoreId) return;

    const newProduct = {
      store_id: selectedStoreId,
      name: product.name || 'Novo Produto',
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price || 0,
      compare_at_price: product.compare_at_price || null,
      cost_per_item: product.cost_per_item || null,
      stock: product.stock || 0,
      sku: product.sku || `PRD-${Date.now()}`,
      barcode: product.barcode || null,
      weight: product.weight || null,
      image_url: product.image_url || 'https://picsum.photos/seed/product/400/500',
      images: product.images || [],
      category: product.category || 'Geral',
      tags: product.tags || [],
      material: product.material || null,
      brand: product.brand || null,
      specifications: product.specifications || null,
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      track_inventory: product.track_inventory ?? true,
      allow_out_of_stock_purchase: product.allow_out_of_stock_purchase ?? false,
    };

    const { data, error } = await supabase.from('products').insert(newProduct).select().single();
    if (error) throw error;
    if (data) setProducts(prev => [...prev, data]);
  }, [isConnected, selectedStoreId]);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('products').update(data).eq('id', id);
    if (error) throw error;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, [isConnected]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [isConnected]);

  const addOrder = useCallback(async (order: Partial<Order>) => {
    if (!isConnected || !supabase || !selectedStoreId) return;

    const { items, ...orderData } = {
      store_id: selectedStoreId,
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      status: order.status || 'pending',
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      shipping_cost: order.shipping_cost || 0,
      discount_amount: order.discount_amount || 0,
      coupon_id: order.coupon_id || null,
      shipping_method_id: order.shipping_method_id || null,
      currency: order.currency || 'EUR',
      payment_method_id: order.payment_method_id || null,
      payment_method_type: order.payment_method_type || null,
      payment_instructions: order.payment_instructions || null,
    };

    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    if (orderResult && items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        order_id: orderResult.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;
      
      // Update local state with items
      const completeOrder = { ...orderResult, items };
      setOrders(prev => [...prev, completeOrder as Order]);
    } else if (orderResult) {
      setOrders(prev => [...prev, orderResult as Order]);
    }
  }, [isConnected, selectedStoreId]);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw error;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, [isConnected]);

  const addCoupon = useCallback(async (coupon: Partial<Coupon>) => {
    if (!isConnected || !supabase || !selectedStoreId) return;

    const newCoupon = {
      store_id: selectedStoreId,
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 0,
      min_purchase: coupon.min_purchase || 0,
      max_uses: coupon.max_uses || null,
      used_count: 0,
      expiry_date: coupon.expiry_date || null,
      active: coupon.active ?? true,
    };

    const { data, error } = await supabase.from('coupons').insert(newCoupon).select().single();
    if (error) throw error;
    if (data) setCoupons(prev => [...prev, data]);
  }, [isConnected, selectedStoreId]);

  const updateCoupon = useCallback(async (id: string, data: Partial<Coupon>) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('coupons').update(data).eq('id', id);
    if (error) throw error;
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, [isConnected]);

  const deleteCoupon = useCallback(async (id: string) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    setCoupons(prev => prev.filter(c => c.id !== id));
  }, [isConnected]);

  const addShippingMethod = useCallback(async (method: Partial<ShippingMethod>) => {
    if (!isConnected || !supabase || !selectedStoreId) return;

    const newMethod = {
      store_id: selectedStoreId,
      name: method.name || '',
      description: method.description || '',
      cost: method.cost || 0,
      min_order_for_free: method.min_order_for_free || null,
      delivery_time: method.delivery_time || '',
      active: method.active ?? true,
    };

    const { data, error } = await supabase.from('shipping_methods').insert(newMethod).select().single();
    if (error) throw error;
    if (data) setShippingMethods(prev => [...prev, data]);
  }, [isConnected, selectedStoreId]);

  const updateShippingMethod = useCallback(async (id: string, data: Partial<ShippingMethod>) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('shipping_methods').update(data).eq('id', id);
    if (error) throw error;
    setShippingMethods(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, [isConnected]);

  const deleteShippingMethod = useCallback(async (id: string) => {
    if (!isConnected || !supabase) return;

    const { error } = await supabase.from('shipping_methods').delete().eq('id', id);
    if (error) throw error;
    setShippingMethods(prev => prev.filter(m => m.id !== id));
  }, [isConnected]);

  return {
    stores,
    products,
    orders,
    coupons,
    shippingMethods,
    loading,
    selectedStoreId,
    setSelectedStore,
    addStore,
    updateStore,
    deleteStore,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    updateOrderStatus,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    addShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
  };
}