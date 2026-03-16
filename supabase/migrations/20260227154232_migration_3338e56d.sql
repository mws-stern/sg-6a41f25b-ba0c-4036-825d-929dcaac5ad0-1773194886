-- Add custom_payment_amount column to payroll_entries table (correct table)
ALTER TABLE payroll_entries 
ADD COLUMN IF NOT EXISTS custom_payment_amount DECIMAL(10, 2);