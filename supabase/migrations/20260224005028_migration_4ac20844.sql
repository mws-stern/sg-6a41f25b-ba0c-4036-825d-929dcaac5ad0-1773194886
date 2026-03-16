-- Add CHECK constraint to payroll_periods for status
ALTER TABLE payroll_periods 
DROP CONSTRAINT IF EXISTS payroll_periods_status_check;

ALTER TABLE payroll_periods 
ADD CONSTRAINT payroll_periods_status_check 
CHECK (status IN ('open', 'closed'));

-- Add status column to payroll_entries
ALTER TABLE payroll_entries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid'));