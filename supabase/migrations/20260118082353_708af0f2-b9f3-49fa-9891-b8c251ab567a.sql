-- Create enum for membership status
CREATE TYPE public.membership_status AS ENUM ('active', 'pending', 'suspended', 'expired');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for disability types
CREATE TYPE public.disability_type AS ENUM ('physical', 'visual', 'hearing', 'intellectual', 'psychosocial', 'multiple', 'other');

-- Create membership_types table
CREATE TABLE public.membership_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  annual_dues DECIMAL(10,2) NOT NULL DEFAULT 0,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for member information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  business_type TEXT,
  disability_type public.disability_type,
  region TEXT,
  city TEXT,
  membership_type_id UUID REFERENCES public.membership_types(id),
  membership_status public.membership_status NOT NULL DEFAULT 'pending',
  membership_start_date DATE,
  membership_expiry_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for dues tracking
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'membership_dues',
  payment_method TEXT,
  transaction_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_types (public read)
CREATE POLICY "Anyone can view membership types"
  ON public.membership_types FOR SELECT
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_membership_types_updated_at
  BEFORE UPDATE ON public.membership_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default membership types
INSERT INTO public.membership_types (name, description, annual_dues, benefits) VALUES
  ('Standard', 'Basic membership with access to all standard benefits', 100.00, ARRAY['Member directory access', 'Monthly newsletter', 'Event discounts']),
  ('Premium', 'Enhanced membership with additional business support', 250.00, ARRAY['All Standard benefits', 'Business mentorship', 'Priority event registration', 'Networking opportunities']),
  ('Corporate', 'For businesses employing PWDs', 500.00, ARRAY['All Premium benefits', 'Company listing', 'Recruitment support', 'CSR recognition']);