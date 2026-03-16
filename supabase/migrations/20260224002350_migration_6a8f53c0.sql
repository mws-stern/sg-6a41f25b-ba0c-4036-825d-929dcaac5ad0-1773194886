-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees (public read, authenticated write)
CREATE POLICY "Anyone can view employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert employees" ON employees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update employees" ON employees FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete employees" ON employees FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  hours_worked NUMERIC(10, 2),
  earnings NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for time_entries
CREATE POLICY "Anyone can view time entries" ON time_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update time entries" ON time_entries FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete time entries" ON time_entries FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create payroll_periods table
CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

-- Create policies for payroll_periods
CREATE POLICY "Anyone can view payroll periods" ON payroll_periods FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert payroll periods" ON payroll_periods FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update payroll periods" ON payroll_periods FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create payroll_entries table
CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  total_hours NUMERIC(10, 2) NOT NULL,
  gross_pay NUMERIC(10, 2) NOT NULL,
  deductions NUMERIC(10, 2) DEFAULT 0,
  net_pay NUMERIC(10, 2) NOT NULL,
  check_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for payroll_entries
CREATE POLICY "Anyone can view payroll entries" ON payroll_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert payroll entries" ON payroll_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update payroll entries" ON payroll_entries FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX idx_time_entries_clock_in ON time_entries(clock_in);
CREATE INDEX idx_payroll_entries_employee_id ON payroll_entries(employee_id);
CREATE INDEX idx_payroll_entries_period_id ON payroll_entries(payroll_period_id);