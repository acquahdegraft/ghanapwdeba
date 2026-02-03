-- Add webhook verification token column to payments table
-- This token is generated when creating a payment and verified when the callback arrives
-- Once used, the token is cleared to prevent replay attacks

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS webhook_token TEXT;

-- Create an index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_payments_webhook_token 
ON public.payments(webhook_token) 
WHERE webhook_token IS NOT NULL;