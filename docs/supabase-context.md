# Supabase Context — Qarte SaaS

> Source unique du schema DB, regles et conventions Supabase.
> A consulter AVANT toute modification touchant la base de donnees.
> Pour le contexte projet (fonctionnalites, API, modes fidelite), voir `docs/context.md`.

---

## 1. Clients Supabase (src/lib/supabase.ts)

| Client | Fonction | Cle utilisee | Contexte |
|--------|----------|--------------|----------|
| `getSupabase()` / `getBrowserClient()` | Singleton navigateur | `ANON_KEY` | Composants client (RLS appliquee) |
| `getSupabaseAdmin()` / `supabaseAdmin()` | Singleton serveur | `SERVICE_ROLE_KEY` | API routes — bypass RLS |
| `createRouteHandlerSupabaseClient()` | Par requete (SSR cookies) | `ANON_KEY` + cookies | Route handlers avec auth utilisateur |

**Regle** : Ne jamais utiliser `SERVICE_ROLE_KEY` cote client. Le client navigateur est un singleton reutilise.

---

## 2. Schema complet par table

### 2.1 merchants

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `uuid_generate_v4()` | |
| user_id | UUID FK → auth.users | NOT NULL | ON DELETE CASCADE, UNIQUE (mig 049) |
| slug | TEXT | NOT NULL | UNIQUE, auto-genere via `generate_slug()` |
| shop_name | TEXT | NOT NULL | |
| shop_type | TEXT | NOT NULL | CHECK via mig 047 (liste definie) |
| shop_address | TEXT | NULL | |
| phone | TEXT | NOT NULL | E.164 sans + |
| logo_url | TEXT | NULL | |
| primary_color | TEXT | `'#654EDA'` | |
| secondary_color | TEXT | `'#9D8FE8'` | |
| program_name | TEXT | NULL | |
| welcome_message | TEXT | NULL | |
| promo_message | TEXT | NULL | |
| stamps_required | INTEGER | `10` | CHECK (1..15) — mig 054 (etait 1..50) |
| reward_description | TEXT | NULL | NULL = isFirstSetup |
| trial_ends_at | TIMESTAMPTZ | `NOW() + 7 days` | mig 034 (etait 14j, corrige a 7j mig 026+034) |
| stripe_customer_id | TEXT | NULL | |
| stripe_subscription_id | TEXT | NULL | mig 028/029 |
| subscription_status | TEXT | `'trial'` | CHECK (trial, active, canceled, canceling, past_due) — mig 027 |
| subscription_plan | TEXT | NULL | mig 029 |
| onboarding_completed | BOOLEAN | `FALSE` | |
| loyalty_mode | TEXT | `'visit'` | CHECK (visit, cagnotte) — mig 003+050 |
| review_link | TEXT | NULL | mig 003 |
| scan_code | TEXT | NULL | UNIQUE, mig 008b |
| tier2_enabled | BOOLEAN | `FALSE` | mig 016 |
| tier2_stamps_required | INTEGER | NULL | CHECK > stamps_required AND <= 30 — mig 054 |
| tier2_reward_description | TEXT | NULL | mig 016 |
| cagnotte_percent | NUMERIC(5,2) | NULL | mig 050 |
| cagnotte_tier2_percent | NUMERIC(5,2) | NULL | mig 050 |
| shield_enabled | BOOLEAN | `TRUE` | mig 019 |
| birthday_gift_enabled | BOOLEAN | `FALSE` | mig 037 |
| birthday_gift_description | TEXT | NULL | mig 037 |
| referral_code | TEXT | NULL | UNIQUE, mig 033 |
| referral_program_enabled | BOOLEAN | `FALSE` | mig 035 |
| referral_reward_referrer | TEXT | NULL | mig 035 |
| referral_reward_referred | TEXT | NULL | mig 035 |
| welcome_offer_enabled | BOOLEAN | `FALSE` | mig 056 |
| welcome_offer_description | TEXT | NULL | mig 056 |
| welcome_referral_code | TEXT | NULL | UNIQUE partial, mig 056 |
| double_days_enabled | BOOLEAN | `FALSE` | mig 048 |
| double_days_of_week | TEXT | `'[]'` | JSON array JS getDay() values, mig 048 |
| country | VARCHAR(2) | `'FR'` | mig 029 |
| custom_scan_message | TEXT | NULL | mig 047 |
| no_contact | BOOLEAN | `FALSE` | mig 036 |
| admin_notes | TEXT | NULL | mig 036 |
| pwa_installed | BOOLEAN | `FALSE` | mig 043 |
| pwa_installed_at | TIMESTAMPTZ | NULL | mig 043 |
| pwa_offer_text | TEXT | NULL | mig 013 |
| offer_active | BOOLEAN | `FALSE` | mig 011 |
| offer_title | TEXT | NULL | mig 011 |
| offer_description | TEXT | NULL | mig 011 |
| offer_image_url | TEXT | NULL | mig 011 |
| offer_expires_at | TIMESTAMPTZ | NULL | mig 011 |
| offer_duration_days | INTEGER | `1` | CHECK 1-3 ou NULL, mig 011 |
| offer_created_at | TIMESTAMPTZ | NULL | mig 011 |
| instagram_url | TEXT | NULL | mig 051 |
| facebook_url | TEXT | NULL | mig 051 |
| tiktok_url | TEXT | NULL | mig 051 |
| snapchat_url | TEXT | NULL | mig 051 |
| whatsapp_url | TEXT | NULL | mig 079 |
| booking_url | TEXT | NULL | mig 051 |
| billing_interval | TEXT | `'monthly'` | mig 051 |
| planning_enabled | BOOLEAN | `FALSE` | mig 063 |
| planning_message | TEXT | NULL | mig 063 |
| booking_message | TEXT | NULL | mig 064 |
| planning_message_expires | DATE | NULL | mig 064 |
| auto_booking_enabled | BOOLEAN | `FALSE` | NOT NULL, mig 083 |
| deposit_link | TEXT | NULL | mig 083, lien externe paiement acompte |
| deposit_percent | INTEGER | NULL | mig 083, % acompte (mutuellement exclusif avec deposit_amount) |
| deposit_amount | DECIMAL(10,2) | NULL | mig 083, montant fixe acompte (mutuellement exclusif avec deposit_percent) |
| deposit_message | TEXT | NULL | mig 083, message libre acompte |
| show_public_page_on_card | BOOLEAN | `FALSE` | NOT NULL, mig 067 (toggle UI retire, colonne conservee) |
| signup_source | TEXT | NULL | mig 068 |
| locale | TEXT | `'fr'` | NOT NULL, mig 069 |
| first_feature_choice | TEXT | NULL | mig 070, values: 'loyalty', 'vitrine' |
| deleted_at | TIMESTAMPTZ | NULL | mig 077, soft-delete (filtre `is('deleted_at', null)` sur routes publiques) |
| bio | TEXT | NULL | mig 061 |
| opening_hours | JSONB | NULL | mig 062 |
| last_seen_at | TIMESTAMPTZ | NULL | mig 031 |
| created_at | TIMESTAMPTZ | `NOW()` | |
| updated_at | TIMESTAMPTZ | `NOW()` | Trigger auto (exclut last_seen_at mig 032) |

**Colonnes supprimees** : `product_name`, `max_quantity_per_scan` (mig 050, mode article purge)

**Indexes** : `idx_merchants_user_id`, `idx_merchants_slug`, `idx_merchants_scan_code`

**Trigger** : `update_merchants_updated_at` → `update_updated_at_column()` (exclut `last_seen_at` depuis mig 032)

---

### 2.2 customers

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `uuid_generate_v4()` | |
| phone_number | TEXT | NOT NULL | UNIQUE |
| first_name | TEXT | NOT NULL | |
| last_name | TEXT | NULL | |
| merchant_id | UUID FK → merchants | NULL | mig 039, ON DELETE CASCADE |
| birth_month | INTEGER | NULL | CHECK (1..12), mig 037 |
| birth_day | INTEGER | NULL | CHECK (1..31), mig 037 |
| instagram_handle | TEXT | NULL | mig 073 |
| tiktok_handle | TEXT | NULL | mig 073 |
| facebook_url | TEXT | NULL | mig 073 |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Indexes** : `idx_customers_phone`, `idx_customers_merchant`, `idx_customers_birthday`

---

### 2.3 loyalty_cards

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `uuid_generate_v4()` | |
| customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| current_stamps | INTEGER | `0` | CHECK (>= 0) |
| current_amount | NUMERIC(10,2) | `0.00` | NOT NULL, mig 050 |
| stamps_target | INTEGER | NULL | mig 003 — grandfathering |
| rewards_earned | INTEGER | `0` | mig 039 |
| referral_code | VARCHAR(10) | NULL | mig 035 |
| last_visit_date | DATE | NULL | |
| created_at | TIMESTAMPTZ | `NOW()` | |
| updated_at | TIMESTAMPTZ | `NOW()` | Trigger auto |

**Contrainte** : UNIQUE(customer_id, merchant_id)

**Indexes** : `idx_loyalty_cards_customer`, `idx_loyalty_cards_merchant`, `idx_loyalty_cards_referral_code` (partial, NOT NULL)

**Trigger** : `update_loyalty_cards_updated_at`

**REGLE IMPERATIVE** : Toujours initialiser `current_amount: 0` a la creation (pas NULL), meme en mode visit. Protege le switch de mode.

---

### 2.4 visits

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `uuid_generate_v4()` | |
| loyalty_card_id | UUID FK → loyalty_cards | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| **visited_at** | TIMESTAMPTZ | `NOW()` | **PAS created_at** |
| ip_address | TEXT | NULL | |
| ip_hash | TEXT | NULL | SHA256, mig 005 |
| points_earned | INTEGER | `1` | mig 003+005 |
| status | TEXT | `'confirmed'` | CHECK (confirmed, pending, rejected), mig 005 |
| flagged_reason | TEXT | NULL | mig 005 |
| amount_spent | NUMERIC(10,2) | NULL | mig 050 — mode cagnotte |

**Indexes** : `idx_visits_loyalty_card`, `idx_visits_merchant`, `idx_visits_visited_at`, `idx_visits_merchant_status` (partial: pending), `idx_visits_daily_count`, `idx_visits_status`

**Colonne date : `visited_at` — JAMAIS `created_at`**

---

### 2.5 redemptions

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `uuid_generate_v4()` | |
| loyalty_card_id | UUID FK → loyalty_cards | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| **redeemed_at** | TIMESTAMPTZ | `NOW()` | **PAS created_at** |
| stamps_used | INTEGER | NOT NULL | CHECK (> 0) |
| tier | INTEGER | `1` | CHECK (1, 2), mig 017 |
| amount_accumulated | NUMERIC(10,2) | NULL | mig 050 — cagnotte |
| reward_percent | NUMERIC(5,2) | NULL | mig 050 — cagnotte |
| reward_value | NUMERIC(10,2) | NULL | mig 050 — cagnotte |

**Indexes** : `idx_redemptions_loyalty_card`, `idx_redemptions_merchant`, `idx_redemptions_redeemed_at`

**Colonne date : `redeemed_at` — JAMAIS `created_at`**

---

### 2.6 point_adjustments

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| loyalty_card_id | UUID FK → loyalty_cards | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| adjustment | INTEGER | NOT NULL | |
| reason | TEXT | NULL | |
| adjusted_by | UUID FK → auth.users | NOT NULL | ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | `NOW()` | Migration dit `created_at` |

**ATTENTION — Divergence schema** : La migration 002 definit `created_at`, mais la colonne reelle en prod est `adjusted_at` (renommee manuellement). Le code utilise `adjusted_at` partout.

**Colonne date en prod : `adjusted_at` — PAS `created_at`**

**Indexes** : `idx_point_adjustments_loyalty_card`, `idx_point_adjustments_merchant`, `idx_point_adjustments_created_at`

---

### 2.7 vouchers

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| loyalty_card_id | UUID FK → loyalty_cards | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| reward_description | TEXT | NOT NULL | |
| tier | INTEGER | `1` | CHECK (1, 2) |
| source | TEXT | NULL | CHECK (birthday, referral, redemption, welcome), mig 037 |
| is_used | BOOLEAN | `FALSE` | |
| used_at | TIMESTAMPTZ | NULL | |
| expires_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Indexes** : `idx_vouchers_loyalty_card`, `idx_vouchers_merchant`, `idx_vouchers_customer`, `idx_vouchers_is_used`, `idx_vouchers_source_customer` (partial: birthday)

---

### 2.8 contact_messages

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `uuid_generate_v4()` |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| subject | TEXT | NOT NULL |
| message | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | `NOW()` |

---

### 2.9 banned_numbers (mig 004)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| merchant_id | UUID FK → merchants | NOT NULL, ON DELETE CASCADE |
| phone_number | TEXT | NOT NULL |
| reason | TEXT | NULL |
| created_at | TIMESTAMPTZ | `NOW()` |

**Contrainte** : UNIQUE(phone_number, merchant_id)
**Index** : `idx_banned_numbers_merchant_phone`

---

### 2.10 pending_email_tracking (mig 005)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| merchant_id | UUID FK → merchants | NOT NULL, ON DELETE CASCADE |
| reminder_day | INTEGER | NOT NULL |
| sent_at | TIMESTAMPTZ | `NOW()` |
| pending_count | INTEGER | NOT NULL |

**Contrainte** : UNIQUE(merchant_id, reminder_day)

---

### 2.11 push_history (mig 006)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| merchant_id | UUID FK → merchants | NOT NULL, ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| body | TEXT | NOT NULL |
| filter_type | TEXT | `'all'` |
| sent_count | INTEGER | `0` |
| failed_count | INTEGER | `0` |
| created_at | TIMESTAMPTZ | `NOW()` |

**Indexes** : `idx_push_history_merchant`, `idx_push_history_created`

---

### 2.12 push_subscriptions (mig 008)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| customer_id | UUID FK → customers | NOT NULL, ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NULL, ON DELETE CASCADE | ajout ulterieur |
| endpoint | TEXT | NOT NULL |
| p256dh | TEXT | NOT NULL |
| auth | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | `NOW()` |
| updated_at | TIMESTAMPTZ | `NOW()` |

**Contrainte** : UNIQUE(endpoint)
**Indexes** : `idx_push_subscriptions_customer`, `idx_push_subscriptions_endpoint`, `idx_push_subs_customer_merchant`, `idx_push_subs_merchant`

---

### 2.13 super_admins (mig 023)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| user_id | UUID FK → auth.users | NOT NULL, UNIQUE, ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | `NOW()` |

---

### 2.14 referrals (mig 035)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| referrer_customer_id | UUID FK → customers | NULL | ON DELETE CASCADE, NULL = Qarte (welcome offer), mig 056 |
| referrer_card_id | UUID FK → loyalty_cards | NULL | ON DELETE CASCADE, NULL = Qarte (welcome offer), mig 056 |
| referred_customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| referred_card_id | UUID FK → loyalty_cards | NOT NULL | ON DELETE CASCADE |
| referred_voucher_id | UUID FK → vouchers | NULL | ON DELETE SET NULL |
| referrer_voucher_id | UUID FK → vouchers | NULL | ON DELETE SET NULL |
| status | TEXT | `'pending'` | CHECK (pending, completed) |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Indexes** : `idx_referrals_merchant`, `idx_referrals_referred_voucher`, `idx_referrals_status`, `idx_referrals_referrer_customer`, `idx_referrals_referred_customer`, `idx_referrals_referrer_card`, `idx_referrals_referred_card`, `idx_referrals_referrer_voucher`

---

### 2.15 admin_expenses (mig 021)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| name | TEXT | NOT NULL | |
| category | TEXT | NOT NULL | CHECK (infra, marketing, fb_ads, outils, autre) |
| amount | DECIMAL(10,2) | NOT NULL | |
| month | VARCHAR(7) | NOT NULL | Format YYYY-MM |
| is_recurring | BOOLEAN | `FALSE` | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_admin_expenses_month`

---

### 2.16 admin_fixed_costs (mig 022)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| name | TEXT | NOT NULL | |
| category | TEXT | NOT NULL | CHECK (infra, marketing, fb_ads, outils, autre) |
| monthly_amount | DECIMAL(10,2) | `0` | |
| is_active | BOOLEAN | `TRUE` | |
| created_at | TIMESTAMPTZ | `NOW()` | |
| updated_at | TIMESTAMPTZ | `NOW()` | |

---

### ~~2.17 demo_leads~~ — SUPPRIMEE (mig 053)

### ~~2.18 tool_leads~~ — SUPPRIMEE (mig 053)

---

### 2.19 admin_announcements (mig 044+045)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| title | TEXT | NOT NULL | |
| body | TEXT | NOT NULL | |
| type | TEXT | `'info'` | CHECK (info, warning, success, urgent) |
| target_filter | TEXT | `'all'` | CHECK (all, trial, active, pwa_installed, admin) |
| is_published | BOOLEAN | `FALSE` | |
| published_at | TIMESTAMPTZ | NULL | |
| duration_days | INTEGER | NULL | NULL = pas d'expiration |
| expires_at | TIMESTAMPTZ | NULL | |
| link_url | TEXT | NULL | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_admin_announcements_published` (partial, WHERE is_published = true)

### 2.19b admin_announcement_dismissals (mig 044)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| announcement_id | UUID FK → admin_announcements | NOT NULL, ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL, ON DELETE CASCADE |
| dismissed_at | TIMESTAMPTZ | `NOW()` |

**Contrainte** : UNIQUE(announcement_id, merchant_id)

---

### 2.20 member_programs (mig 018)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| name | TEXT | NOT NULL | |
| benefit_label | TEXT | NOT NULL | |
| duration_months | NUMERIC(6,2) | `12` | CHECK (> 0) |
| is_active | BOOLEAN | `TRUE` | |
| created_at | TIMESTAMPTZ | `NOW()` | |

### 2.21 member_cards (mig 018)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| program_id | UUID FK → member_programs | NOT NULL | ON DELETE CASCADE |
| customer_id | UUID FK → customers | NOT NULL | ON DELETE CASCADE |
| valid_from | TIMESTAMPTZ | `NOW()` | NOT NULL |
| valid_until | TIMESTAMPTZ | | NOT NULL |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Contrainte** : UNIQUE(program_id, customer_id)

### 2.22 reactivation_email_tracking (mig 028)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| day_sent | INTEGER | NOT NULL | Valeurs: 7, 14, 30 |
| sent_at | TIMESTAMPTZ | `NOW()` | |

**Contrainte** : UNIQUE(merchant_id, day_sent)
**Index** : `idx_reactivation_tracking_sent_at`

### 2.23 push_automations (mig 007)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| merchant_id | UUID FK → merchants | NOT NULL, ON DELETE CASCADE, UNIQUE |
| welcome_enabled | BOOLEAN | `FALSE` |
| close_to_reward_enabled | BOOLEAN | `FALSE` |
| reward_ready_enabled | BOOLEAN | `FALSE` |
| inactive_reminder_enabled | BOOLEAN | `FALSE` |
| reward_reminder_enabled | BOOLEAN | `FALSE` |
| welcome_sent | INTEGER | `0` |
| close_to_reward_sent | INTEGER | `0` |
| reward_ready_sent | INTEGER | `0` |
| inactive_reminder_sent | INTEGER | `0` |
| reward_reminder_sent | INTEGER | `0` |
| events_enabled | BOOLEAN | `FALSE` | mig 040 |
| events_offer_text | TEXT | NULL | mig 040 |
| events_sent | INTEGER | `0` | mig 040 |
| inactive_reminder_offer_text | TEXT | NULL | mig 040 |
| created_at | TIMESTAMPTZ | `NOW()` |
| updated_at | TIMESTAMPTZ | `NOW()` | Trigger auto mig 042 |

### 2.24 push_automation_logs (mig 007)

| Colonne | Type | Default |
|---------|------|---------|
| id | UUID PK | `gen_random_uuid()` |
| merchant_id | UUID FK → merchants | NOT NULL, ON DELETE CASCADE |
| customer_id | UUID FK → customers | NOT NULL, ON DELETE CASCADE |
| automation_type | TEXT | NOT NULL |
| sent_at | TIMESTAMPTZ | `NOW()` |

**Contrainte** : UNIQUE(merchant_id, customer_id, automation_type, sent_at::date)

### 2.25 scheduled_push (mig 009)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| title | TEXT | NOT NULL | |
| body | TEXT | NOT NULL | |
| scheduled_time | VARCHAR(5) | NOT NULL | CHECK (10:00, 18:00) |
| scheduled_date | DATE | NOT NULL | |
| status | VARCHAR(20) | `'pending'` | CHECK (pending, sent, failed) |
| sent_at | TIMESTAMPTZ | NULL | |
| sent_count | INTEGER | `0` | |
| failed_count | INTEGER | `0` | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Contrainte** : UNIQUE(merchant_id, scheduled_time, scheduled_date)
**Index partiel** : `idx_scheduled_push_pending` WHERE status = 'pending'

### 2.26 admin_notes (mig 015)

Single-row table : id, content (TEXT, default ''), updated_at

### 2.27 admin_tasks (mig 015)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| title | TEXT | NOT NULL | |
| completed | BOOLEAN | `FALSE` | |
| priority | TEXT | `'normal'` | CHECK (low, normal, high) |
| due_date | DATE | NULL | |
| created_at | TIMESTAMPTZ | `NOW()` | |
| completed_at | TIMESTAMPTZ | NULL | |

### 2.28 prospects (mig 015)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| business_name | TEXT | NOT NULL | |
| contact_name | TEXT | NULL | |
| phone | TEXT | NULL | |
| email | TEXT | NULL | |
| address | TEXT | NULL | |
| source | TEXT | NULL | (cold_call, referral, website, social, other) |
| status | TEXT | `'new'` | CHECK (new, contacted, demo_scheduled, demo_done, trial, converted, lost) |
| notes | TEXT | NULL | |
| next_followup | DATE | NULL | |
| converted_merchant_id | UUID FK → merchants | NULL | ON DELETE SET NULL |
| created_at | TIMESTAMPTZ | `NOW()` | |
| updated_at | TIMESTAMPTZ | `NOW()` | |

### ~~2.29 push_automation_events~~ — SUPPRIMEE (mig 053)

### 2.30 revenue_snapshots (mig 051)
### 2.31 merchant_photos (mig 055)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| url | TEXT | NOT NULL | |
| position | SMALLINT | `1` | CHECK (1..6) |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public, INSERT/UPDATE/DELETE merchant own
**Index** : `idx_merchant_photos_merchant`, UNIQUE(merchant_id, position)
**Max** : 6 photos par merchant

### 2.32 merchant_service_categories (mig 057)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| name | TEXT | NOT NULL | |
| position | INTEGER | `0` | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public, ALL merchant own
**Index** : `idx_merchant_service_categories_merchant`

### 2.33 merchant_services (mig 057)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| category_id | UUID FK → merchant_service_categories | NULL | ON DELETE SET NULL |
| name | TEXT | NOT NULL | |
| price | DECIMAL(10,2) | NOT NULL | |
| position | INTEGER | `0` | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public, ALL merchant own
**Index** : `idx_merchant_services_merchant`, `idx_merchant_services_category`

---

### 2.34 merchant_offers (mig 060)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| title | TEXT | NOT NULL | |
| description | TEXT | NOT NULL | |
| active | BOOLEAN | `true` | |
| starts_at | TIMESTAMPTZ | `NOW()` | |
| expires_at | TIMESTAMPTZ | NULL | |
| max_claims | INTEGER | NULL | |
| claim_count | INTEGER | `0` | |
| offer_code | TEXT | NOT NULL | `encode(gen_random_bytes(6), 'hex')` |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public (active + non-expired), ALL merchant own
**Index** : `idx_merchant_offers_merchant`, `idx_merchant_offers_active` (partial)

**vouchers.offer_id** : UUID FK → merchant_offers(id) ON DELETE SET NULL (nullable, only for source='offer')
**vouchers.source CHECK** : `('birthday', 'referral', 'redemption', 'welcome', 'offer')`

### 2.35 merchant_planning_slots (mig 063)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| slot_date | DATE | NOT NULL | |
| start_time | VARCHAR(5) | NOT NULL | "HH:MM" |
| client_name | TEXT | NULL | NULL = available, filled = taken |
| client_phone | TEXT | NULL | |
| service_id | UUID FK → merchant_services | NULL | ON DELETE SET NULL |
| notes | TEXT | NULL | |
| customer_id | UUID FK → customers | NULL | ON DELETE SET NULL, mig 065 |
| deposit_confirmed | BOOLEAN | NULL | mig 083, NULL=pas d'acompte, false=en attente, true=confirme |
| primary_slot_id | UUID FK → merchant_planning_slots | NULL | mig 084, NULL=slot principal/libre, UUID=filler d'un booking multi-creneaux |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public (client_name IS NULL AND slot_date >= CURRENT_DATE), ALL merchant own
**Indexes** : `idx_planning_slots_merchant_date`, `idx_planning_slots_customer` (partial, NOT NULL), `idx_planning_slots_primary_slot_id` (partial, NOT NULL), UNIQUE(merchant_id, slot_date, start_time)

### 2.36 planning_slot_services (mig 071)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| slot_id | UUID FK → merchant_planning_slots | NOT NULL | ON DELETE CASCADE |
| service_id | UUID FK → merchant_services | NOT NULL | ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Contrainte** : UNIQUE(slot_id, service_id)
**RLS** : merchant own (via subquery sur merchant_planning_slots → merchants.user_id), service_role full access
**Indexes** : `idx_planning_slot_services_slot`, `idx_planning_slot_services_service`

### 2.37 planning_slot_photos (mig 072)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| slot_id | UUID FK → merchant_planning_slots | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| url | TEXT | NOT NULL | |
| position | SMALLINT | `1` | CHECK (1..3) |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Contrainte** : UNIQUE(slot_id, position)
**RLS** : merchant own, service_role full access
**Index** : `idx_planning_slot_photos_slot`
**Max** : 3 photos par creneau
**Storage** : `images/planning/{merchantId}/{slotId}-{timestamp}.{ext}`

### 2.38 planning_slot_result_photos (mig 074)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| slot_id | UUID FK → merchant_planning_slots | NOT NULL | ON DELETE CASCADE |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| url | TEXT | NOT NULL | |
| position | SMALLINT | `1` | CHECK (1..3) |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Contrainte** : UNIQUE(slot_id, position)
**RLS** : merchant own, service_role full access
**Index** : `idx_planning_slot_result_photos_slot`
**Max** : 3 photos resultat par creneau
**Storage** : `images/planning/{merchantId}/{slotId}-result-{timestamp}.{ext}`
**Note** : Meme structure que `planning_slot_photos` mais pour les photos "apres" prestation

---



| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| snapshot_date | DATE | NOT NULL | UNIQUE |
| active_subscribers | INTEGER | `0` | |
| trial_users | INTEGER | `0` | |
| cancelled_users | INTEGER | `0` | |
| mrr | NUMERIC(10,2) | `0` | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : super_admins CRUD uniquement
**Index** : `idx_revenue_snapshots_date`

---

### 2.39 affiliate_links (mig 081)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| name | TEXT | NOT NULL | Nom du partenaire |
| slug | TEXT | NOT NULL | UNIQUE |
| commission_percent | INTEGER | `20` | NOT NULL |
| notes | TEXT | NULL | |
| active | BOOLEAN | `TRUE` | NOT NULL |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Pas de RLS** (admin-only via service_role)
**Note** : UNIQUE sur slug cree un index implicite, pas d'index supplementaire
**Lien merchants** : `merchants.signup_source = 'affiliate_{slug}'`

---

## 3. Colonnes date — Regles imperatives

| Table | Colonne date | NOM EXACT |
|-------|-------------|-----------|
| visits | Quand le scan a eu lieu | **`visited_at`** |
| redemptions | Quand la recompense a ete utilisee | **`redeemed_at`** |
| point_adjustments | Quand l'ajustement a ete fait | **`adjusted_at`** (en prod) |
| vouchers (utilisation) | Quand le voucher a ete utilise | **`used_at`** |
| vouchers (creation) | Quand le voucher a ete cree | **`created_at`** |
| tous les autres | Quand le record a ete cree | **`created_at`** |

**REGLE** : Ne JAMAIS utiliser `created_at` pour visits, redemptions, ou point_adjustments. Chaque table a sa propre colonne temporelle. Verifier dans ce document avant d'ecrire une query.

---

## 4. Null safety — Regles imperatives

### Champs nullable qui DOIVENT etre wrapes avec `Number(value || 0)` :

| Champ | Table | Pourquoi nullable |
|-------|-------|-------------------|
| `cagnotte_percent` | merchants | NULL si mode visit |
| `cagnotte_tier2_percent` | merchants | NULL si mode visit ou tier2 desactive |
| `current_amount` | loyalty_cards | Ancien schema (devrait etre 0 maintenant) |
| `amount_spent` | visits | NULL si mode visit |
| `points_earned` | visits | Historique pre-mig 003 |
| `tier2_stamps_required` | merchants | NULL si tier2 desactive |
| `stamps_target` | loyalty_cards | NULL si pas de grandfathering |
| `rewards_earned` | loyalty_cards | Ancien schema |

### Pattern obligatoire :
```typescript
// BON
Number(merchant.cagnotte_percent || 0)
Number(card.current_amount || 0).toFixed(2)
Number((condition ? tierA : tierB) || 0)  // parentheses autour du ternaire

// MAUVAIS — NaN si null
Number(merchant.cagnotte_percent)
card.current_amount.toFixed(2)
condition ? tierA : tierB || 0  // || 0 ne protege que tierB
```

---

## 5. Mode switch — Impact DB

Voir `docs/context.md` section 4.7 pour les regles completes. Resume DB :
- Les `loyalty_cards` existantes ne sont PAS modifiees au switch
- Toujours initialiser `current_amount: 0` a la creation de carte
- Wrapper tous les champs cagnotte avec `Number(value || 0)` (section 4)

---

## 6. RLS (Row Level Security) — Resume

### Acces par role :

| Table | anon/authenticated | service_role |
|-------|-------------------|-------------|
| merchants | SELECT (public), INSERT/UPDATE (own user_id) | Full |
| customers | SELECT/INSERT/UPDATE (merchant own, mig 038) | Full |
| loyalty_cards | SELECT (merchant own), INSERT/UPDATE (merchant own, mig 038) | Full |
| visits | SELECT (merchant own + super_admin) | Full |
| redemptions | SELECT (merchant own + super_admin) | Full |
| point_adjustments | SELECT/INSERT (merchant own) | Full |
| vouchers | SELECT (merchant own) | Full |
| banned_numbers | SELECT/INSERT/DELETE (merchant own) | Full |
| referrals | SELECT (merchant own) | Full |
| super_admins | — | Full |
| admin_expenses/fixed_costs | super_admin CRUD | Full |
| push_history | SELECT (merchant own) | Full |
| push_subscriptions | — (mig 038 restricted) | Full |
| pending_email_tracking | — | Full |
| ~~demo_leads/tool_leads~~ | SUPPRIMEES (mig 053) | — |
| admin_announcements | SELECT (authenticated, published) | Full |
| admin_announcement_dismissals | INSERT/SELECT (merchant own) | Full |
| contact_messages | INSERT (public) | Full |
| merchant_photos | SELECT (public), INSERT/UPDATE/DELETE (merchant own) | Full |
| merchant_service_categories | SELECT (public), ALL (merchant own) | Full |
| merchant_services | SELECT (public), ALL (merchant own) | Full |
| merchant_planning_slots | SELECT (public, available future only), ALL (merchant own) | Full |
| planning_slot_result_photos | merchant own | Full |

**Note** : Mig 038 a restreint les acces publics. Les INSERT/SELECT publics sur customers, loyalty_cards, visits, vouchers, push_subscriptions ont ete remplaces par des policies scoped au merchant.

### Regle super_admin :
```sql
auth.uid() IN (SELECT user_id FROM super_admins)
```

---

## 7. Triggers et fonctions

| Trigger | Table | Fonction | Description |
|---------|-------|----------|-------------|
| `update_merchants_updated_at` | merchants | `update_updated_at_column()` | Auto-MAJ updated_at (exclut last_seen_at) |
| `update_loyalty_cards_updated_at` | loyalty_cards | `update_updated_at_column()` | Auto-MAJ updated_at |
| `update_push_automations_updated_at` | push_automations | `update_updated_at_column()` | Auto-MAJ updated_at, mig 042 |

### Fonctions :
- `generate_slug(shop_name TEXT)` — Genere un slug unique (accents, dedup avec counter)
- `generate_scan_code()` — Code aleatoire 8 chars (sans 0, O, I, l, 1), mig 008b
- `increment_push_automation_stat(p_merchant_id, p_stat_column)` — Incremente atomiquement un compteur push, mig 041
- `update_updated_at_column()` — SET NEW.updated_at = NOW() (sauf si seul last_seen_at change, mig 032)

### Fonctions RPC admin (mig 052) :
- `get_first_visit_per_merchant()` → TABLE(merchant_id uuid, first_visit_date timestamptz) — MIN(visited_at) par merchant
- `get_tenth_card_date_per_merchant()` → TABLE(merchant_id uuid, tenth_card_date timestamptz) — Date de la 10eme carte par merchant
- `get_loyalty_card_counts_per_merchant()` → TABLE(merchant_id uuid, card_count bigint) — COUNT(*) loyalty_cards par merchant

**Securite** : plpgsql STABLE SECURITY DEFINER. Chaque fonction verifie `current_setting('role') = 'service_role'` OU `auth.uid() IN super_admins`. Sinon → `RAISE EXCEPTION 'Acces refuse'`.

---

## 8. Indexes de performance (mig 014 + 046)

### Mig 014 :
- `idx_visits_merchant_date` ON visits(merchant_id, visited_at DESC)
- `idx_loyalty_cards_merchant_stamps` ON loyalty_cards(merchant_id, current_stamps)
- `idx_redemptions_merchant_date` ON redemptions(merchant_id, redeemed_at DESC)

### Mig 046 :
- `idx_visits_card_visited` ON visits(loyalty_card_id, visited_at DESC)
- `idx_vouchers_card_unused` ON vouchers(loyalty_card_id, is_used) WHERE is_used = FALSE
- `idx_loyalty_cards_merchant_updated` ON loyalty_cards(merchant_id, updated_at DESC)
- `idx_push_subs_merchant_customer` ON push_subscriptions(merchant_id, customer_id)
- `idx_referrals_merchant_status` ON referrals(merchant_id, status)

---

## 9. Contraintes CHECK notables

| Table | Contrainte | Valeur |
|-------|-----------|--------|
| merchants | `stamps_required` | 1..15 (mig 054) |
| merchants | `loyalty_mode` | 'visit', 'cagnotte' |
| merchants | `subscription_status` | 'trial', 'active', 'canceled', 'canceling', 'past_due' |
| merchants | `tier2_stamps_check` | tier2_stamps_required > stamps_required AND <= 30 (mig 054) |
| visits | `status` | 'confirmed', 'pending', 'rejected' |
| redemptions | `tier` | 1, 2 |
| vouchers | `tier` | 1, 2 |
| vouchers | `source` | 'birthday', 'referral', 'redemption', 'welcome' |
| customers | `birth_month` | 1..12 |
| customers | `birth_day` | 1..31 |
| customers | `phone_number` | regex `^\d{9,15}$`, mig 042 |
| merchants | `phone` | regex `^\d{9,15}$`, mig 042 |

---

## 10. Migrations (001 → 074)

| # | Fichier | Resume |
|---|---------|--------|
| 001 | initial_schema | merchants, customers, loyalty_cards, visits, redemptions, contact_messages, RLS, triggers, slug |
| 002 | point_adjustments | Table point_adjustments (audit trail) |
| 003 | add_loyalty_mode | loyalty_mode, points_earned, stamps_target, review_link |
| 004 | add_banned_numbers | Table banned_numbers |
| 005 | quarantine_system | visits.status/flagged_reason/ip_hash, pending_email_tracking |
| 006 | push_history | Table push_history |
| 007 | push_automations | Table push_automations |
| 008 | push_subscriptions | Table push_subscriptions |
| 008b | add_scan_code | merchants.scan_code (UNIQUE) |
| 009 | scheduled_push | Table scheduled_push |
| 010 | demo_leads | Table demo_leads |
| 011 | merchant_offers / tool_leads | Tables merchant_offers + tool_leads |
| 012 | storage_bucket | Logos storage bucket |
| 013 | pwa_offer | merchants.pwa_offer config |
| 014 | performance_indexes | Indexes v1 |
| 015 | admin_tools | Tables admin_notes, admin_tasks, prospects |
| 016 | tier2_rewards | tier2_enabled, tier2_stamps_required, tier2_reward_description |
| 017 | redemption_tiers | redemptions.tier |
| 018 | member_programs | Table member_programs |
| 019 | shield_toggle | merchants.shield_enabled |
| 020 | fix_merchant_delete | CASCADE deletes fix |
| 021 | admin_expenses | Table admin_expenses |
| 022 | admin_fixed_costs | Table admin_fixed_costs |
| 023 | fix_rls_security | vouchers table, super_admins table, RLS fixes globales |
| 024 | fix_delete_policies | DELETE policies fix |
| 025 | fix_member_programs_rls | member_programs RLS |
| 026 | fix_trial_period | trial_ends_at fix |
| 027 | fix_subscription_status_spelling | subscription_status CHECK fix |
| 028 | reactivation_email_tracking | Table reactivation_email_tracking, stripe fields |
| 029 | add_merchant_country_and_e164 | merchants.country, phone E.164 |
| 030 | fix_phone_prefix_by_country | Phone prefix migration |
| 031 | add_last_seen_at | merchants.last_seen_at |
| 032 | fix_updated_at_trigger | Exclure last_seen_at du trigger updated_at |
| 033 | add_referral_code | merchants.referral_code (UNIQUE) |
| 034 | trial_7_days | trial 14j → 7j |
| 035 | referrals_table_rls | Table referrals + RLS |
| 036 | add_merchant_no_contact | merchants.no_contact, admin_notes |
| 037 | birthday_gift | customers.birth_month/birth_day, merchants.birthday_gift, vouchers.source |
| 038 | restrict_rls_policies | RLS hardening |
| 039 | schema_drift_fix | customers.merchant_id, loyalty_cards.rewards_earned |
| 040 | push_automation_events | Table push_automation_events |
| 041 | audit_fixes | Security audit fixes |
| 042 | medium_audit_fixes | Medium severity audit fixes |
| 043 | pwa_installed | merchants.pwa_installed |
| 044 | admin_announcements | Table admin_announcements |
| 045 | announcement_link_url | admin_announcements.link_url |
| 046 | performance_indexes_v2 | Indexes v2 |
| 047 | shop_type_refactor | shop_type CHECK list, custom_scan_message |
| 048 | double_days | double_days_enabled, double_days_of_week |
| 049 | unique_merchant_user_id | UNIQUE constraint on merchants.user_id |
| 050 | cagnotte_mode | cagnotte fields, purge mode article |
| 051 | schema_drift_fix_v2 | social links, billing_interval, revenue_snapshots |
| 052 | admin_metrics_rpc | 3 fonctions RPC admin (first_visit, tenth_card, card_counts) — plpgsql, SECURITY DEFINER, auth guard super_admin/service_role |
| 053 | cleanup_unused_tables | DROP demo_leads, tool_leads, push_automation_events |
| 054 | stamps_limits | stamps_required CHECK 1..15 (etait 1..50), tier2_stamps_required CHECK <= 30 (etait illimite) |
| 055 | merchant_photos | Table merchant_photos (id, merchant_id, url, position 1-6), UNIQUE(merchant_id, position), RLS public read + merchant CRUD |
| 056 | welcome_offer | welcome_offer_enabled/description/welcome_referral_code sur merchants, vouchers source CHECK +welcome, referrals referrer nullable |
| 057 | merchant_services | Tables merchant_service_categories + merchant_services, RLS public read + merchant CRUD, indexes merchant_id + category_id |
| 058 | services_duration_description | Ajout duration + description sur merchant_services |
| 059 | point_adjustments_cascade_delete | FK adjusted_by → auth.users passe de RESTRICT a ON DELETE CASCADE |
| 060 | merchant_offers | Table merchant_offers (promo), vouchers.offer_id FK, source CHECK +offer, RLS public read active + merchant CRUD |
| 061 | merchant_bio | merchants.bio TEXT |
| 062 | merchant_opening_hours | merchants.opening_hours JSONB (format: {"1":{"open":"09:00","close":"18:00"},"2":null,...}) |
| 063 | merchant_planning | Table merchant_planning_slots, merchants.planning_enabled + planning_message, RLS public available + merchant CRUD |
| 064 | booking_message | merchants.booking_message TEXT + planning_message_expires DATE |
| 065 | planning_customer_link | merchant_planning_slots.customer_id FK → customers (nullable, walk-ins), index partial |
| 066 | security_hardening | RLS fix push_automations/logs, search_path sur SECURITY DEFINER functions, service_role policies tables recentes, storage scoping user folder, trigger updated_at prospects |
| 067 | show_public_page_on_card | merchants.show_public_page_on_card BOOLEAN NOT NULL DEFAULT false (toggle retire du UI, colonne conservee) |
| 068 | signup_source | merchants.signup_source TEXT (demo, landing, direct, etc.) |
| 069 | merchant_locale | merchants.locale TEXT NOT NULL DEFAULT 'fr' |
| 070 | first_feature_choice | merchants.first_feature_choice TEXT ('loyalty' ou 'vitrine', NULL = pas encore choisi) |
| 071 | planning_slot_services | Table junction planning_slot_services (multi-services par creneau), migration donnees existantes service_id |
| 072 | planning_slot_photos | Table planning_slot_photos (photos inspiration, max 3/creneau, position 1-3) |
| 073 | customer_social_links | customers.instagram_handle, tiktok_handle, facebook_url (liens sociaux pour planning) |
| 074 | planning_slot_result_photos | Table planning_slot_result_photos (photos resultat "apres", max 3/creneau, position 1-3, meme structure que planning_slot_photos) |
| 075 | decrement_offer_claim | RPC `decrement_offer_claim(p_offer_id)` — rollback atomique si voucher echoue apres increment |
| 076 | point_adjustments_adjusted_at | Rename conditionnel `created_at` → `adjusted_at` sur point_adjustments (formalise schema drift) |
| 077 | merchant_soft_delete | merchants.deleted_at TIMESTAMPTZ + index idx_merchants_active |
| 078 | customer_compound_unique | Drop UNIQUE(phone_number) global → UNIQUE(phone_number, merchant_id) compound |
| 079 | whatsapp_url | merchants.whatsapp_url TEXT |
| 080 | customer_notes | Table customer_notes (journal suivi client : content, note_type, pinned, slot_id FK nullable, index lookup+pinned, RLS merchant) |
| 081 | affiliate_links | Table affiliate_links (name, slug UNIQUE, commission_percent, notes, active, pas de RLS — admin service_role) |
| 082 | duo_offer | merchants.duo_offer_enabled BOOLEAN + duo_offer_description TEXT |
| 083 | auto_booking | merchants.auto_booking_enabled, deposit_link, deposit_percent, deposit_amount + merchant_planning_slots.deposit_confirmed BOOLEAN |
| 084 | primary_slot_id | merchant_planning_slots.primary_slot_id UUID FK self-ref — lie les fillers au slot principal d'un booking multi-creneaux |

---

## 11. Checkin — Deduplication (3 minutes)

Les deux API de checkin verifient qu'un scan identique n'a pas eu lieu dans les 3 dernieres minutes :

```sql
SELECT id FROM visits
WHERE loyalty_card_id = $1
  AND visited_at > NOW() - INTERVAL '3 minutes'
ORDER BY visited_at DESC
LIMIT 1
```

**REGLE** : Utiliser `visited_at` (PAS `created_at`) dans cette query.

---

## 12. Storage

- Bucket `logos` (public) — Logos merchants
- Policies : anyone SELECT, authenticated INSERT/UPDATE/DELETE
