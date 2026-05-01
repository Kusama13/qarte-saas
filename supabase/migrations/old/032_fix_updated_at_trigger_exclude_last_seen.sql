-- Fix: updated_at trigger should NOT fire when only last_seen_at changes
-- This prevents dashboard logins from polluting updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip updating updated_at if only last_seen_at changed
    IF TG_TABLE_NAME = 'merchants'
       AND OLD.last_seen_at IS DISTINCT FROM NEW.last_seen_at
       AND ROW(NEW.shop_name, NEW.shop_type, NEW.shop_address, NEW.phone, NEW.country,
               NEW.logo_url, NEW.primary_color, NEW.secondary_color,
               NEW.loyalty_mode, NEW.stamps_required, NEW.reward_description,
               NEW.tier2_enabled, NEW.tier2_stamps_required, NEW.tier2_reward_description,
               NEW.trial_ends_at, NEW.subscription_status,
               NEW.stripe_customer_id, NEW.stripe_subscription_id,
               NEW.shield_enabled)
        IS NOT DISTINCT FROM
           ROW(OLD.shop_name, OLD.shop_type, OLD.shop_address, OLD.phone, OLD.country,
               OLD.logo_url, OLD.primary_color, OLD.secondary_color,
               OLD.loyalty_mode, OLD.stamps_required, OLD.reward_description,
               OLD.tier2_enabled, OLD.tier2_stamps_required, OLD.tier2_reward_description,
               OLD.trial_ends_at, OLD.subscription_status,
               OLD.stripe_customer_id, OLD.stripe_subscription_id,
               OLD.shield_enabled)
    THEN
        NEW.updated_at = OLD.updated_at;
        RETURN NEW;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
