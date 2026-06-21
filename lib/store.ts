import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'CLIENT';
export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export type SubscriptionStatus = 'active' | 'expired' | 'trialing' | 'none';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry?: string;
}

export interface Plan {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  description: string;
  limits: {
    stores: number;
    products: number;
  };
}

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    description: 'Ideal para validar a sua primeira ideia de negócio.',
    price: 0,
    interval: 'monthly',
    features: ['1 Loja Ativa', 'Até 50 Produtos', 'Temas Básicos', 'SSL Gratuito', 'Suporte Comunitário'],
    limits: { stores: 1, products: 50 }
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    description: 'Para empreendedores que estão a começar a escalar.',
    price: 19,
    interval: 'monthly',
    features: ['3 Lojas Ativas', 'Até 500 Produtos', 'Temas Premium', 'Recuperação de Carrinho', 'Analytics Básico', 'Suporte por Email'],
    limits: { stores: 3, products: 500 }
  },
  {
    id: 'PRO',
    name: 'Professional',
    description: 'A solução completa para negócios em plena expansão.',
    price: 49,
    interval: 'monthly',
    features: ['10 Lojas Ativas', 'Produtos Ilimitados', 'Geração de Loja por IA', 'Automações de Marketing', 'Analytics Avançado', 'Suporte Prioritário 24/7'],
    limits: { stores: 10, products: 1000000 }
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    description: 'Para agências e gestores de múltiplas marcas.',
    price: 99,
    interval: 'monthly',
    features: ['25 Lojas Ativas', 'Produtos Ilimitados', 'API de Integração', 'Relatórios Customizados', 'Gestão de Equipa', 'Manager de Conta Dedicado'],
    limits: { stores: 25, products: 1000000 }
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Infraestrutura robusta para operações globais.',
    price: 249,
    interval: 'monthly',
    features: ['Lojas Ilimitadas', 'Volume Customizado', 'SLA Garantido', 'White-label Analytics', 'Segurança Avançada', 'Onboarding Presencial'],
    limits: { stores: 1000000, products: 1000000 }
  }
];

export interface PaymentMethod {
  id: string;
  type: 'multibanco' | 'mbway' | 'paypal' | 'stripe' | 'transfer' | 'cash';
  name: string;
  description: string;
  active: boolean;
  instructions?: string;
}

export interface Store {
  id: string;
  userId?: string;
  user_id?: string;
  name: string;
  domain: string;
  description?: string;
  theme: 'light' | 'dark';
  primaryColor?: string;
  primary_color?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: string;
  currency?: string;
  currencySymbol?: string;
  baseCurrency?: string;
  base_currency?: string;
  returnPolicy?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  lowStockThreshold?: number;
  notifyLowStock?: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  faviconUrl?: string;
  secondaryColor?: string;
  metaTitle?: string;
  metaDescription?: string;
  notifyNewOrder?: boolean;
  notifyOrderStatus?: boolean;
  paymentMethods?: PaymentMethod[];
  customization?: any;
}

export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxUses?: number;
  usedCount: number;
  expiryDate?: string;
  active: boolean;
}

export interface ShippingMethod {
  id: string;
  storeId: string;
  name: string;
  description: string;
  cost: number;
  minOrderForFree?: number;
  deliveryTime: string;
  active: boolean;
}

export interface Product {
  id: string;
  storeId?: string;
  store_id?: string;
  name: string;
  description: string;
  shortDescription?: string;
  short_description?: string;
  price: number;
  compareAtPrice?: number;
  compare_at_price?: number;
  costPerItem?: number;
  stock: number;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  imageUrl?: string;
  image_url?: string;
  images?: string[];
  videoUrl?: string;
  video_url?: string;
  category: string;
  tags?: string[];
  material?: string;
  brand?: string;
  specifications?: Record<string, string>;
  isActive?: boolean;
  is_active?: boolean;
  isFeatured?: boolean;
  is_featured?: boolean;
  trackInventory?: boolean;
  allowOutOfStockPurchase?: boolean;
}

export interface OrderItem {
  id: string;
  productId?: string;
  product_id?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  storeId?: string;
  store_id?: string;
  customerName?: string;
  customer_name?: string;
  customerEmail?: string;
  customer_email?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  total: number;
  subtotal: number;
  shippingCost?: number;
  shipping_cost?: number;
  discountAmount?: number;
  discount_amount?: number;
  couponId?: string;
  coupon_id?: string;
  shippingMethodId?: string;
  shipping_method_id?: string;
  currency: string;
  items: OrderItem[];
  createdAt?: string;
  created_at?: string;
  paymentMethodId?: string;
  paymentMethodType?: string;
  paymentInstructions?: string;
}

interface StoreCompatibilityState {
  stores: Store[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  shippingMethods: ShippingMethod[];
  currentUser: User | null;
  selectedStoreId: string | null;
  setStores: (stores: Store[]) => void;
  setCurrentUser: (user: User | null) => void;
  updateSubscription: (userId: string, tier: SubscriptionTier) => void;
  setSelectedStore: (id: string | null) => void;
  updateStore: (id: string, store: Partial<Store>) => void;
}

export const useMockDB = create<StoreCompatibilityState>()(
  persist(
    (set) => ({
      stores: [],
      products: [],
      orders: [],
      coupons: [],
      shippingMethods: [],
      currentUser: null,
      selectedStoreId: null,
      setStores: (stores) => set({ stores }),
      setCurrentUser: (user) => set({ currentUser: user }),
      updateSubscription: (_userId, _tier) => set((state) => state),
      setSelectedStore: (id) => set({ selectedStoreId: id }),
      updateStore: (id, data) => set((state) => ({
        stores: state.stores.map((store) => store.id === id ? { ...store, ...data } : store),
      })),
    }),
    {
      name: 'shopforge-selected-store-compat',
      partialize: (state) => ({ selectedStoreId: state.selectedStoreId }),
    }
  )
);
