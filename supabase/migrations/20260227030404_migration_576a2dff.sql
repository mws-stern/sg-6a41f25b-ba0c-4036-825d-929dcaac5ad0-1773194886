-- Change clock_in and clock_out from timestamptz to time
-- This prevents timezone conversion issues
ALTER TABLE manual_adjustments 
  ALTER COLUMN clock_in TYPE time USING clock_in::time,
  ALTER COLUMN clock_out TYPE time USING clock_out::time;