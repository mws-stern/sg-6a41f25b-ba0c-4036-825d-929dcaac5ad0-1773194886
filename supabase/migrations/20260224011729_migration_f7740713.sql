-- Remove deduction-related columns from payroll_entries table
ALTER TABLE payroll_entries 
DROP COLUMN IF EXISTS deductions,
DROP COLUMN IF EXISTS net_pay;

-- Add comment to track changes
COMMENT ON TABLE payroll_entries IS 'Payroll entries without deductions - gross pay only';