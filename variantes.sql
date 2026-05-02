-- VARIANTES DE PRODUTOS SCHEMA
-- Run this script in your Supabase SQL Editor

-- 1. Add has_variants column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- 2. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  sku TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(product_id, name)
);

-- 3. Enable RLS on product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for product_variants
CREATE POLICY "Public can view product variants" 
  ON product_variants FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id
    )
  );

CREATE POLICY "Store owners can manage product variants" 
  ON product_variants FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = product_variants.product_id 
      AND stores.user_id = auth.uid()
    )
  );

-- 5. Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;

-- 6. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_attributes ON product_variants USING GIN(attributes);