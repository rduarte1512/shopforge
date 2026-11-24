ALTER TABLE forgeads_assets ADD COLUMN IF NOT EXISTS upload_total integer;
ALTER TABLE forgeads_assets DROP CONSTRAINT forgeads_assets_data_check;
ALTER TABLE forgeads_assets ADD CONSTRAINT forgeads_assets_data_check CHECK(octet_length(data)<=25000000);
ALTER TABLE forgeads_assets ADD CONSTRAINT forgeads_assets_upload_check CHECK(upload_total IS NULL OR (upload_total BETWEEN 1 AND 25000000 AND octet_length(data)<=upload_total));
