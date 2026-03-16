ALTER TABLE fingerprint_devices
ADD COLUMN IF NOT EXISTS api_key text,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

ALTER TABLE employee_fingerprints
ADD COLUMN IF NOT EXISTS finger_index integer DEFAULT 1;