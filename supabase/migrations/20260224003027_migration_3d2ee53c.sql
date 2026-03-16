-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert time entries" ON time_entries;
DROP POLICY IF EXISTS "Authenticated users can update time entries" ON time_entries;
DROP POLICY IF EXISTS "Authenticated users can delete time entries" ON time_entries;
DROP POLICY IF EXISTS "Authenticated users can insert payroll periods" ON payroll_periods;
DROP POLICY IF EXISTS "Authenticated users can update payroll periods" ON payroll_periods;
DROP POLICY IF EXISTS "Authenticated users can insert payroll entries" ON payroll_entries;
DROP POLICY IF EXISTS "Authenticated users can update payroll entries" ON payroll_entries;

-- Create new public access policies for employees
CREATE POLICY "Anyone can insert employees" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON employees FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete employees" ON employees FOR DELETE USING (true);

-- Create new public access policies for time_entries
CREATE POLICY "Anyone can insert time entries" ON time_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update time entries" ON time_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete time entries" ON time_entries FOR DELETE USING (true);

-- Create new public access policies for payroll_periods
CREATE POLICY "Anyone can insert payroll periods" ON payroll_periods FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payroll periods" ON payroll_periods FOR UPDATE USING (true);

-- Create new public access policies for payroll_entries
CREATE POLICY "Anyone can insert payroll entries" ON payroll_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payroll entries" ON payroll_entries FOR UPDATE USING (true);