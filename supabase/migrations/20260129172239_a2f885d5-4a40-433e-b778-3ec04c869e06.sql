-- Add attendance_status column to event_registrations table
ALTER TABLE public.event_registrations 
ADD COLUMN attendance_status text DEFAULT 'unknown' CHECK (attendance_status IN ('unknown', 'present', 'absent'));

-- Add attended_at timestamp for when attendance was marked
ALTER TABLE public.event_registrations 
ADD COLUMN attended_at timestamp with time zone;

-- Create index for faster attendance queries
CREATE INDEX idx_event_registrations_attendance ON public.event_registrations(event_id, attendance_status);