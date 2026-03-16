-- Add payroll balance tracking table
CREATE TABLE IF NOT EXISTS employee_payroll_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0, -- Positive = owed to employee, Negative = employee owes (overpaid)
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id)
);

-- Enable RLS
ALTER TABLE employee_payroll_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view balances" ON employee_payroll_balances FOR SELECT USING (true);
CREATE POLICY "Anyone can insert balances" ON employee_payroll_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update balances" ON employee_payroll_balances FOR UPDATE USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_balances_employee ON employee_payroll_balances(employee_id);

-- Add transaction history table for audit trail
CREATE TABLE IF NOT EXISTS payroll_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'adjustment')),
  amount_earned NUMERIC(10,2) NOT NULL DEFAULT 0, -- What they earned in this transaction
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0, -- What was actually paid
  balance_before NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_after NUMERIC(10,2) NOT NULL DEFAULT 0,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  hours_worked NUMERIC(10,2) DEFAULT 0,
  payment_reference TEXT, -- Check number, cash, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payroll_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view transactions" ON payroll_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transactions" ON payroll_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update transactions" ON payroll_transactions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete transactions" ON payroll_transactions FOR DELETE USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_transactions_employee ON payroll_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON payroll_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_date_range ON payroll_transactions(date_range_start, date_range_end);