-- Drop existing restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Users can view their own transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON payroll_transactions;

-- Create new policies that allow all authenticated users to view and manage transactions
CREATE POLICY "Anyone authenticated can view transactions" ON payroll_transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can insert transactions" ON payroll_transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can update transactions" ON payroll_transactions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can delete transactions" ON payroll_transactions
  FOR DELETE USING (auth.uid() IS NOT NULL);