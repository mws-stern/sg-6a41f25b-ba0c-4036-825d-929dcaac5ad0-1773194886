-- Add deleted_at column to employees table for soft delete
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance on deleted_at
CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON employees(deleted_at);

-- Add comment to document the soft delete functionality
COMMENT ON COLUMN employees.deleted_at IS 'Timestamp when employee was soft-deleted. NULL means employee is not deleted.';