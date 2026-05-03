-- SUPABASE SETUP SCRIPT FOR SHOPFORGE SAAS
-- Run this script in your Supabase SQL Editor

-- 1. Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENT');
CREATE TYPE subscription_tier AS ENUM ('STARTER', 'GROWTH', 'PRO', 'BUSINESS', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'trialing', 'none');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered');
CREATE TYPE store_theme AS ENUM ('light', 'dark');

-- 2. Create tables

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role DEFAULT 'CLIENT',
  subscription_tier subscription_tier DEFAULT 'STARTER',
  subscription_status subscription_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  theme store_theme DEFAULT 'light' NOT NULL,
  primary_color TEXT DEFAULT '#008060' NOT NULL,
  base_currency TEXT DEFAULT 'EUR' NOT NULL,
  customization JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Coupons table
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0.00,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(store_id, code)
);

-- Shipping Methods table
CREATE TABLE shipping_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_for_free DECIMAL(10,2),
  delivery_time TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE SET NULL,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  payment_method_id TEXT,
  payment_method_type TEXT,
  payment_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Order Items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_rules ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Stores Policies
CREATE POLICY "Public can view all stores" 
  ON stores FOR SELECT 
  USING (true);

CREATE POLICY "Store owners can manage their stores" 
  ON stores FOR ALL 
  USING (auth.uid() = user_id);

-- Products Policies
CREATE POLICY "Public can view all products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Store owners can manage their products" 
  ON products FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Coupons Policies
CREATE POLICY "Public can view active coupons" 
  ON coupons FOR SELECT 
  USING (active = true);

CREATE POLICY "Store owners can manage their coupons" 
  ON coupons FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = coupons.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Shipping Methods Policies
CREATE POLICY "Public can view shipping methods" 
  ON shipping_methods FOR SELECT 
  USING (active = true);

CREATE POLICY "Store owners can manage their shipping methods" 
  ON shipping_methods FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = shipping_methods.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Orders Policies
-- ... (Update existing orders policies or add new ones if needed)
CREATE POLICY "Store owners can view their store orders" 
  ON orders FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create orders" 
  ON orders FOR INSERT 
  WITH CHECK (true);

-- Order Items Policies
CREATE POLICY "Store owners can view order items" 
  ON order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN stores ON stores.id = orders.store_id
      WHERE orders.id = order_items.order_id 
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create order items" 
  ON order_items FOR INSERT 
  WITH CHECK (true);

-- Promotions Policies
CREATE POLICY "Public can view active promotions" 
  ON promotions FOR SELECT 
  USING (active = true);

CREATE POLICY "Store owners can manage their promotions" 
  ON promotions FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = promotions.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Promotion Rules Policies
CREATE POLICY "Public can view active promotion rules" 
  ON promotion_rules FOR SELECT 
  USING (active = true);

CREATE POLICY "Store owners can manage their promotion rules" 
  ON promotion_rules FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = promotion_rules.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Promotions table (banners/promotional banners)
CREATE TABLE promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  link_type TEXT CHECK (link_type IN ('product', 'category', 'url', 'none')),
  link_value TEXT,
  position TEXT NOT NULL CHECK (position IN ('hero', 'banner', 'popup', 'sidebar')) DEFAULT 'banner',
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Promotion Rules table (automatic discounts)
CREATE TABLE promotion_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('buy_x_get_y', 'discount_category', 'shipping_free', 'bulk_discount', 'first_order')),
  conditions JSONB DEFAULT '{}'::jsonb,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10,2),
  applicable_categories TEXT[],
  applicable_products UUID[],
  min_purchase DECIMAL(10,2) DEFAULT 0,
  min_quantity INTEGER,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Triggers for automatic profile creation

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, subscription_tier, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CLIENT'),
    COALESCE((NEW.raw_user_meta_data->>'subscription_tier')::subscription_tier, 'STARTER'),
    COALESCE((NEW.raw_user_meta_data->>'subscription_status')::subscription_status, 'active')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Realtime setup
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE shipping_methods;
ALTER PUBLICATION supabase_realtime ADD TABLE promotions;
ALTER PUBLICATION supabase_realtime ADD TABLE promotion_rules;
