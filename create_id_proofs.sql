-- Create id_proofs table
CREATE TABLE IF NOT EXISTS public.id_proofs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.id_proofs ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.id_proofs TO service_role;
GRANT SELECT ON public.id_proofs TO anon;
GRANT SELECT ON public.id_proofs TO authenticated;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.id_proofs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service_role" ON public.id_proofs
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Enable update for service_role" ON public.id_proofs
    FOR UPDATE TO service_role USING (true);

CREATE POLICY "Enable delete for service_role" ON public.id_proofs
    FOR DELETE TO service_role USING (true);
