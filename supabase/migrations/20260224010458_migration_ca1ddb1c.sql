-- Create manual_adjustments table for tracking manual hours and pickup trips
CREATE TABLE manual_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('manual_hours', 'pickup_trip', 'bonus', 'deduction')),
  amount DECIMAL(10, 2) NOT NULL,
  hours DECIMAL(10, 2),
  reason TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_manual_adjustments_employee_id ON manual_adjustments(employee_id);
CREATE INDEX idx_manual_adjustments_date ON manual_adjustments(date);

-- Enable RLS
ALTER TABLE manual_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view manual adjustments" ON manual_adjustments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert manual adjustments" ON manual_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update manual adjustments" ON manual_adjustments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete manual adjustments" ON manual_adjustments FOR DELETE USING (true);