CREATE TABLE IF NOT EXISTS forgepilot_token_ledger (
 id uuid PRIMARY KEY, user_id text NOT NULL, period_start date NOT NULL, operation text NOT NULL CHECK (operation IN ('chat','brand','draft','batch')), tokens integer NOT NULL CHECK (tokens > 0), status text NOT NULL CHECK (status IN ('reserved','spent','refunded')), created_at timestamptz NOT NULL DEFAULT now(), settled_at timestamptz
);
CREATE INDEX IF NOT EXISTS forgepilot_token_ledger_user_period_idx ON forgepilot_token_ledger(user_id,period_start);
CREATE INDEX IF NOT EXISTS forgepilot_token_ledger_user_date_idx ON forgepilot_token_ledger(user_id,created_at DESC);
