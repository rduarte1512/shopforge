'use client';
import { useState, useEffect } from 'react';
import { DateRange } from '@/components/dashboard/DateRangeFilter';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { getStoreProductsAction, getMyStoresAction, getStoreOrdersAction } from '@/lib/actions';
import { useSelectedStore } from '@/lib/selected-store-context';

interface ReportMetrics {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  averageOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  avgOrderChange: number;
}

interface SalesData {
  name: string;
  sales: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

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

const CATEGORY_COLORS: Record<string, string> = {
  'Eletrónicos': '#008060',
  'Moda': '#00aed1',
  'Casa': '#f49342',
  'Beleza': '#eb4d4b',
  'Acessórios': '#8a3ab9',
  'default': '#6b7280'
};

export function useReportsData(dateRange?: DateRange) {
  const { selectedStoreId } = useSelectedStore();
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function normalizeOrderData(order: any) {
      return {
        id: order.id,
        storeId: order.store_id || order.storeId,
        customerName: order.customer_name || order.customerName,
        customerEmail: order.customer_email || order.customerEmail,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost || order.shippingCost,
        discountAmount: order.discount_amount || order.discountAmount,
        currency: order.currency,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id || item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        createdAt: order.created_at || order.createdAt
      };
    }

    function normalizeProductData(product: any) {
      return {
        id: product.id,
        storeId: product.store_id || product.storeId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sku: product.sku,
        imageUrl: product.image_url || product.imageUrl,
        category: product.category,
        isActive: product.is_active ?? product.isActive,
        createdAt: product.created_at || product.createdAt
      };
    }

    function processOrders(orders: any[], products: any[], startDate: Date, endDate: Date, dates: string[], dayNames: string[]) {
      const normalizedOrders = orders.map(normalizeOrderData);
      const normalizedProducts = products.map(normalizeProductData);
      
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      const filteredOrders = normalizedOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        const orderTime = orderDate.getTime();
        return orderTime >= startTime && orderTime <= endTime;
      });

      const totalRevenue = filteredOrders.reduce((sum: number, o) => sum + (Number(o.total) || 0), 0);
      const totalOrders = filteredOrders.length;
      const uniqueCustomers = new Set(filteredOrders.map((o) => o.customerEmail)).size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const salesByDate: Record<string, { sales: number; orders: number }> = {};
      dates.forEach(date => salesByDate[date] = { sales: 0, orders: 0 });

      filteredOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const dateStr = orderDate.toLocaleDateString('en-CA');
        
        if (salesByDate[dateStr]) {
          salesByDate[dateStr].sales += Number(order.total) || 0;
          salesByDate[dateStr].orders += 1;
        }
      });

      const categoryMap: Record<string, number> = {};
      normalizedProducts.forEach((p) => {
        const cat = p.category || 'Geral';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      const productSales: Record<string, { quantity: number, revenue: number }> = {};
      filteredOrders.forEach((o) => {
        o.items?.forEach((item: any) => {
          if (item.productId) {
            if (!productSales[item.productId]) productSales[item.productId] = { quantity: 0, revenue: 0 };
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += Number(item.price) * item.quantity;
          }
        });
      });

      return {
        metrics: {
          totalRevenue,
          totalOrders,
          newCustomers: uniqueCustomers,
          averageOrderValue,
          revenueChange: 12.5,
          ordersChange: 8.2,
          customersChange: 5.4,
          avgOrderChange: 2.1
        },
        salesData: dates.map((date, index) => ({
          name: dayNames[index],
          sales: Math.round(salesByDate[date].sales),
          orders: salesByDate[date].orders
        })),
        categoryData: Object.entries(categoryMap).map(([name, value]) => ({
          name,
          value,
          color: CATEGORY_COLORS[name] || CATEGORY_COLORS['default']
        })),
        topProducts: normalizedProducts
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Geral',
            sales: productSales[p.id]?.quantity || 0,
            revenue: productSales[p.id]?.revenue || 0,
            stock: p.stock,
            status: (p.stock < 10 ? 'low_stock' : 'in_stock') as 'low_stock' | 'in_stock',
            image: p.imageUrl || 'https://picsum.photos/seed/prod/100/100'
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 4)
      };
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      const startDate = dateRange ? dateRange.startDate : startOfDay(subDays(new Date(), 6));
      const endDate = dateRange ? dateRange.endDate : endOfDay(new Date());
      
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const dates: string[] = [];
      const dayNames: string[] = [];
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      for (let i = 0; i < daysDiff; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date.toLocaleDateString('en-CA'));
        dayNames.push(days[date.getDay()]);
      }

      try {
        let storeId = selectedStoreId;
        if (!storeId) {
          const stores = await getMyStoresAction();
          if (stores && stores.length > 0) storeId = stores[0].id;
        }

        if (!storeId) {
          setMetrics(null);
          setSalesData([]);
          setCategoryData([]);
          setTopProducts([]);
          setLoading(false);
          return;
        }

        const [orders, products] = await Promise.all([
          getStoreOrdersAction(storeId, startDate.toISOString(), endDate.toISOString()),
          getStoreProductsAction(storeId)
        ]);

        const result = processOrders(orders || [], products || [], startDate, endDate, dates, dayNames);
        setMetrics(result.metrics);
        setSalesData(result.salesData);
        setCategoryData(result.categoryData);
        setTopProducts(result.topProducts);
      } catch (err: any) {
        console.error('Error fetching reports data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedStoreId, dateRange]);

  return { metrics, salesData, categoryData, topProducts, loading, error };
}
