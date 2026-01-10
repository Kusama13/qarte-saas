-- Qarte SaaS Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MERCHANTS TABLE
-- ============================================
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    shop_name TEXT NOT NULL,
    shop_type TEXT NOT NULL,
    shop_address TEXT,
    phone TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#654EDA',
    secondary_color TEXT DEFAULT '#9D8FE8',
    program_name TEXT,
    welcome_message TEXT,
    promo_message TEXT,
    stamps_required INTEGER DEFAULT 10 CHECK (stamps_required > 0 AND stamps_required <= 50),
    reward_description TEXT,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_slug ON merchants(slug);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone lookups
CREATE INDEX idx_customers_phone ON customers(phone_number);

-- ============================================
-- LOYALTY CARDS TABLE
-- ============================================
CREATE TABLE loyalty_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE NOT NULL,
    current_stamps INTEGER DEFAULT 0 CHECK (current_stamps >= 0),
    last_visit_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, merchant_id)
);

-- Indexes for faster queries
CREATE INDEX idx_loyalty_cards_customer ON loyalty_cards(customer_id);
CREATE INDEX idx_loyalty_cards_merchant ON loyalty_cards(merchant_id);

-- ============================================
-- VISITS TABLE
-- ============================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_card_id UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE NOT NULL,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT
);

-- Indexes
CREATE INDEX idx_visits_loyalty_card ON visits(loyalty_card_id);
CREATE INDEX idx_visits_merchant ON visits(merchant_id);
CREATE INDEX idx_visits_visited_at ON visits(visited_at);

-- ============================================
-- REDEMPTIONS TABLE
-- ============================================
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_card_id UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE NOT NULL,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    stamps_used INTEGER NOT NULL CHECK (stamps_used > 0)
);

-- Indexes
CREATE INDEX idx_redemptions_loyalty_card ON redemptions(loyalty_card_id);
CREATE INDEX idx_redemptions_merchant ON redemptions(merchant_id);
CREATE INDEX idx_redemptions_redeemed_at ON redemptions(redeemed_at);

-- ============================================
-- CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate slug from shop name
CREATE OR REPLACE FUNCTION generate_slug(shop_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := LOWER(TRIM(shop_name));
    base_slug := REGEXP_REPLACE(base_slug, '[àáâãäå]', 'a', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[èéêë]', 'e', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[ìíîï]', 'i', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[òóôõö]', 'o', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[ùúûü]', 'u', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[ç]', 'c', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);

    final_slug := base_slug;

    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM merchants WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_cards_updated_at
    BEFORE UPDATE ON loyalty_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Merchants policies
CREATE POLICY "Merchants can view their own profile"
    ON merchants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Merchants can update their own profile"
    ON merchants FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Merchants can insert their own profile"
    ON merchants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Public read access to merchants for customer scanning
CREATE POLICY "Public can view merchant by slug"
    ON merchants FOR SELECT
    USING (true);

-- Customers policies (allow public creation and self-management)
CREATE POLICY "Anyone can create customers"
    ON customers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can view customers"
    ON customers FOR SELECT
    USING (true);

CREATE POLICY "Anyone can update customers"
    ON customers FOR UPDATE
    USING (true);

-- Loyalty cards policies
CREATE POLICY "Merchants can view their loyalty cards"
    ON loyalty_cards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM merchants
            WHERE merchants.id = loyalty_cards.merchant_id
            AND merchants.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view and create loyalty cards"
    ON loyalty_cards FOR ALL
    USING (true)
    WITH CHECK (true);

-- Visits policies
CREATE POLICY "Merchants can view their visits"
    ON visits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM merchants
            WHERE merchants.id = visits.merchant_id
            AND merchants.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can create visits"
    ON visits FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can view visits"
    ON visits FOR SELECT
    USING (true);

-- Redemptions policies
CREATE POLICY "Merchants can view their redemptions"
    ON redemptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM merchants
            WHERE merchants.id = redemptions.merchant_id
            AND merchants.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can create and view redemptions"
    ON redemptions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Contact messages (anyone can insert, only admin can view)
CREATE POLICY "Anyone can submit contact messages"
    ON contact_messages FOR INSERT
    WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET FOR LOGOS
-- ============================================

-- Run this in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policy for logos (run in SQL editor)
-- CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
-- CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update their own logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete their own logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
