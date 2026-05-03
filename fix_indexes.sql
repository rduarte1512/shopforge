-- Fix Database Performance: Add missing indexes for Foreign Keys used in RLS policies

-- Indexes for 'stores'
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- Indexes for 'products'
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- Indexes for 'coupons'
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);

-- Indexes for 'shipping_methods'
CREATE INDEX IF NOT EXISTS idx_shipping_methods_store_id ON shipping_methods(store_id);

-- Indexes for 'orders'
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);

-- Indexes for 'order_items'
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Indexes for 'promotions'
CREATE INDEX IF NOT EXISTS idx_promotions_store_id ON promotions(store_id);

-- Indexes for 'promotion_rules'
CREATE INDEX IF NOT EXISTS idx_promotion_rules_store_id ON promotion_rules(store_id);
