
CREATE TABLE IF NOT EXISTS forgeads_connections (
 store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 user_id text NOT NULL, provider text NOT NULL CHECK(provider IN ('meta','google')),
 secret text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(store_id,provider)
);
CREATE TABLE IF NOT EXISTS forgeads_assets (
 id uuid PRIMARY KEY, store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 user_id text NOT NULL, name text NOT NULL, mime text NOT NULL,
 data bytea NOT NULL CHECK(octet_length(data)<=3000000), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forgeads_assets_store_idx ON forgeads_assets(store_id,user_id);
CREATE TABLE IF NOT EXISTS forgeads_drafts (
 id uuid PRIMARY KEY, store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 user_id text NOT NULL, provider text NOT NULL CHECK(provider IN ('meta','google')),
 config jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forgeads_drafts_store_idx ON forgeads_drafts(store_id,user_id,updated_at DESC);
