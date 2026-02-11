
-- Grant full permissions to service_role and postgres
GRANT ALL ON TABLE public.admins TO service_role;
GRANT ALL ON TABLE public.admins TO postgres;
GRANT ALL ON TABLE public.admins TO anon;
GRANT ALL ON TABLE public.admins TO authenticated;

-- Ensure RLS is enabled (or disabled if you want to test)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy for Service Role to do everything (usually implicit, but good to be explicit if issues arise)
CREATE POLICY "Enable all for service_role" ON public.admins
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Debug: Allow anon read for registration check (since verifyAdminRegistration is public)
CREATE POLICY "Enable read for anon" ON public.admins
    FOR SELECT
    TO anon
    USING (true);
