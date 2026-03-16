ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employee_number text,
ADD COLUMN IF NOT EXISTS position text;

-- Add index for employee_number lookup
CREATE INDEX IF NOT EXISTS idx_employees_number ON employees(employee_number);