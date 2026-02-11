
-- Allow admins to insert into user_roles (currently only super_admins can)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin());

-- Allow admins to delete roles (currently only super_admins can via ALL policy)
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (is_admin());

-- Allow admins to insert permissions
CREATE POLICY "Admins can insert permissions"
ON public.admin_permissions
FOR INSERT
WITH CHECK (is_admin());

-- Allow admins to delete permissions
CREATE POLICY "Admins can delete permissions"
ON public.admin_permissions
FOR DELETE
USING (is_admin());
