ALTER TABLE employee_fingerprints
ADD COLUMN device_template_id text NULL;

COMMENT ON COLUMN employee_fingerprints.device_template_id IS 'Template ID assigned by the physical fingerprint device';