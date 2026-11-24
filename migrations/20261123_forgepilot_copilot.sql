-- ForgePilot 2.0 — histórico de conversa por utilizador e loja (Neon/Postgres).
-- Sem alterações automáticas no storefront. Retenção via cron autenticado: 90 dias.
CREATE TABLE IF NOT EXISTS forgepilot_chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forgepilot_chat_messages_store_user_time_idx
  ON forgepilot_chat_messages (store_id, user_id, created_at DESC, id DESC);

COMMENT ON TABLE forgepilot_chat_messages IS 'Histórico privado do ForgePilot Copilot. O utilizador pode eliminá-lo no painel; expira após 90 dias.';
