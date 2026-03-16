-- Drop all the duplicate "authenticated" policies
DROP POLICY IF EXISTS "Anyone authenticated can view transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Anyone authenticated can insert transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Anyone authenticated can update transactions" ON payroll_transactions;
DROP POLICY IF EXISTS "Anyone authenticated can delete transactions" ON payroll_transactions;