-- SISTEMA DE AFILIADOS PARA SHOPFORGE SAAS
-- Run this script in your Supabase SQL Editor

-- 1. Tabela de Links de Afiliados
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  code TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0.00,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(store_id, code)
);

-- 2. Adicionar coluna affiliate_link_id à tabela orders (opcional)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL;

-- 3. Tabela de Cliques (para estatísticas)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
 -- Armazenar dados da sessão para rastrear até conversão
  session_id TEXT
);

-- 4. Tabela de Comissões
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  percentage_used DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(order_id)
);

-- 5. Row Level Security (RLS)
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Policies para affiliate_links
CREATE POLICY "Public can view active affiliate links"
  ON affiliate_links FOR SELECT
  USING (active = true);

CREATE POLICY "Store owners can manage their affiliate links"
  ON affiliate_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = affiliate_links.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policies para affiliate_clicks
CREATE POLICY "Public can create affiliate clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view their affiliate clicks"
  ON affiliate_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      JOIN affiliate_links ON affiliate_links.store_id = stores.id
      WHERE affiliate_links.id = affiliate_clicks.affiliate_link_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policies para affiliate_commissions
CREATE POLICY "Public can create affiliate commissions"
  ON affiliate_commissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view their affiliate commissions"
  ON affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      JOIN affiliate_links ON affiliate_links.store_id = stores.id
      WHERE affiliate_links.id = affiliate_commissions.affiliate_link_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update affiliate commissions"
  ON affiliate_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      JOIN affiliate_links ON affiliate_links.store_id = stores.id
      WHERE affiliate_links.id = affiliate_commissions.affiliate_link_id
      AND stores.user_id = auth.uid()
    )
  );

-- 6. Realtime setup
ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_links;
ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_clicks;
ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_commissions;

-- 7. Function para gerar código único
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Index para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_id ON affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_link_id ON affiliate_commissions(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order_id ON affiliate_commissions(order_id);