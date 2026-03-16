-- Add paid column to time_entries
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;

-- Add paid column to manual_adjustments
ALTER TABLE manual_adjustments 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_paid ON time_entries(paid);
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_paid ON manual_adjustments(paid);