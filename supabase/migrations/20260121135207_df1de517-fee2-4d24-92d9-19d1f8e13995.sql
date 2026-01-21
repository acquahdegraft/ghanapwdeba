-- Add privacy control to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public_directory BOOLEAN NOT NULL DEFAULT true;

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  location_type TEXT NOT NULL DEFAULT 'physical' CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
  virtual_link TEXT,
  max_attendees INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  event_type TEXT NOT NULL DEFAULT 'meetup' CHECK (event_type IN ('workshop', 'conference', 'meetup', 'training', 'social')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended', 'no_show')),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Published events viewable by authenticated users"
ON public.events
FOR SELECT
USING (is_published = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
USING (is_admin());

-- Event registrations policies
CREATE POLICY "Users can view their own registrations"
ON public.event_registrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own registration"
ON public.event_registrations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
ON public.event_registrations
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage all registrations"
ON public.event_registrations
FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;