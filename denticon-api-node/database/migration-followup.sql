-- Migration: Add follow-up fields to appointments table
-- Date: 2026-03-09

-- Add follow-up related columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_visit_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Update some existing appointments to have follow-up data (for demo)
UPDATE appointments 
SET follow_up_required = true, 
    next_visit_date = appointment_date + INTERVAL '30 days',
    follow_up_notes = 'Follow-up checkup required'
WHERE status = 'completed' AND id IN (5);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_follow_up ON appointments(follow_up_required, next_visit_date) 
WHERE follow_up_required = true;

-- Comment for documentation
COMMENT ON COLUMN appointments.follow_up_required IS 'Indicates if patient needs a follow-up appointment';
COMMENT ON COLUMN appointments.next_visit_date IS 'Suggested date for next visit/follow-up';
COMMENT ON COLUMN appointments.follow_up_notes IS 'Additional notes about follow-up requirements';
