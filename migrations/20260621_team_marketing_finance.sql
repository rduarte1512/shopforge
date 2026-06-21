-- ShopForge: equipa, automações e área financeira
-- Aplicado no Neon project neon-aero-tree em 2026-06-21.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_per_item numeric(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 23;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount numeric(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  owner_user_id text NOT NULL,
  member_user_id text,
  member_email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'support',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'invited',
  invited_by text,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  owner_user_id text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'support',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  actor_user_id text,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  trigger_event text NOT NULL,
  delay_minutes integer NOT NULL DEFAULT 0,
  audience text NOT NULL DEFAULT 'all',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  coupon_code text,
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES marketing_automations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  target_email text,
  related_order_id uuid,
  status text NOT NULL DEFAULT 'queued',
  executed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner_store ON team_members(owner_user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(member_email);
CREATE INDEX IF NOT EXISTS idx_team_invites_owner_store ON team_invites(owner_user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_store_created ON activity_logs(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_automations_store ON marketing_automations(store_id, active);
CREATE INDEX IF NOT EXISTS idx_marketing_automation_runs_store ON marketing_automation_runs(store_id, created_at DESC);
