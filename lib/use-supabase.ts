'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { supabase, isSupabaseConfigured } from './supabase';
import { type Store, type Product, type Order, type Coupon, type ShippingMethod } from './supabase';

interface UseSupabaseDBReturn {
  stores: Store[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  shippingMethods: ShippingMethod[];
  loading: boolean;
  storesLoading: boolean;
  dataLoading: boolean;
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
  refreshData: () => Promise<void>;
}

export function useSupabaseDB(): UseSupabaseDBReturn {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  
  const [storesLoading, setStoresLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const isConnected = isSupabaseConfigured && !!supabase;
  const storeFetchedRef = useRef(false);

  // Fetch Stores Function
  const fetchStores = useCallback(async () => {
    if (!isConnected || !user) return;
    
    try {
      const { data, error } = await supabase!
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storesData = data as Store[];
      setStores(storesData);
    } catch (err) {
      console.error("Error fetching stores:", err);
    } finally {
      setStoresLoading(false);
    }
  }, [isConnected, user?.id]); // Only depend on user.id

  // Fetch Store Data Function
  const fetchStoreData = useCallback(async (storeId: string) => {
    if (!isConnected || !storeId) return;
    
    try {
      const [
        { data: pData },
        { data: oData },
        { data: cData },
        { data: sData }
      ] = await Promise.all([
        supabase!.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
        supabase!.from('orders').select('*, items:order_items(*)').eq('store_id', storeId).order('created_at', { ascending: false }),
        supabase!.from('coupons').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
        supabase!.from('shipping_methods').select('*').eq('store_id', storeId).order('created_at', { ascending: false })
      ]);

      setProducts(pData as Product[] || []);
      setOrders(oData as Order[] || []);
      setCoupons(cData as Coupon[] || []);
      setShippingMethods(sData as ShippingMethod[] || []);
    } catch (err) {
      console.error("Error fetching store data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [isConnected]);

  // Initial Load
  useEffect(() => {
    if (isConnected && user?.id && !storeFetchedRef.current) {
      fetchStores();
      storeFetchedRef.current = true;
    }
  }, [isConnected, user?.id, fetchStores]);

  // Load Data when store changes
  const lastStoreIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedStoreId && selectedStoreId !== lastStoreIdRef.current) {
      setDataLoading(true);
      fetchStoreData(selectedStoreId);
      lastStoreIdRef.current = selectedStoreId;
    } else if (!selectedStoreId) {
      setProducts([]);
      setOrders([]);
      setCoupons([]);
      setShippingMethods([]);
      lastStoreIdRef.current = null;
    }
  }, [selectedStoreId, fetchStoreData]);

  // Realtime Subscriptions (Simplified to avoid loops)
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const storesChannel = supabase!
      .channel(`stores_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores', filter: `user_id=eq.${user.id}` }, () => {
        // Use a slight delay or simple fetch without state dependency
        supabase!.from('stores').select('*').eq('user_id', user.id).then(({ data }) => {
          if (data) setStores(data as Store[]);
        });
      })
      .subscribe();

    let detailsChannel: any = null;
    if (selectedStoreId) {
      detailsChannel = supabase!
        .channel(`details_${selectedStoreId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${selectedStoreId}` }, () => fetchStoreData(selectedStoreId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${selectedStoreId}` }, () => fetchStoreData(selectedStoreId))
        .subscribe();
    }

    return () => {
      supabase?.removeChannel(storesChannel);
      if (detailsChannel) supabase?.removeChannel(detailsChannel);
    };
  }, [isConnected, user?.id, selectedStoreId]); // Stable dependencies

  const setSelectedStore = useCallback((id: string | null) => {
    setSelectedStoreId(id);
    if (id) {
      localStorage.setItem('selectedStoreId', id);
    } else {
      localStorage.removeItem('selectedStoreId');
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (selectedStoreId) {
      await fetchStoreData(selectedStoreId);
    }
    await fetchStores();
  }, [selectedStoreId, fetchStoreData, fetchStores]);

  // Mutation functions (add, update, delete)
  const addStore = useCallback(async (store: Partial<Store>) => {
    if (!isConnected || !user) return;
    const { error } = await supabase!.from('stores').insert([{
      user_id: user.id,
      name: store.name || 'Nova Loja',
      domain: store.domain || `loja-${Date.now()}`,
      description: store.description || '',
      theme: store.theme || 'light',
      primary_color: store.primary_color || '#008060',
      base_currency: store.base_currency || 'EUR',
    }]);
    if (error) console.error("Error adding store:", error);
  }, [isConnected, user]);

  const updateStore = useCallback(async (id: string, data: Partial<Store>) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('stores').update(data).eq('id', id);
    if (error) console.error("Error updating store:", error);
  }, [isConnected]);

  const deleteStore = useCallback(async (id: string) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('stores').delete().eq('id', id);
    if (error) {
      console.error("Error deleting store:", error);
    } else if (selectedStoreId === id) {
      setSelectedStore(null);
    }
  }, [isConnected, selectedStoreId, setSelectedStore]);

  const addProduct = useCallback(async (product: Partial<Product>) => {
    if (!isConnected || !selectedStoreId) return;
    const { error } = await supabase!.from('products').insert([{
      store_id: selectedStoreId,
      name: product.name || 'Novo Produto',
      description: product.description || '',
      price: product.price || 0,
      stock: product.stock || 0,
      image_url: product.image_url || 'https://picsum.photos/seed/product/400/500',
      category: product.category || 'Geral',
    }]);
    if (error) console.error("Error adding product:", error);
  }, [isConnected, selectedStoreId]);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('products').update(data).eq('id', id);
    if (error) console.error("Error updating product:", error);
  }, [isConnected]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('products').delete().eq('id', id);
    if (error) console.error("Error deleting product:", error);
  }, [isConnected]);

  const addOrder = useCallback(async (order: Partial<Order>) => {
    if (!isConnected || !selectedStoreId) return;
    const { items, ...orderBase } = order || {};
    const { data: newOrder, error: orderError } = await supabase!.from('orders').insert([{
      store_id: selectedStoreId,
      customer_name: orderBase.customer_name || '',
      customer_email: orderBase.customer_email || '',
      status: orderBase.status || 'pending',
      total: orderBase.total || 0,
      subtotal: orderBase.subtotal || 0,
      shipping_cost: orderBase.shipping_cost || 0,
      discount_amount: orderBase.discount_amount || 0,
      currency: orderBase.currency || 'EUR',
    }]).select().single();

    if (orderError) {
      console.error("Error adding order:", orderError);
      return;
    }

    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      }));
      const { error: itemsError } = await supabase!.from('order_items').insert(orderItems);
      if (itemsError) console.error("Error adding order items:", itemsError);
    }
  }, [isConnected, selectedStoreId]);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('orders').update({ status }).eq('id', id);
    if (error) console.error("Error updating order status:", error);
  }, [isConnected]);

  const addCoupon = useCallback(async (coupon: Partial<Coupon>) => {
    if (!isConnected || !selectedStoreId) return;
    const { error } = await supabase!.from('coupons').insert([{
      store_id: selectedStoreId,
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 0,
      min_purchase: coupon.min_purchase || 0,
      max_uses: coupon.max_uses || null,
      active: coupon.active ?? true,
    }]);
    if (error) console.error("Error adding coupon:", error);
  }, [isConnected, selectedStoreId]);

  const updateCoupon = useCallback(async (id: string, data: Partial<Coupon>) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('coupons').update(data).eq('id', id);
    if (error) console.error("Error updating coupon:", error);
  }, [isConnected]);

  const deleteCoupon = useCallback(async (id: string) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('coupons').delete().eq('id', id);
    if (error) console.error("Error deleting coupon:", error);
  }, [isConnected]);

  const addShippingMethod = useCallback(async (method: Partial<ShippingMethod>) => {
    if (!isConnected || !selectedStoreId) return;
    const { error } = await supabase!.from('shipping_methods').insert([{
      store_id: selectedStoreId,
      name: method.name || '',
      description: method.description || '',
      cost: method.cost || 0,
      min_order_for_free: method.min_order_for_free || null,
      delivery_time: method.delivery_time || '',
      active: method.active ?? true,
    }]);
    if (error) console.error("Error adding shipping method:", error);
  }, [isConnected, selectedStoreId]);

  const updateShippingMethod = useCallback(async (id: string, data: Partial<ShippingMethod>) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('shipping_methods').update(data).eq('id', id);
    if (error) console.error("Error updating shipping method:", error);
  }, [isConnected]);

  const deleteShippingMethod = useCallback(async (id: string) => {
    if (!isConnected) return;
    const { error } = await supabase!.from('shipping_methods').delete().eq('id', id);
    if (error) console.error("Error deleting shipping method:", error);
  }, [isConnected]);

  return {
    stores,
    products,
    orders,
    coupons,
    shippingMethods,
    loading: storesLoading || dataLoading,
    storesLoading,
    dataLoading,
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
    refreshData,
  };
}


