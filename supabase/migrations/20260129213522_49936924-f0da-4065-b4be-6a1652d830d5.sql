-- Add notification preference columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_event_reminders boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_announcements boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_payment_receipts boolean NOT NULL DEFAULT true;