-- ============================================================
-- EMAIL MARKETING SETUP FOR SHOPFORGE SAAS
-- Run this script in your Supabase SQL Editor (email.sql)
-- ============================================================

-- 1. Email Subscriptions (marketing consent / RGPD)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT true NOT NULL,
  consent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'checkout' CHECK (source IN ('checkout', 'newsletter', 'manual', 'signup')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(store_id, email)
);

-- 2. Cart Abandonment tracking
CREATE TABLE IF NOT EXISTS cart_abandonments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  cart_data JSONB DEFAULT '{}'::jsonb,
  recovery_email_sent BOOLEAN DEFAULT false NOT NULL,
  recovery_attempts INTEGER DEFAULT 0 NOT NULL,
  last_recovery_sent_at TIMESTAMP WITH TIME ZONE,
  recovered_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Email Logs (sent / opened / clicked tracking)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('order_confirmation', 'order_status', 'cart_recovery', 'welcome', 'newsletter', 'test')),
  subject TEXT NOT NULL,
  resend_message_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Store Email Settings (per-store Resend config)
CREATE TABLE IF NOT EXISTS store_email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID UNIQUE REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  resend_api_key TEXT,
  sender_name TEXT DEFAULT 'ShopForge',
  sender_email TEXT,
  reply_to_email TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#00B062',
  notify_new_order BOOLEAN DEFAULT true,
  notify_order_status BOOLEAN DEFAULT true,
  notify_low_stock BOOLEAN DEFAULT true,
  cart_recovery_enabled BOOLEAN DEFAULT false,
  cart_recovery_delay_hours INTEGER DEFAULT 1,
  cart_recovery_2nd_email BOOLEAN DEFAULT true,
  marketing_consent_default BOOLEAN DEFAULT true,
  marketing_consent_text TEXT DEFAULT 'Quero receber newsletters e promoções especiais.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Email Templates (customizable per-store)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_confirmation', 'order_status', 'cart_recovery', 'welcome', 'newsletter')),
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT,
  custom_values JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(store_id, type)
);

-- 6. Email Campaigns (newsletters)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- RLS FOR EMAIL TABLES
-- ============================================================

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_abandonments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Email Subscriptions Policies
CREATE POLICY "email_subscriptions: store owners can view"
  ON email_subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = email_subscriptions.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "email_subscriptions: anyone can subscribe"
  ON email_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "email_subscriptions: store owners can manage"
  ON email_subscriptions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = email_subscriptions.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "email_subscriptions: anyone can unsubscribe"
  ON email_subscriptions FOR UPDATE
  USING (true);

-- Cart Abandonments Policies
CREATE POLICY "cart_abandonments: public can create"
  ON cart_abandonments FOR INSERT WITH CHECK (true);

CREATE POLICY "cart_abandonments: store owners can manage"
  ON cart_abandonments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = cart_abandonments.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "cart_abandonments: service can update"
  ON cart_abandonments FOR UPDATE
  USING (true);

-- Email Logs Policies
CREATE POLICY "email_logs: store owners can view"
  ON email_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = email_logs.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "email_logs: service can insert"
  ON email_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "email_logs: service can update status"
  ON email_logs FOR UPDATE
  USING (true);

-- Store Email Settings Policies
CREATE POLICY "store_email_settings: store owners can manage"
  ON store_email_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_email_settings.store_id AND stores.user_id = auth.uid())
  );

-- Email Templates Policies
CREATE POLICY "email_templates: store owners can manage"
  ON email_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = email_templates.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "email_templates: public can view active transactional"
  ON email_templates FOR SELECT
  USING (
    is_active = true AND
    type IN ('order_confirmation', 'order_status', 'cart_recovery', 'welcome')
  );

-- Email Campaigns Policies
CREATE POLICY "email_campaigns: store owners can manage"
  ON email_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = email_campaigns.store_id AND stores.user_id = auth.uid())
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: auto-save email subscription on new order (marketing consent)
CREATE OR REPLACE FUNCTION public.handle_order_marketing_consent()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_subscriptions (store_id, email, source)
  VALUES (NEW.store_id, NEW.customer_email, 'checkout')
  ON CONFLICT (store_id, email) DO UPDATE SET
    unsubscribed_at = NULL,
    consent_at = NOW(),
    consent_given = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_marketing_consent ON orders;
CREATE TRIGGER on_order_marketing_consent
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_marketing_consent();

-- Trigger: auto-create store_email_settings on new store
CREATE OR REPLACE FUNCTION public.handle_new_store_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.store_email_settings (store_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_store_settings ON stores;
CREATE TRIGGER on_new_store_settings
  AFTER INSERT ON stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store_settings();

-- Trigger: mark abandonment as recovered when order is placed
CREATE OR REPLACE FUNCTION public.handle_abandonment_recovered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cart_abandonments
  SET recovered_order_id = NEW.id,
      abandoned_at = NOW()
  WHERE store_id = NEW.store_id
    AND email = NEW.customer_email
    AND recovered_order_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_abandonment_recovered ON orders;
CREATE TRIGGER on_abandonment_recovered
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_abandonment_recovered();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE email_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_abandonments;
ALTER PUBLICATION supabase_realtime ADD TABLE email_campaigns;

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Get active subscribers for a store
CREATE OR REPLACE FUNCTION get_active_subscribers(p_store_id UUID)
RETURNS TABLE(id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT es.id, es.email
  FROM email_subscriptions es
  WHERE es.store_id = p_store_id
    AND es.consent_given = true
    AND es.unsubscribed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get abandoned carts that need recovery emails
CREATE OR REPLACE FUNCTION get_abandoned_carts_needing_recovery(p_store_id UUID, p_hours INTEGER DEFAULT 1)
RETURNS TABLE(id UUID, email TEXT, cart_data JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT ca.id, ca.email, ca.cart_data
  FROM cart_abandonments ca
  JOIN store_email_settings ses ON ses.store_id = ca.store_id
  WHERE ca.store_id = p_store_id
    AND ca.recovered_order_id IS NULL
    AND ca.email IS NOT NULL
    AND ses.cart_recovery_enabled = true
    AND (
      (ca.recovery_attempts = 0 AND ca.abandoned_at < NOW() - (p_hours || ' hours')::interval)
      OR (ca.recovery_attempts = 1 AND ca.cart_recovery_2nd_email = true AND ca.last_recovery_sent_at < NOW() - INTERVAL '1 day')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;