-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. GEOGRAPHY
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT DEFAULT '',
    phone_code TEXT DEFAULT '',
    currency TEXT DEFAULT '',
    currency_name TEXT DEFAULT '',
    currency_symbol TEXT DEFAULT '',
    tld TEXT DEFAULT '',
    native TEXT DEFAULT '',
    region TEXT DEFAULT '',
    subregion TEXT DEFAULT '',
    nationality TEXT DEFAULT '',
    latitude NUMERIC DEFAULT 0,
    longitude NUMERIC DEFAULT 0,
    emoji TEXT DEFAULT '',
    emoji_u TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    country_id UUID REFERENCES public.countries(id),
    name TEXT,
    state_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    state_id UUID REFERENCES public.states(id),
    name TEXT,
    latitude NUMERIC DEFAULT 0,
    longitude NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CONTENT & MISC
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image TEXT DEFAULT '',
    redirect_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    slug TEXT,
    image TEXT,
    tags TEXT[],
    description TEXT,
    trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_reasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADMIN & STAFF
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    permissions JSONB DEFAULT '[]', -- [{module: 'User', actions: ['create', 'read']}]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staffs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id TEXT DEFAULT '',
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role_id UUID REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ATTRIBUTES (Dynamic Fields)
CREATE TABLE IF NOT EXISTS public.attributes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    field_type INTEGER NOT NULL, -- 1:Number, 2:Text, 3:File, 4:Radio, 5:Dropdown, 6:Checkbox
    values TEXT[] DEFAULT '{}',
    min_length INTEGER DEFAULT 0,
    max_length INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    category_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attributes_category ON public.attributes(category_id);

-- 5. SOCIAL & INTERACTIONS
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id),
    to_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blocker_id UUID REFERENCES public.users(id),
    blocked_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES public.users(id),
    reviewee_id UUID REFERENCES public.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT DEFAULT '',
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_type INTEGER NOT NULL,
    user_id UUID REFERENCES public.users(id), -- Reporter
    ad_id UUID REFERENCES public.ad_listings(id) DEFAULT NULL,
    reported_user_id UUID REFERENCES public.users(id) DEFAULT NULL,
    ad_video_id UUID DEFAULT NULL, -- FK added later
    reason TEXT DEFAULT '',
    status INTEGER DEFAULT 1,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. VIDEO FEATURES
CREATE TABLE IF NOT EXISTS public.ad_videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    uploader_id UUID REFERENCES public.users(id),
    ad_id UUID REFERENCES public.ad_listings(id),
    video_url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    caption TEXT DEFAULT '',
    shares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_video_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_video_id UUID REFERENCES public.ad_videos(id),
    user_id UUID REFERENCES public.users(id),
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.video_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.ad_videos(id),
    user_id UUID REFERENCES public.users(id),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update reports to reference ad_videos
ALTER TABLE public.reports ADD CONSTRAINT fk_reports_ad_video FOREIGN KEY (ad_video_id) REFERENCES public.ad_videos(id);


-- 7. ENGAGEMENT (Favorites, Likes, Views)
CREATE TABLE IF NOT EXISTS public.ad_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_id UUID REFERENCES public.ad_listings(id),
    user_id UUID REFERENCES public.users(id),
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_id UUID REFERENCES public.ad_listings(id),
    user_id UUID REFERENCES public.users(id),
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_id UUID REFERENCES public.ad_listings(id),
    user_id UUID REFERENCES public.users(id),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. COMMUNICATIONS (Chat & Notifications)
CREATE TABLE IF NOT EXISTS public.chat_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id),
    receiver_id UUID REFERENCES public.users(id),
    ad_id UUID REFERENCES public.ad_listings(id),
    chat_id UUID DEFAULT NULL, -- Will reference last message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_topic_id UUID REFERENCES public.chat_topics(id),
    sender_id UUID REFERENCES public.users(id),
    message_type INTEGER,
    message TEXT DEFAULT '',
    image TEXT DEFAULT '',
    audio TEXT DEFAULT '',
    gift_type INTEGER DEFAULT 0,
    gift_count INTEGER DEFAULT 0,
    is_read BOOLEAN DEFAULT FALSE,
    call_id UUID DEFAULT NULL,
    call_type INTEGER,
    call_duration TEXT DEFAULT '',
    date TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recursive FK for chat_topics.chat_id
ALTER TABLE public.chat_topics ADD CONSTRAINT fk_chat_topics_last_message FOREIGN KEY (chat_id) REFERENCES public.chats(id);


CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    send_type TEXT,
    user_id UUID REFERENCES public.users(id),
    ad_id UUID REFERENCES public.ad_listings(id),
    title TEXT DEFAULT '',
    message TEXT DEFAULT '',
    image TEXT DEFAULT '',
    date TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. COMMERCE
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    ad_id UUID REFERENCES public.ad_listings(id),
    offer_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auction_bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auction_session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id),
    seller_id UUID REFERENCES public.users(id),
    ad_id UUID REFERENCES public.ad_listings(id),
    attributes JSONB DEFAULT '[]',
    starting_bid NUMERIC DEFAULT 0,
    current_bid NUMERIC DEFAULT 0,
    is_winning_bid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    ios_product_id TEXT,
    price NUMERIC NOT NULL,
    discount NUMERIC NOT NULL,
    final_price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    days JSONB DEFAULT '{}', -- {isLimited: true, value: 30}
    advertisements JSONB DEFAULT '{}', -- {isLimited: true, value: 5}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feature_ad_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    ios_product_id TEXT,
    price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    final_price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    days INTEGER DEFAULT 0,
    advertisement_limit INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_histories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    package_id UUID NOT NULL, -- Logical Ref
    package_type TEXT NOT NULL,
    package_details JSONB NOT NULL,
    amount NUMERIC NOT NULL,
    payment_gateway TEXT NOT NULL,
    transaction_id TEXT,
    currency TEXT DEFAULT 'INR',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_id TEXT DEFAULT '',
    user_id UUID REFERENCES public.users(id),
    id_proof TEXT DEFAULT '',
    id_proof_front_url TEXT DEFAULT '',
    id_proof_back_url TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    status INTEGER DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERMISSIONS & RLS (Apply to ALL new tables)
-- =============================================

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns') 
    LOOP
        EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres', t);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO anon', t);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO authenticated', t);
        
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- Create open policy if not exists (Simplified for dev)
        EXECUTE format('DROP POLICY IF EXISTS "Public Access %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Public Access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END$$;
