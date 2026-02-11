-- Complete migration to add all missing columns to users table
-- Based on the original Mongoose User model

-- Add all missing columns with proper defaults
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_id TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unique_id TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_image TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';

-- Authentication related
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_type INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_identity TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT '';

-- Ratings
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_rating NUMERIC DEFAULT 0;

-- Flags and status
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_featured_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_notifications_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_contact_info_visible BOOLEAN DEFAULT FALSE;

-- Subscription and packages
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_package JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS feature_package JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_package_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_subscription_expired BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_feature_package_expired BOOLEAN DEFAULT TRUE;

-- Timestamps
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS registered_at TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON public.users(profile_id);
CREATE INDEX IF NOT EXISTS idx_users_unique_id ON public.users(unique_id);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users(user_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON public.users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Add comments for documentation
COMMENT ON COLUMN public.users.profile_id IS 'Unique profile identifier';
COMMENT ON COLUMN public.users.unique_id IS 'User unique ID for display/search';
COMMENT ON COLUMN public.users.user_name IS 'Username (distinct from display name)';
COMMENT ON COLUMN public.users.login_type IS '1:mobile, 2:google, 3:apple, 4:email-password';
