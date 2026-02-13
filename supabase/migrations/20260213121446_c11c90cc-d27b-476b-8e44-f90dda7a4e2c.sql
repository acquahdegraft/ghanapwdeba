
CREATE POLICY "Anyone can view active membership types"
ON public.membership_types
FOR SELECT
USING (is_active = true);
