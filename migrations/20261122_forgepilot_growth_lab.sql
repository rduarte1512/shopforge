-- ForgePilot Growth Lab — estatísticas de tráfego agregadas por loja.
-- Recolha dependente de consentimento explícito; sem IP, user-agent, email ou nome.
-- Executar no Neon antes de ativar a telemetria.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS store_traffic_sessions (
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  visitor_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  page_views integer NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  PRIMARY KEY (store_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_sessions_store_last_seen
  ON store_traffic_sessions (store_id, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_sessions_store_started
  ON store_traffic_sessions (store_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_sessions_store_visitor
  ON store_traffic_sessions (store_id, visitor_id, started_at DESC);

CREATE TABLE IF NOT EXISTS store_traffic_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_id uuid NOT NULL,
  session_id uuid NOT NULL,
  visitor_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'product_view', 'add_to_cart', 'checkout_started')),
  page_kind text NOT NULL DEFAULT 'other' CHECK (page_kind IN ('home', 'product', 'cart', 'other')),
  product_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_events_store_time
  ON store_traffic_events (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_store_kind_time
  ON store_traffic_events (store_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_events_store_product_time
  ON store_traffic_events (store_id, product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

COMMENT ON TABLE store_traffic_sessions IS 'Sessões pseudónimas com consentimento; identificadores aleatórios por loja, sem dados pessoais diretos.';
COMMENT ON TABLE store_traffic_events IS 'Eventos de navegação e intenção, não receitas nem compras confirmadas. Retenção: 90 dias.';

-- Manutenção periódica (cron autenticado): limitar os identificadores persistidos a 90 dias.
CREATE OR REPLACE FUNCTION prune_store_traffic()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM store_traffic_events WHERE created_at < now() - interval '90 days';
  DELETE FROM store_traffic_sessions WHERE last_seen < now() - interval '90 days';
END;
$$;
