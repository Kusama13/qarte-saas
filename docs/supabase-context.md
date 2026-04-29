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
| email_bounced_at | TIMESTAMPTZ | NULL | mig 107 |
| email_unsubscribed_at | TIMESTAMPTZ | NULL | mig 107 |
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
| display_phone | TEXT | NULL | mig 108, numero fixe/portable affiche sur vitrine publique (E.164 sans +) |
| booking_url | TEXT | NULL | mig 051 |
| billing_interval | TEXT | `'monthly'` | mig 051 |
| billing_period_start | TIMESTAMPTZ | NULL | mig 095, Stripe billing cycle start for SMS quota |
| planning_enabled | BOOLEAN | `FALSE` | mig 063 |
| planning_intent | TEXT | `'unsure'` | mig 121, 3-state ('unsure'\|'yes'\|'no') — 'no' masque le groupe Planning de la checklist + skip emails J+4 + masque encart SMS quota |
| planning_message | TEXT | NULL | mig 063 |
| booking_message | TEXT | NULL | mig 064 |
| planning_message_expires | DATE | NULL | mig 064 |
| auto_booking_enabled | BOOLEAN | `FALSE` | NOT NULL, mig 083 |
| deposit_link | TEXT | NULL | mig 083, lien externe paiement acompte |
| deposit_percent | INTEGER | NULL | mig 083, % acompte (mutuellement exclusif avec deposit_amount) |
| deposit_amount | DECIMAL(10,2) | NULL | mig 083, montant fixe acompte (mutuellement exclusif avec deposit_percent) |
| deposit_message | TEXT | NULL | mig 083, DEPRECATED — supprime du code (conditions de resa suffisent) |
| deposit_deadline_hours | INTEGER | NULL | mig 086, delai en heures pour recevoir l'acompte (NULL=libre, pas de delai) |
| allow_customer_cancel | BOOLEAN | `FALSE` | NOT NULL, mig 096, client peut annuler ses RDV en ligne |
| allow_customer_reschedule | BOOLEAN | `FALSE` | NOT NULL, mig 096, client peut deplacer ses RDV en ligne |
| cancel_deadline_days | INTEGER | `1` | NOT NULL, mig 097, delai annulation en jours avant le RDV |
| reschedule_deadline_days | INTEGER | `1` | NOT NULL, mig 097, delai modification en jours avant le RDV |
| booking_mode | VARCHAR(10) | `'slots'` | NOT NULL, mig 103, CHECK ('slots','free'). Mode creneaux = slots pre-generes, mode libre = calcul dynamique depuis opening_hours |
| buffer_minutes | SMALLINT | `0` | NOT NULL, mig 103, CHECK (0,10,15,30). Pause entre RDV en mode libre. En mode home_service sert d'aléa supplémentaire (parking, déchargement, retard) appliqué symétriquement entre RDV |
| home_service_enabled | BOOLEAN | `FALSE` | NOT NULL, mig 134, mode service à domicile (calcul auto trajet entre RDV) |
| shop_lat | DOUBLE PRECISION | NULL | mig 134, latitude de l'adresse marchand (pour calcul trajet 1er RDV). Capturé via BAN dans InfoSection ou géocodé à l'activation home_service |
| shop_lng | DOUBLE PRECISION | NULL | mig 134, longitude de l'adresse marchand |
| hide_address_on_public_page | BOOLEAN | `FALSE` | NOT NULL, mig 135, masque l'adresse sur `/p/[slug]` et dans le JSON-LD streetAddress (privacy pro à domicile = home address). Auto-activé à la 1ère activation de home_service. Ville (`addressLocality`) reste visible pour SEO local |
| contest_enabled | BOOLEAN | `FALSE` | mig 105. Tirage au sort mensuel |
| contest_prize | TEXT | NULL | mig 105. Description du lot a gagner |
| show_public_page_on_card | BOOLEAN | `FALSE` | NOT NULL, mig 067 (toggle UI retire, colonne conservee) |
| signup_source | TEXT | NULL | mig 068 |
| locale | TEXT | `'fr'` | NOT NULL, mig 069 |
| first_feature_choice | TEXT | NULL | mig 070, values: 'loyalty', 'vitrine' |
| deleted_at | TIMESTAMPTZ | NULL | mig 077, soft-delete (filtre `is('deleted_at', null)` sur routes publiques) |
| bio | TEXT | NULL | mig 061 |
| opening_hours | JSONB | NULL | mig 062, format: `{"1":{"open":"09:00","close":"18:00","break_start?":"12:00","break_end?":"14:00"},...}` — break_start/break_end optionnels (pause dejeuner) |
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

### 2.20 member_programs (mig 018 + 109)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| name | TEXT | NOT NULL | |
| benefit_label | TEXT | NOT NULL | |
| duration_months | NUMERIC(6,2) | `12` | CHECK (> 0) |
| is_active | BOOLEAN | `TRUE` | |
| discount_percent | INTEGER | NULL | CHECK IN (5, 10, 15, 20), mig 109 |
| skip_deposit | BOOLEAN | `FALSE` | NOT NULL, mig 109 |
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

### 2.26 merchant_push_subscriptions (mig 085)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK | NOT NULL | → merchants(id) ON DELETE CASCADE |
| endpoint | TEXT | NOT NULL | UNIQUE |
| p256dh | TEXT | NOT NULL | |
| auth | TEXT | NOT NULL | |
| created_at | TIMESTAMPTZ | `NOW()` | |
| updated_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_merchant_push_subs_merchant` (merchant_id)
**RLS** : merchants manage own subs (WHERE merchant_id IN merchants WHERE user_id = auth.uid())

### 2.27 merchant_push_logs (mig 085, 104)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK | NOT NULL | → merchants(id) ON DELETE CASCADE |
| notification_type | TEXT | NOT NULL | |
| reference_id | TEXT | | |
| title | TEXT | | (mig 104) |
| body | TEXT | | (mig 104) |
| url | TEXT | | (mig 104) |
| read | BOOLEAN | `false` | NOT NULL (mig 104) |
| sent_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_merchant_push_logs_lookup` (merchant_id, notification_type, sent_at), `idx_merchant_push_logs_unread` (merchant_id, read, sent_at DESC)
**RLS** : service role full access + merchants SELECT/UPDATE own logs

### 2.28 merchant_contests (mig 105)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK | NOT NULL | → merchants(id) ON DELETE CASCADE |
| contest_month | VARCHAR(7) | NOT NULL | YYYY-MM, UNIQUE(merchant_id, contest_month) |
| prize_description | TEXT | NOT NULL | |
| winner_customer_id | UUID FK | | → customers(id) ON DELETE SET NULL |
| winner_name | TEXT | | |
| winner_phone | TEXT | | |
| participants_count | INTEGER | 0 | NOT NULL |
| drawn_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_merchant_contests_merchant` (merchant_id, contest_month DESC)
**RLS** : merchants SELECT own, service role full access

### 2.29 merchant_churn_surveys (mig 106)

Questionnaire de retention affiche aux merchants dont le trial est fully expired (> J+3). Une seule reponse par merchant. Completion accorde +2 jours bonus sur `trial_ends_at` + pose `merchants.churn_survey_seen_at`. Si Q4 = `lower_price`, le code promo Stripe `QARTEPRO10` (-10% 3 mois) est affiche sur la page de succes.

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK | NOT NULL | → merchants(id) ON DELETE CASCADE, UNIQUE |
| blocker | TEXT | NOT NULL | CHECK IN (`price`, `not_enough_clients`, `missing_feature`, `too_complex`, `other`) |
| missing_feature | TEXT | | Optionnel — texte libre Q2 |
| features_tested | TEXT[] | `{}` | NOT NULL — array de `loyalty` / `planning` / `online_booking` / `sms` / `push_offers` / `referral` |
| would_convince | TEXT | NOT NULL | CHECK IN (`lower_price`, `longer_trial`, `team_demo`, `more_features`, `nothing`) |
| free_comment | TEXT | | Optionnel |
| bonus_days_granted | INTEGER | 0 | NOT NULL |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_churn_surveys_created` (created_at DESC), `idx_churn_surveys_blocker` (blocker)
**RLS** : merchants INSERT/SELECT own, service role full access

**Colonne ajoutee sur `merchants`** : `churn_survey_seen_at TIMESTAMPTZ` — posee a la completion (PAS au skip, le skip n'est pas persiste pour que le merchant reverra le questionnaire a la prochaine visite).

**Source unique** : les enums + labels sont dans `src/lib/churn-survey-config.ts` (partages entre Zod API, client page, admin page).

### 2.30 sms_logs (mig 092-094)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK | NOT NULL | → merchants(id) ON DELETE CASCADE |
| slot_id | UUID FK | | → merchant_planning_slots(id) ON DELETE SET NULL |
| phone_to | TEXT | NOT NULL | |
| sms_type | TEXT | NOT NULL | CHECK IN ('reminder_j1', 'confirmation_no_deposit', 'confirmation_deposit', 'birthday', 'referral_reward', 'booking_moved', 'booking_cancelled') |
| message_body | TEXT | NOT NULL | |
| ovh_job_id | TEXT | | |
| status | TEXT | 'sent' | CHECK IN ('sent', 'delivered', 'failed') |
| error_message | TEXT | | |
| cost_euro | NUMERIC(6,4) | 0 | |
| created_at | TIMESTAMPTZ | `NOW()` | |

**Index** : `idx_sms_logs_merchant_month` (merchant_id, created_at), `idx_sms_logs_dedup` UNIQUE (merchant_id, sms_type, slot_id) WHERE slot_id IS NOT NULL

### 2.29 app_config (mig 092)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| key | TEXT PK | | |
| value | JSONB | '{}' | |
| updated_at | TIMESTAMPTZ | `NOW()` | |

**Donnees** : key `sms_global` → `{"reminder_enabled": true, "confirmation_enabled": true, "birthday_enabled": true, "referral_enabled": true}` (les toggles globaux admin sont supprimes de l'UI — la table reste en DB mais n'est plus lue que par `getGlobalSmsConfig` dans les crons evening/morning-jobs pour `reminder_j1`, `birthday`, `referral_reward`. Les SMS confirmation/acompte/deplacement/annulation sont desormais 100% opt-in via toggle merchant.)

### 2.30 admin_notes (mig 015)

Single-row table : id, content (TEXT, default ''), updated_at

### 2.29 admin_tasks (mig 015)

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
| deposit_deadline_at | TIMESTAMPTZ | NULL | mig 086, deadline auto-liberation si acompte non confirme |
| booked_online | BOOLEAN | `false` | mig 088, true si reserve via /api/planning/book (vitrine) |
| booked_at | TIMESTAMPTZ | NULL | mig 088, timestamp de reservation (set par book API + PATCH manual) |
| primary_slot_id | UUID FK → merchant_planning_slots | NULL | mig 084, NULL=slot principal/libre, UUID=filler d'un booking multi-creneaux |
| total_duration_minutes | SMALLINT | NULL | mig 103, NULL=mode creneaux (duree implicite via services lies), non-null=mode libre (duree totale du RDV) |
| custom_service_name | TEXT | NULL | mig 130, prestation perso one-shot (nom optionnel a la creation, requis depuis fix UX) |
| custom_service_duration | INTEGER | NULL | mig 130, minutes, CHECK (>0 si renseigne) |
| custom_service_price | DECIMAL(10,2) | NULL | mig 130 (INTEGER) → mig 132 (DECIMAL en euros, aligne sur merchant_services.price) ; CHECK (>=0) |
| custom_service_color | TEXT | NULL | mig 130, hex aleatoire pour affichage colore (badge + bordure card) |
| customer_address | TEXT | NULL | mig 134, adresse cliente saisie à la résa (mode home_service) |
| customer_lat | DOUBLE PRECISION | NULL | mig 134, latitude cliente (capturé via BAN dans BookingModal vitrine) |
| customer_lng | DOUBLE PRECISION | NULL | mig 134, longitude cliente |
| travel_time_minutes | SMALLINT | NULL | mig 134, durée trajet entrant calculée (depuis cliente précédente ou marchand pour le 1er RDV). Recalculée par `recomputeDayTravel` après book/cancel/move/delete |
| travel_time_overridden | BOOLEAN | `FALSE` | NOT NULL, mig 134, true si le merchant a fixé manuellement la durée — recompute auto skip ces slots (UI override différée v2) |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public (client_name IS NULL AND slot_date >= CURRENT_DATE), ALL merchant own
**Indexes** : `idx_planning_slots_merchant_date`, `idx_planning_slots_customer` (partial, NOT NULL), `idx_planning_slots_primary_slot_id` (partial, NOT NULL), `idx_planning_slots_deposit_deadline` (mig 089, partial : `deposit_confirmed=false AND deposit_deadline_at IS NOT NULL AND primary_slot_id IS NULL` — speed up cron deposit scan a 500 slots), `idx_planning_slots_booked` (mig 089, partial : `client_name IS NOT NULL` — speed up onglet Reservations dashboard), UNIQUE(merchant_id, slot_date, start_time)

**RPC** : `move_booking(merchant_id, source_slot_id, target_date, target_time)` (mig 091, étendue mig 136 pour transférer/reset les 5 champs home_service)

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

### 2.40 ambassador_applications (mig 110)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| first_name | TEXT | NOT NULL | |
| last_name | TEXT | NOT NULL | |
| email | TEXT | NOT NULL | UNIQUE partiel WHERE status='pending' |
| phone | TEXT | NULL | |
| profile_type | TEXT | NOT NULL | CHECK IN ('influencer','trainer','family_friend','sales_rep','other') |
| message | TEXT | NOT NULL | |
| requested_slug | TEXT | NULL | Code souhaite par l'ambassadeur |
| status | TEXT | `'pending'` | CHECK IN ('pending','approved','rejected') |
| affiliate_id | UUID FK → affiliate_links | NULL | ON DELETE SET NULL, lie a l'approbation |
| created_at | TIMESTAMPTZ | `NOW()` | |
| reviewed_at | TIMESTAMPTZ | NULL | Date approbation/refus |
| notes | TEXT | NULL | Notes admin |

**RLS** : active, aucune policy (service_role only)
**Index** : `idx_ambassador_app_status (status, created_at DESC)` + `idx_ambassador_app_email_pending (email) WHERE status='pending'` (UNIQUE partiel anti-spam)
**Flow** : candidature pending → admin approve → insert `affiliate_links` + set `affiliate_id` + email bienvenue

### 2.41 booking_deposit_failures (mig 111)

Archive des resas liberees pour acompte non recu. Le cron horaire `/api/cron/deposit-expiration` snapshote la resa ici **avant** de wiper le slot. Le merchant la voit dans l'onglet Reservations (section amber) et peut la ramener ou la supprimer.

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| customer_id | UUID FK → customers | NULL | ON DELETE SET NULL |
| client_name | TEXT | NOT NULL | |
| client_phone | TEXT | NULL | E.164 sans + |
| service_ids | UUID[] | `ARRAY[]::UUID[]` | NOT NULL |
| original_slot_date | DATE | NOT NULL | |
| original_start_time | TIME | NOT NULL | |
| total_duration_minutes | INTEGER | NULL | |
| notes | TEXT | NULL | |
| deposit_amount | NUMERIC(10,2) | NULL | Montant attendu snapshot (mig 111) |
| custom_service_name | TEXT | NULL | mig 131, snapshot de la prestation perso du slot original |
| custom_service_duration | INTEGER | NULL | mig 131, CHECK (>0 si renseigne) |
| custom_service_price | DECIMAL(10,2) | NULL | mig 131 (INTEGER) → mig 132 (DECIMAL en euros) ; CHECK (>=0) |
| custom_service_color | TEXT | NULL | mig 131, hex preserve pour cohérence visuelle au bring-back |
| expired_at | TIMESTAMPTZ | NOT NULL | Deadline qui a ete depassee |
| created_at | TIMESTAMPTZ | `NOW()` | |

### 2.42 merchants — colonnes trial SMS marketing (mig 115)

Nouvelles colonnes ajoutées sur `merchants` pour le système SMS marketing trial (plan v2).

| Colonne | Type | Default | Usage |
|---------|------|---------|-------|
| celebration_sms_sent_at | TIMESTAMPTZ | NULL | Dedup global SMS célébration (1 max sur la vie merchant, peu importe le pilier) |
| marketing_sms_opted_out | BOOLEAN | FALSE (NOT NULL) | Opt-out merchant pour SMS marketing trial. Togglable via /dashboard/settings |

Index partiel : `idx_merchants_sms_marketing_eligible ON (subscription_status, marketing_sms_opted_out) WHERE marketing_sms_opted_out = FALSE` (filtre cron rapide).

### 2.43 merchant_marketing_sms_logs (mig 116)

SMS marketing trial envoyés au merchant (Qarte → merchant). **Distinct de `sms_logs`** qui tracke merchant → clients.

Voir [`docs/email-matrix.md`](./email-matrix.md) section "Plan v2 trial emails+SMS" pour la stratégie.

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| sms_type | TEXT | NOT NULL | CHECK IN (`celebration_fidelity`, `celebration_planning`, `celebration_vitrine`, `trial_pre_loss`, `churn_survey`) |
| state_snapshot | INT | NULL | activation_score (0-3) au moment d'envoi |
| tier_recommended | TEXT | NULL | CHECK IN (`fidelity`, `all_in`) — uniquement pour trial_pre_loss |
| body | TEXT | NOT NULL | Texte du SMS envoyé |
| ovh_job_id | TEXT | NULL | Id job OVH (pour debugging) |
| status | TEXT | `sent` | CHECK IN (`sent`, `failed`, `skipped`) |
| error_message | TEXT | NULL | Raison de l'échec OVH |
| cost_euro | NUMERIC(6,4) | NULL | Coût SMS (0.075€ si sent, NULL si failed) |
| sent_at | TIMESTAMPTZ | `NOW()` | NOT NULL |

Indexes :
- `idx_marketing_sms_merchant ON (merchant_id, sent_at DESC)` — timeline merchant
- `idx_marketing_sms_type_dedup ON (merchant_id, sms_type)` — dedup par type

RLS :
- `Merchants read own marketing sms logs` : SELECT si `merchant_id` appartient à `auth.uid()`
- `Service role full access marketing sms logs` : ALL si `auth.role() = 'service_role'`

Utilisé par le cron [/api/cron/sms-trial-marketing](../src/app/api/cron/sms-trial-marketing/route.ts) (1×/jour 11h UTC) et le helper [src/lib/sms-trial-marketing.ts](../src/lib/sms-trial-marketing.ts).

### 2.44 merchants — trigger tier guards (mig 117)

Trigger PL/pgSQL `enforce_fidelity_tier_feature_guards` BEFORE INSERT OR UPDATE sur `merchants`.

Si `plan_tier = 'fidelity'`, force à FALSE :
- `planning_enabled`
- `auto_booking_enabled`
- `contest_enabled`

Pourquoi : les toggles UI passent par `supabase.from('merchants').update()` direct côté client. Le trigger garantit qu'un Fidélité ne peut activer ces features même en bypass UI/Postman. Backfill inclus (reset des merchants Fidélité avec flags activés).

Les 2 autres features gated (`marketingSms`, `memberPrograms`) sont bloquées au niveau API routes (pas de flag merchants direct).

### 2.45 merchants — colonnes prorata quota SMS (mig 118)

| Colonne | Type | Default | Usage |
|---------|------|---------|-------|
| sms_quota_override | INT | NULL | Quota prorata pour le cycle en cours (set on upgrade Fidélité → Tout-en-un mid-cycle). NULL = quota par défaut du tier. |
| sms_quota_override_cycle_anchor | TIMESTAMPTZ | NULL | Date du cycle facturation pour lequel `sms_quota_override` s'applique. Si ne matche plus le cycle courant, override ignoré (auto-expire). |
| sms_alert_90_sent_cycle | DATE | NULL | Date du cycle où l'alerte email 90% a été envoyée. Dedup par cycle. |

Helper [`getEffectiveQuota()`](../src/lib/sms.ts) retourne override si `sms_quota_override_cycle_anchor` matche le `periodStart` calculé. Sinon retombe sur `getQuotaFor()`.

Calcul prorata dans [`/api/stripe/change-tier`](../src/app/api/stripe/change-tier/route.ts) : `Math.max(1, Math.round(100 * remaining_seconds / cycle_seconds))`.

Aussi : SMS Fidélité-free (`birthday`, `referral_reward`) exclus du compteur quota dans `getSmsUsageThisMonth()` via `.not('sms_type', 'in', ...)`.


**RLS** : merchant SELECT + DELETE own (via `merchants.user_id = auth.uid()`), INSERT service_role only (cron)
**Index** : `idx_booking_deposit_failures_merchant_expired (merchant_id, expired_at DESC)`
**GET limit** : 100 items (pas de pagination pour v1)
**Pas d'auto-purge v1** : les rows persistent jusqu'a delete manuel merchant (a surveiller si abus)

### 2.46 travel_time_cache (mig 134)

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| origin_key | TEXT | NOT NULL | "lat,lng" arrondi 4 décimales (~11m) |
| dest_key | TEXT | NOT NULL | idem |
| duration_minutes | SMALLINT | NOT NULL | durée trajet en minutes (depuis OpenRouteService ou fallback Haversine) |
| fetched_at | TIMESTAMPTZ | `NOW()` | NOT NULL, pour purge cron mensuelle des entrées > 6 mois |

**PRIMARY KEY** : (origin_key, dest_key)
**RLS** : `ENABLE ROW LEVEL SECURITY` sans policies → **service_role only** (table server-only, lue/écrite uniquement par `src/lib/travel-time.ts`). Defense in depth si une clé anon touche par erreur.
**Index** : `idx_travel_time_cache_fetched_at`
**Pas d'auto-purge v1** : à brancher sur cron mensuel quand le volume devient un sujet (calcul : ~800 marchands × 10 RDV/jour × cache ratio élevé → loin des 2000 req/jour ORS gratuit)

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
| 085 | merchant_push_subscriptions | Tables merchant_push_subscriptions + merchant_push_logs — push notifications merchant PWA Pro |
| 086 | deposit_deadline | merchant_planning_slots.deposit_deadline_at + merchants.deposit_deadline_hours — auto-liberation creneaux si acompte non confirme |
| 087 | student_offer | merchants.student_offer_enabled BOOLEAN + student_offer_description TEXT |
| 088 | booked_online | merchant_planning_slots.booked_online BOOLEAN DEFAULT false + booked_at TIMESTAMPTZ — distingue resa en ligne vs manuelle, timestamp de reservation |
| 089 | planning_scale_indexes | 2 partial indexes sur merchant_planning_slots : `idx_planning_slots_deposit_deadline` (cron) + `idx_planning_slots_booked` (dashboard Reservations) — renforce perfs a 500 slots actifs |
| 090 | deposit_second_link | merchants : +3 colonnes `deposit_link_label`, `deposit_link_2`, `deposit_link_2_label` — permet 2 moyens de paiement acompte (ex: Revolut + PayPal) affiches en liste de choix sur la modal reservation publique |
| 091 | move_booking_function | Fonction Postgres `move_booking(merchant_id, source_slot_id, target_date, target_time) RETURNS JSONB` — transfert atomique booking source → target (champs client + deposit + booked_online, et FKs `planning_slot_services`, `planning_slot_photos`, `planning_slot_result_photos`, `customer_notes`). Source devient vide, cible creee si absente ou reutilisee si vide, rejete si cible bookee ou multi-slot. `SECURITY DEFINER`, execute restreint a `service_role` |
| 092 | sms_system | Table `sms_logs` (audit + quota + dedup) + table `app_config` (toggles admin globaux SMS) |
| 093 | sms_birthday_referral | Ajout types `birthday` + `referral_reward` au CHECK sms_type, index dedup partiel (WHERE slot_id IS NOT NULL), toggles birthday_enabled + referral_enabled dans app_config |
| 094 | sms_move_cancel_types | Ajout types `booking_moved` + `booking_cancelled` au CHECK sms_type |
| 095 | billing_period_start | `merchants.billing_period_start` TIMESTAMPTZ + backfill 24 merchants |
| 096 | customer_booking_edit | `merchants.allow_customer_cancel` BOOLEAN + `allow_customer_reschedule` BOOLEAN + `customer_edit_deadline_days` INTEGER — annulation/modification RDV par le client |
| 097 | separate_edit_deadlines | Split `customer_edit_deadline_days` → `cancel_deadline_days` + `reschedule_deadline_days` (delais independants) |
| 098 | scalability_constraints | CHECK constraints TEXT length, RLS admin tables, deposit exclusivite, composite indexes, UNIQUE push dedup, reactivation tracking index |
| 099 | admin_metriques_rpc | RPC `get_merchants_with_services()` + `get_merchants_with_photos()` (DISTINCT) |
| 100 | admin_merchants_data_rpc | RPC `get_counts_per_merchant(p_table)` avec whitelist + REVOKE, `get_pending_visits_per_merchant()`, `get_planning_summary_per_merchant()` |
| 101 | sms_booking_cancelled_type | Ajout type `booking_cancelled` au CHECK sms_type |
| 102 | prevent_merchant_hard_delete | Trigger BEFORE DELETE sur merchants : bloque hard delete si `deleted_at IS NULL` (force soft-delete), autorise si deja soft-deleted (purge). Fonction `prevent_merchant_hard_delete()` |
| 103 | planning_free_mode | Colonnes `booking_mode VARCHAR(10) DEFAULT 'slots'` + `buffer_minutes SMALLINT DEFAULT 0` sur `merchants`. Colonne `total_duration_minutes SMALLINT NULL` sur `merchant_planning_slots` (NULL=mode créneaux, non-null=mode libre). Les horaires d'ouverture mode libre réutilisent le champ JSON `merchant.opening_hours` existant (clés "1"=Lun…"7"=Dim) |
| 104 | notification_center | Colonnes `title`, `body`, `url` TEXT + `read` BOOLEAN DEFAULT false sur `merchant_push_logs`. Index `idx_merchant_push_logs_unread`. Policies SELECT/UPDATE pour merchants |
| 105 | monthly_contest | Colonnes `contest_enabled` BOOLEAN + `contest_prize` TEXT sur `merchants`. Table `merchant_contests` (tirage au sort mensuel) avec UNIQUE(merchant_id, contest_month) |
| 106 | churn_survey | Table `merchant_churn_surveys` (questionnaire de retention post-J+3) + colonne `churn_survey_seen_at` TIMESTAMPTZ sur `merchants` (posee a la completion seulement, pas au skip) |
| 107 | email_deliverability | Colonnes `email_bounced_at` + `email_unsubscribed_at` TIMESTAMPTZ sur `merchants`. Index partiels. Fonction RPC `get_user_id_by_email(target_email)` pour lookup auth.users par email (utilise par webhook Resend) |
| 109 | member_program_benefits | `member_programs` : +`discount_percent` INTEGER NULL CHECK(5,10,15,20), +`skip_deposit` BOOLEAN DEFAULT false |
| 110 | ambassador_applications | Table `ambassador_applications` (candidatures ambassadeur : first/last name, email, phone, profile_type, message, requested_slug, status pending/approved/rejected, affiliate_id FK, reviewed_at). Index status+date, UNIQUE partiel email pending. RLS sans policy (service_role) |
| 111 | booking_deposit_failures | Table archive `booking_deposit_failures` : snapshot des resas liberees pour acompte non recu (merchant_id, customer_id, client_name/phone, service_ids UUID[], original_slot_date/time, total_duration_minutes, notes, deposit_amount, expired_at). Index `(merchant_id, expired_at DESC)`. RLS SELECT+DELETE pour merchants (via `merchants.user_id = auth.uid()`), INSERT service_role only. Alimentee par le cron horaire `/api/cron/deposit-expiration` (helper `src/lib/deposit-release.ts`) |
| 121 | planning_intent | merchants.planning_intent TEXT CHECK ('unsure'\|'yes'\|'no') DEFAULT 'unsure'. 'no' = merchant a explicitement masque le module Planning depuis l'onboarding checklist (lien "Je n'utilise pas le planning"). Utilise par helpers `isPlanningHidden()` et `showPlanningUi()` dans `src/lib/plan-tiers.ts` pour gater UI (encart SMS quota dashboard) + cron emails (skip Planning Reminder J+4). Reactivable depuis /dashboard/settings |
| 123 | sms_logs_dedup_index | Index composite `sms_logs(merchant_id, sms_type, created_at DESC)` pour accelerer les dedup anti-spam (`hasSentRecentSms()`) et les requetes de quota SMS dashboard |
| 124 | slot_attendance_status | `merchant_planning_slots.attendance_status VARCHAR(12) CHECK IN ('pending','attended','no_show','cancelled') DEFAULT 'pending'`. Index partiel `WHERE attendance_status != 'pending'`. Backfill : slots passes avec client → `attended`. Utilise par `/dashboard/stats` (no-show rate) et boutons Venue/Absente sur `BookingDetailsModal`. Route `PATCH /api/planning/attendance` |
| 125 | blog_email_dispatches | Table `blog_email_dispatches` pour idempotence du cron blog-digest : `article_slug TEXT PK`, `sent_at TIMESTAMPTZ DEFAULT NOW()`, `recipient_count INTEGER`. Index `sent_at DESC`. RLS enable, service_role only. Le cron choisit le plus ancien article non encore envoye si au moins 3 jours depuis le dernier envoi global |
| 126 | blog_email_recipients | Table `blog_email_recipients` pour dedup per-merchant du cron blog-digest : `(article_slug TEXT, merchant_id UUID FK ON DELETE CASCADE) PRIMARY KEY`, `sent_at TIMESTAMPTZ DEFAULT NOW()`. Index `merchant_id`. RLS enable, service_role only. Garantit qu'un merchant ne recoit jamais 2 fois le meme article (utile depuis l'extension audience aux abonnes payants tous millesimes). Bulk upsert avec `ignoreDuplicates: true` apres chaque batch d'envoi |
| 127 | churn_tracking | Colonnes sur `merchants` : `cancellation_reason TEXT` (CHECK IN 6 valeurs : too_expensive/not_using/missing_feature/switching/temporary/other — source de verite `src/lib/cancellation-reasons.ts`), `cancellation_reason_at TIMESTAMPTZ`, `churn_survey_skip_count INTEGER NOT NULL DEFAULT 0`, `team_demo_requested_at TIMESTAMPTZ`. Index partiels sur cancellation_reason + cancellation_reason_at DESC, et sur team_demo_requested_at DESC (analytics churn drivers + suivi demo follow-up). Alimente par `/api/merchant/cancellation-reason` POST (au moment du select dans le save-offer modal), `/api/merchant/survey-skip` POST (via RPC mig 128, voir ci-dessous), et `/api/churn-survey` POST (set `team_demo_requested_at` si Q4=team_demo) |
| 128 | increment_survey_skip_fn | Fonction RPC `increment_churn_survey_skip(p_user_id UUID, p_max INTEGER)` SECURITY DEFINER : UPDATE atomique de `churn_survey_skip_count + 1`, et marque automatiquement `churn_survey_seen_at = NOW()` quand le seuil `p_max` est atteint (defaut `MAX_SURVEY_SKIPS_BEFORE_AUTO_SEEN = 3` cote `src/lib/churn-survey-config.ts`). Atomicite garantie contre les double-clics. GRANT EXECUTE pour `authenticated` et `service_role`. Returns `(skip_count, auto_seen)` |
| 129 | sms_provider | Colonne `provider TEXT NOT NULL DEFAULT 'ovh' CHECK IN ('ovh','sms_partner')` sur `sms_logs` + index `(merchant_id, provider, created_at DESC)`. Tracé du provider qui a envoyé chaque SMS (cf. routing transactionnel FR/BE → SMS Partner, marketing + CH → OVH) |
| 130 | planning_slots_custom_service | 4 colonnes nullable sur `merchant_planning_slots` : `custom_service_name TEXT`, `custom_service_duration INTEGER` (CHECK >0), `custom_service_price INTEGER` (CHECK >=0, **converti en DECIMAL par mig 132**), `custom_service_color TEXT`. Permet de creer une prestation perso one-shot par booking sans polluer le catalogue `merchant_services`. Le slot porte les 4 champs directement (pas de junction) : 1 prestation perso max par booking |
| 131 | deposit_failures_custom_service | Mêmes 4 colonnes sur `booking_deposit_failures` (snapshot au moment de l'archive cron) + WIPE_FIELDS du slot étendu pour les nettoyer. Permet au bring-back de restaurer la prestation perso (avec override possible cote modal) |
| 132 | custom_service_price_decimal | ALTER COLUMN `custom_service_price` TYPE INTEGER → DECIMAL(10,2) sur `merchant_planning_slots` ET `booking_deposit_failures`, avec `USING (col::DECIMAL / 100)` pour ramener les valeurs deja stockees (cas test merchant) de centimes vers euros. Aligne sur `merchant_services.price` (decimal en euros) — sinon `formatCurrency(4000)` affichait "4 000 €" au lieu de "40 €" |

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
