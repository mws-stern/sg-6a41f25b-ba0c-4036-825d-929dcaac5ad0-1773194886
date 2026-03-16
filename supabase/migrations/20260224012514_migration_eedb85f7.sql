-- Add active status to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

-- Update RLS policies to show all employees (active and inactive)
DROP POLICY IF EXISTS "Anyone can view employees" ON employees;
CREATE POLICY "Anyone can view all employees" ON employees FOR SELECT USING (true);