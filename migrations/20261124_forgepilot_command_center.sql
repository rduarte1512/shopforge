CREATE TABLE IF NOT EXISTS forgepilot_workspace (
 store_id uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
 monitoring_enabled boolean NOT NULL DEFAULT false,
 alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
 checked_at timestamptz,
 expenses jsonb NOT NULL DEFAULT '{}'::jsonb,
 expenses_at timestamptz
);
CREATE TABLE IF NOT EXISTS forgepilot_changes (
 id uuid PRIMARY KEY,
 store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('hero','accent','product-name','product-description')),
 target_id uuid,
 before_value jsonb NOT NULL,
 after_value jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 undone_at timestamptz
);
CREATE INDEX IF NOT EXISTS forgepilot_changes_store_idx ON forgepilot_changes(store_id,created_at DESC);
CREATE TABLE IF NOT EXISTS forgepilot_experiments (
 id uuid PRIMARY KEY,
 store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 120),
 original_title text NOT NULL,
 variant_title text NOT NULL,
 started_at timestamptz NOT NULL DEFAULT now(),
 ended_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS forgepilot_one_experiment_idx ON forgepilot_experiments(store_id) WHERE ended_at IS NULL;
CREATE TABLE IF NOT EXISTS forgepilot_exposures (
 experiment_id uuid NOT NULL REFERENCES forgepilot_experiments(id) ON DELETE CASCADE,
 visitor_id uuid NOT NULL,
 variant text NOT NULL CHECK(variant IN ('A','B')),
 exposed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(experiment_id,visitor_id)
);
CREATE INDEX IF NOT EXISTS forgepilot_exposure_time_idx ON forgepilot_exposures(exposed_at);
