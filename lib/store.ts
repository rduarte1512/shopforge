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

export interface Store {
  id: string;
  userId: string;
  name: string;
  domain: string;
  description: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  currency: string;
  currencySymbol: string;
  baseCurrency: string;
  returnPolicy: string;
  termsAndConditions: string;
  privacyPolicy: string;
  lowStockThreshold: number;
  notifyLowStock: boolean;
  logoUrl: string;
  bannerUrl: string;
  faviconUrl: string;
  secondaryColor: string;
  metaTitle: string;
  metaDescription: string;
  notifyNewOrder: boolean;
  notifyOrderStatus: boolean;
  paymentMethods: PaymentMethod[];
  customization?: {
    header: any;
    hero: any;
    products: any;
    colors: any;
    fonts: any;
    sections: any[];
  };
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

export interface PaymentMethod {
  id: string;
  type: 'multibanco' | 'mbway' | 'paypal' | 'stripe' | 'transfer' | 'cash';
  name: string;
  description: string;
  active: boolean;
  instructions?: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
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
  imageUrl: string;
  images?: string[];
  videoUrl?: string;
  category: string;
  tags?: string[];
  material?: string;
  brand?: string;
  specifications?: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  trackInventory: boolean;
  allowOutOfStockPurchase: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  storeId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  total: number;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponId?: string;
  shippingMethodId?: string;
  currency: string;
  items: OrderItem[];
  createdAt: string;
  paymentMethodId?: string;
  paymentMethodType?: string;
  paymentInstructions?: string;
}

interface MockDBStore {
  users: User[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  shippingMethods: ShippingMethod[];
  currentUser: User | null;
  selectedStoreId: string | null;
  setCurrentUser: (user: User | null) => void;
  updateSubscription: (userId: string, tier: SubscriptionTier) => void;
  setSelectedStore: (id: string | null) => void;
  addUser: (user: User) => void;
  addStore: (store: Store) => void;
  updateStore: (id: string, store: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  addShippingMethod: (method: ShippingMethod) => void;
  updateShippingMethod: (id: string, method: Partial<ShippingMethod>) => void;
  deleteShippingMethod: (id: string) => void;
}

export const useMockDB = create<MockDBStore>()(
  persist(
    (set) => ({
      users: [
        { id: '1', email: 'admin@shopforge.com', name: 'Admin', role: 'ADMIN', subscriptionTier: 'ENTERPRISE', subscriptionStatus: 'active' },
        { id: '2', email: 'demo@demo.com', name: 'Demo User', role: 'CLIENT', subscriptionTier: 'FREE', subscriptionStatus: 'active' }
      ],
      stores: [
        {
          id: '1',
          userId: '2',
          name: 'Demo Store',
          domain: 'demo',
          description: 'A demo store created on ShopForge.',
          theme: 'light',
          primaryColor: '#F27D26',
          phone: '+351 912 345 678',
          email: 'contact@demostore.com',
          address: 'Rua Principal, 123, Lisboa',
          businessHours: '9:00 - 18:00, Segunda a Sexta',
          currency: 'EUR',
          currencySymbol: '€',
          baseCurrency: 'EUR',
          returnPolicy: 'Aceitamos devoluções até 14 dias após a compra.',
          termsAndConditions: 'Ao comprar na nossa loja, concorda com os nossos termos.',
          privacyPolicy: 'Os seus dados são protegidos de acordo com a legislação.',
          lowStockThreshold: 10,
          notifyLowStock: true,
          logoUrl: '',
          bannerUrl: '',
          faviconUrl: '',
          secondaryColor: '#2D3748',
          metaTitle: 'Demo Store - A sua loja online',
          metaDescription: 'Encontre os melhores produtos na nossa loja online.',
          notifyNewOrder: true,
          notifyOrderStatus: true,
          paymentMethods: [
            { id: 'pm1', type: 'multibanco', name: 'Multibanco', description: 'Pagamento via Multibanco', active: true, instructions: 'Após confirmar a encomenda, receberá uma referência Multibanco por email.' },
            { id: 'pm2', type: 'mbway', name: 'MB WAY', description: 'Pagamento via MB WAY', active: true, instructions: 'Receberá uma notificação no seu telemóvel para confirmar o pagamento.' },
            { id: 'pm3', type: 'paypal', name: 'PayPal', description: 'Pagamento via PayPal', active: false, instructions: 'Será redirecionado para o PayPal para completar o pagamento.' },
            { id: 'pm4', type: 'transfer', name: 'Transferência Bancária', description: 'Transferência direta para a conta da loja', active: false, instructions: 'Após confirmar, receberá os dados bancários por email.' },
            { id: 'pm5', type: 'cash', name: 'Pagamento à Entrega', description: 'Pagamento em dinheiro quando receber a encomenda', active: false, instructions: 'Pague em dinheiro ao receber a sua encomenda.' }
          ]
        }
      ],
      products: [
        {
          id: '1',
          storeId: '1',
          name: 'Classic White T-Shirt',
          description: 'A perfect classic white t-shirt made of 100% cotton.',
          price: 29.99,
          stock: 50,
          imageUrl: 'https://picsum.photos/seed/shirt/400/500',
          category: 'Clothing',
          isActive: true,
          isFeatured: true,
          trackInventory: true,
          allowOutOfStockPurchase: false,
          sku: 'TSHIRT-WHITE-01'
        },
        {
          id: '2',
          storeId: '1',
          name: 'Minimalist Watch',
          description: 'An elegant minimalist watch with leather strap.',
          price: 199.99,
          stock: 15,
          imageUrl: 'https://picsum.photos/seed/watch/400/500',
          category: 'Accessories',
          isActive: true,
          isFeatured: true,
          trackInventory: true,
          allowOutOfStockPurchase: false,
          sku: 'WATCH-MIN-01'
        }
      ],
      orders: [
         {
          id: '1',
          storeId: '1',
          customerName: 'Alice Smith',
          customerEmail: 'alice@example.com',
          status: 'paid',
          total: 229.98,
          subtotal: 229.98,
          shippingCost: 0,
          discountAmount: 0,
          currency: 'EUR',
          items: [
             { id: 'i1', productId: '1', quantity: 1, price: 29.99 },
             { id: 'i2', productId: '2', quantity: 1, price: 199.99 }
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString()
         }
      ],
      coupons: [
        {
          id: 'c1',
          storeId: '1',
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          minPurchase: 50,
          usedCount: 0,
          active: true
        }
      ],
      shippingMethods: [
        {
          id: 's1',
          storeId: '1',
          name: 'Standard Shipping',
          description: 'Delivery in 3-5 business days',
          cost: 5.99,
          minOrderForFree: 100,
          deliveryTime: '3-5 days',
          active: true
        }
      ],
      currentUser: null,
      selectedStoreId: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      updateSubscription: (userId, tier) => set((state) => {
        const updatedUsers = state.users.map(u => 
          u.id === userId ? { ...u, subscriptionTier: tier, subscriptionStatus: 'active' } : u
        );
        const updatedCurrentUser = state.currentUser?.id === userId 
          ? { ...state.currentUser, subscriptionTier: tier, subscriptionStatus: 'active' } as User
          : state.currentUser;
        return { users: updatedUsers, currentUser: updatedCurrentUser };
      }),
      setSelectedStore: (id) => set({ selectedStoreId: id }),
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
      updateStore: (id, data) => set((state) => ({
        stores: state.stores.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      deleteStore: (id) => set((state) => ({ 
        stores: state.stores.filter(s => s.id !== id),
        selectedStoreId: state.selectedStoreId === id ? null : state.selectedStoreId
      })),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, data) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),
      addCoupon: (coupon) => set((state) => ({ coupons: [...state.coupons, coupon] })),
      updateCoupon: (id, data) => set((state) => ({
        coupons: state.coupons.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCoupon: (id) => set((state) => ({
        coupons: state.coupons.filter(c => c.id !== id)
      })),
      addShippingMethod: (method) => set((state) => ({ shippingMethods: [...state.shippingMethods, method] })),
      updateShippingMethod: (id, data) => set((state) => ({
        shippingMethods: state.shippingMethods.map(m => m.id === id ? { ...m, ...data } : m)
      })),
      deleteShippingMethod: (id) => set((state) => ({
        shippingMethods: state.shippingMethods.filter(m => m.id !== id)
      })),
    }),
    {
      name: 'shopforge-mock-db',
    }
  )
);
