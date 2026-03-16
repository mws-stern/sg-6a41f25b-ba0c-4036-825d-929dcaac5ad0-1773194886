-- Create fingerprint devices table
CREATE TABLE fingerprint_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_name TEXT NOT NULL,
  device_ip TEXT NOT NULL,
  device_port INTEGER NOT NULL DEFAULT 4370,
  device_serial TEXT,
  device_model TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  connection_status TEXT DEFAULT 'disconnected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee fingerprints table
CREATE TABLE employee_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  fingerprint_template TEXT NOT NULL, -- Base64 encoded fingerprint template
  finger_index INTEGER NOT NULL, -- 0-9 (left/right hand, 5 fingers each)
  quality_score INTEGER, -- 0-100 quality rating
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_by TEXT, -- 'self' or 'admin'
  is_active BOOLEAN DEFAULT true,
  UNIQUE(employee_id, finger_index)
);

-- Create fingerprint punch logs table
CREATE TABLE fingerprint_punch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES fingerprint_devices(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  fingerprint_id UUID REFERENCES employee_fingerprints(id) ON DELETE SET NULL,
  punch_type TEXT NOT NULL, -- 'clock_in' or 'clock_out'
  punch_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  match_score INTEGER, -- Confidence score 0-100
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_fingerprints_employee ON employee_fingerprints(employee_id);
CREATE INDEX idx_fingerprints_active ON employee_fingerprints(is_active);
CREATE INDEX idx_punch_logs_employee ON fingerprint_punch_logs(employee_id);
CREATE INDEX idx_punch_logs_time ON fingerprint_punch_logs(punch_time);
CREATE INDEX idx_punch_logs_device ON fingerprint_punch_logs(device_id);

-- Enable RLS
ALTER TABLE fingerprint_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE fingerprint_punch_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public access for now, can be restricted later)
CREATE POLICY "Anyone can view devices" ON fingerprint_devices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert devices" ON fingerprint_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update devices" ON fingerprint_devices FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete devices" ON fingerprint_devices FOR DELETE USING (true);

CREATE POLICY "Anyone can view fingerprints" ON employee_fingerprints FOR SELECT USING (true);
CREATE POLICY "Anyone can insert fingerprints" ON employee_fingerprints FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update fingerprints" ON employee_fingerprints FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete fingerprints" ON employee_fingerprints FOR DELETE USING (true);

CREATE POLICY "Anyone can view punch logs" ON fingerprint_punch_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert punch logs" ON fingerprint_punch_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update punch logs" ON fingerprint_punch_logs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete punch logs" ON fingerprint_punch_logs FOR DELETE USING (true);