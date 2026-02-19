
-- Create payment_logs table to capture Hubtel callback and status check JSON payloads
CREATE TABLE public.payment_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type text NOT NULL, -- 'callback' or 'status_check'
  transaction_reference text,
  payment_id uuid,
  raw_payload jsonb NOT NULL,
  parsed_status text,
  hubtel_status text,
  amount numeric,
  source_ip text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view payment logs"
  ON public.payment_logs
  FOR SELECT
  USING (is_admin());

-- Only service role can insert logs (via edge functions)
-- No INSERT policy for authenticated users — edge functions use service role key

-- Index for fast lookups
CREATE INDEX idx_payment_logs_reference ON public.payment_logs (transaction_reference);
CREATE INDEX idx_payment_logs_type ON public.payment_logs (log_type);
CREATE INDEX idx_payment_logs_created_at ON public.payment_logs (created_at DESC);
