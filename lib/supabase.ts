import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export { supabase };

export type UserRole = 'ADMIN' | 'CLIENT';
export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export type SubscriptionStatus = 'active' | 'expired' | 'trialing' | 'none';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  description: string | null;
  theme: 'light' | 'dark';
  primary_color: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  business_hours: string | null;
  currency: string;
  currency_symbol: string;
  base_currency: string;
  return_policy: string | null;
  terms_and_conditions: string | null;
  privacy_policy: string | null;
  low_stock_threshold: number;
  notify_low_stock: boolean;
  logo_url: string | null;
  banner_url: string | null;
  favicon_url: string | null;
  secondary_color: string;
  meta_title: string | null;
  meta_description: string | null;
  notify_new_order: boolean;
  notify_order_status: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  stock: number;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  image_url: string;
  images: string[] | null;
  video_url: string | null;
  category: string;
  tags: string[] | null;
  material: string | null;
  brand: string | null;
  specifications: Record<string, string> | null;
  is_active: boolean;
  is_featured: boolean;
  track_inventory: boolean;
  allow_out_of_stock_purchase: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_id: string | null;
  shipping_method_id: string | null;
  currency: string;
  payment_method_id: string | null;
  payment_method_type: string | null;
  payment_instructions: string | null;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
}

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  expiry_date: string | null;
  active: boolean;
  created_at: string;
}

export interface ShippingMethod {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  cost: number;
  min_order_for_free: number | null;
  delivery_time: string | null;
  active: boolean;
  created_at: string;
}