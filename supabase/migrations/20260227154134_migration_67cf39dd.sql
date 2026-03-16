-- Add custom_payment_amount column to payroll_periods table
ALTER TABLE payroll_periods 
ADD COLUMN IF NOT EXISTS custom_payment_amount DECIMAL(10, 2);