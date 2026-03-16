-- Make RLS policies completely permissive (temporary for debugging)
DROP POLICY IF EXISTS "Anyone can view transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Anyone can update transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Anyone can delete transactions" ON payroll_transactions;

-- Create the most permissive policies possible
CREATE POLICY "Public read access" ON payroll_transactions
  FOR SELECT USING (true);

CREATE POLICY "Public insert access" ON payroll_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access" ON payroll_transactions
  FOR UPDATE USING (true);

CREATE POLICY "Public delete access" ON payroll_transactions
  FOR DELETE USING (true);