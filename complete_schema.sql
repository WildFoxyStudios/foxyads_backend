-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For GeoLocation

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id TEXT UNIQUE DEFAULT '',
    name TEXT DEFAULT '',
    profile_image TEXT DEFAULT '',
    email TEXT DEFAULT '',
    password TEXT DEFAULT '',
    phone_number TEXT DEFAULT '',
    address TEXT DEFAULT '',
    login_type INTEGER DEFAULT 1,
    auth_identity TEXT DEFAULT '',
    fcm_token TEXT DEFAULT NULL,
    firebase_uid TEXT DEFAULT '',
    auth_provider TEXT DEFAULT '',
    average_rating NUMERIC DEFAULT 0,
    total_rating INTEGER DEFAULT 0,
    is_featured_seller BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_notifications_allowed BOOLEAN DEFAULT FALSE,
    is_contact_info_visible BOOLEAN DEFAULT FALSE,
    subscription_package JSONB DEFAULT NULL,
    feature_package JSONB DEFAULT NULL,
    is_subscription_expired BOOLEAN DEFAULT TRUE,
    is_feature_package_expired BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    enable_google_play BOOLEAN DEFAULT FALSE,
    enable_stripe BOOLEAN DEFAULT FALSE,
    stripe_public_key TEXT DEFAULT '',
    stripe_private_key TEXT DEFAULT '',
    enable_razorpay BOOLEAN DEFAULT FALSE,
    razorpay_key_id TEXT DEFAULT '',
    razorpay_secret_key TEXT DEFAULT '',
    enable_flutterwave BOOLEAN DEFAULT FALSE,
    flutterwave_key_id TEXT DEFAULT '',
    enable_paystack BOOLEAN DEFAULT FALSE,
    paystack_public_key TEXT DEFAULT '',
    paystack_secret_key TEXT DEFAULT '',
    enable_cashfree BOOLEAN DEFAULT FALSE,
    cashfree_client_id TEXT DEFAULT '',
    cashfree_secret_key TEXT DEFAULT '',
    enable_paypal BOOLEAN DEFAULT FALSE,
    paypal_client_id TEXT DEFAULT '',
    paypal_secret_key TEXT DEFAULT '',
    about_page_url TEXT DEFAULT '',
    privacy_policy_url TEXT DEFAULT '',
    terms_and_conditions_url TEXT DEFAULT '',
    agora_app_id TEXT DEFAULT '',
    agora_app_sign_key TEXT DEFAULT '',
    support_phone TEXT DEFAULT '',
    support_email TEXT DEFAULT '',
    max_video_duration_sec INTEGER DEFAULT 180,
    currency JSONB DEFAULT '{}',
    firebase_private_key JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AD LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.ad_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.users(id), -- Assuming internal relation
    category_id UUID REFERENCES public.categories(id),
    category_hierarchy UUID[], -- Array of category IDs
    attributes JSONB DEFAULT '[]',
    status INTEGER DEFAULT 1,
    rejection_note TEXT DEFAULT '',
    review_at TIMESTAMP WITH TIME ZONE,
    title TEXT NOT NULL,
    sub_title TEXT NOT NULL,
    description TEXT DEFAULT '',
    contact_number NUMERIC DEFAULT 0,
    available_units INTEGER DEFAULT 1,
    primary_image TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT '{}',
    location JSONB DEFAULT '{}',
    geo_location GEOGRAPHY(Point, 4326), -- PostGIS Point
    sale_type INTEGER DEFAULT 1,
    is_offer_allowed BOOLEAN DEFAULT FALSE,
    minimum_offer NUMERIC DEFAULT 0,
    price NUMERIC DEFAULT 0,
    current_auction_session TEXT DEFAULT NULL,
    is_auction_enabled BOOLEAN DEFAULT FALSE,
    auction_starting_price NUMERIC DEFAULT 0,
    auction_duration_days INTEGER DEFAULT 0,
    auction_start_date TIMESTAMP WITH TIME ZONE,
    auction_end_date TIMESTAMP WITH TIME ZONE,
    scheduled_publish_date TIMESTAMP WITH TIME ZONE,
    is_reserve_price_enabled BOOLEAN DEFAULT FALSE,
    reserve_price_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    admin_edit_notes TEXT DEFAULT '',
    is_promoted BOOLEAN DEFAULT FALSE,
    promoted_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PERMISSIONS (Existing fix included)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_listings ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES (Development Mode - Open Access)
-- WARNING: Lock this down for production!
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Ads" ON public.ad_listings FOR ALL USING (true) WITH CHECK (true);
