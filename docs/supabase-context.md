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
| billing_interval | TEXT | `'monthly'` | mig 051 + **mig 166** : CHECK `IN ('monthly','semestrial','annual')`. Webhook map interval Stripe → DB : `interval='month'+interval_count=6 → 'semestrial'`, `interval='year' → 'annual'`, sinon `'monthly'`. Helper `normalizeBillingInterval(value)` dans `lib/plan-tiers.ts` pour coercer. |
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
| deposit_only_for_new_customers | BOOLEAN | `FALSE` | NOT NULL, mig 165, si TRUE skip l'acompte au booking en ligne pour les clientes deja connues du merchant (`customers` row existe). Coexiste avec `member_programs.skip_deposit` (OR logique) |
| allow_customer_cancel | BOOLEAN | `FALSE` | NOT NULL, mig 096, client peut annuler ses RDV en ligne |
| allow_customer_reschedule | BOOLEAN | `FALSE` | NOT NULL, mig 096, client peut deplacer ses RDV en ligne |
| cancel_deadline_days | INTEGER | `1` | NOT NULL, mig 097, delai annulation en jours avant le RDV |
| reschedule_deadline_days | INTEGER | `1` | NOT NULL, mig 097, delai modification en jours avant le RDV |
| booking_mode | VARCHAR(10) | `'slots'` | NOT NULL, mig 103, CHECK ('slots','free'). Mode creneaux = slots pre-generes, mode libre = calcul dynamique depuis opening_hours |
| buffer_minutes | SMALLINT | `0` | NOT NULL, mig 103, CHECK (0,10,15,30). Pause entre RDV en mode libre. En mode home_service sert d'aléa supplémentaire (parking, déchargement, retard) appliqué symétriquement entre RDV |
| booking_horizon_days | SMALLINT | `90` | NOT NULL, mig 168, CHECK (30,60,90). Jusqu'à combien de jours à l'avance une cliente peut réserver en ligne. S'applique aux 2 modes. Réglable dans Planning > Paramètres. Helper `normalizeBookingHorizon()` dans `lib/booking-window.ts` |
| home_service_enabled | BOOLEAN | `FALSE` | NOT NULL, mig 134, mode service à domicile (calcul auto trajet entre RDV) |
| home_service_radius_km | SMALLINT | NULL | mig 170, rayon d'intervention en km (1-200). NULL = pas de limite → fallback sur le cap 60 min de trajet. Validation Haversine à 3 niveaux (BookingModal client, free-slots API, book API). Backfill à 15 km pour les merchants déjà `home_service_enabled=true` |
| shop_lat | DOUBLE PRECISION | NULL | mig 134, latitude de l'adresse marchand (pour calcul trajet 1er RDV). Capturé via BAN dans InfoSection ou géocodé à l'activation home_service |
| shop_lng | DOUBLE PRECISION | NULL | mig 134, longitude de l'adresse marchand |
| hide_address_on_public_page | BOOLEAN | `FALSE` | NOT NULL, mig 135, masque l'adresse sur `/p/[slug]` et dans le JSON-LD streetAddress (privacy pro à domicile = home address). Auto-activé à la 1ère activation de home_service. Ville (`addressLocality`) reste visible pour SEO local |
| contest_enabled | BOOLEAN | `FALSE` | mig 105. Tirage au sort mensuel |
| contest_prize | TEXT | NULL | mig 105. Description du lot a gagner |
| gift_card_enabled | BOOLEAN | `FALSE` | NOT NULL, mig 138. Active la vente de bons cadeaux sur la vitrine |
| gift_card_amounts | JSONB | `[30,50,80,100]` | NOT NULL, mig 138. Array de montants suggérés (chips dans la modal vitrine + le client peut entrer un montant libre) |
| gift_card_message | TEXT | NULL | mig 138, max 300 chars. Mot d'introduction affiché sous le titre de la modal vitrine |
| gift_card_expiry_months | SMALLINT | `3` | NOT NULL, mig 145, CHECK 1-24. Durée de validité des bons en mois. Le destinataire a ce délai après confirmation pour utiliser son bon (segment 3/6/12 mois côté UI dashboard) |
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
| email | TEXT | NULL | CHECK regex + length ≤254, mig 148 (modifiable depuis carte client) |
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

### ~~2.29 merchant_churn_surveys~~ — SUPPRIMEE (mig 169)

Questionnaire de retention post-expiration retire (formulaire de churn). Table `merchant_churn_surveys` + colonnes `merchants.churn_survey_seen_at` / `churn_survey_skip_count` / `team_demo_requested_at` + RPC `increment_churn_survey_skip` droppes par mig 169.

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
| discount_percent | SMALLINT | NULL | CHECK 1-100, mig 153 |
| target_service_ids | UUID[] | NULL | NULL/vide = toute la résa, mig 157 |
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
| notes | TEXT | NULL | note du **merchant** (onglet Notes du BookingDetailsModal) |
| customer_message | TEXT | NULL | mig 167, note libre laissée par la **cliente** à la résa en ligne (vitrine BookingModal). Distincte de `notes`. Affichage lecture seule dans le dashboard |
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
| customer_email | TEXT | NULL | mig 148, snapshot email à la résa (utilisé pour envoyer la confirmation client). Indépendant de `customers.email` qui peut évoluer après. |
| created_at | TIMESTAMPTZ | `NOW()` | |

**RLS** : SELECT public (client_name IS NULL AND slot_date >= CURRENT_DATE), ALL merchant own
**Indexes** : `idx_planning_slots_merchant_date`, `idx_planning_slots_customer` (partial, NOT NULL), `idx_planning_slots_primary_slot_id` (partial, NOT NULL), `idx_planning_slots_deposit_deadline` (mig 089, partial : `deposit_confirmed=false AND deposit_deadline_at IS NOT NULL AND primary_slot_id IS NULL` — speed up cron deposit scan a 500 slots), `idx_planning_slots_booked` (mig 089, partial : `client_name IS NOT NULL` — speed up onglet Reservations dashboard), UNIQUE(merchant_id, slot_date, start_time)

**RPC** : `move_booking(merchant_id, source_slot_id, target_date, target_time)` (mig 091, étendue mig 136 pour les 5 champs home_service, mig 151 pour les 4 champs custom_service_*)

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

Archive des resas liberees pour acompte non recu. Le cron `/api/cron/deposit-expiration` (toutes les 15 min) snapshote la resa ici **avant** de wiper le slot. Le merchant la voit dans l'onglet Reservations (section amber) et peut la ramener ou la supprimer.

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

### 2.47 gift_cards (mig 138)

Bons cadeaux offerts depuis la vitrine `/p/[slug]`. Cycle de vie distinct des `vouchers` (commande → paiement merchant → activation → utilisation), lié au voucher créé à l'activation via `voucher_id`.

| Colonne | Type | Default | Contrainte |
|---------|------|---------|------------|
| id | UUID PK | `gen_random_uuid()` | |
| merchant_id | UUID FK → merchants | NOT NULL | ON DELETE CASCADE |
| code | TEXT | NOT NULL | UNIQUE — format `GIFT-XXXXXX` (6 chars sans 0/O/I/1/L) |
| amount | NUMERIC(10,2) | NOT NULL | CHECK (>0 AND <=1000) |
| sender_first_name | TEXT | NOT NULL | CHECK length 1-60 |
| sender_phone | TEXT | NOT NULL | E.164 sans + |
| sender_phone_country | VARCHAR(2) | NULL | FR/BE/CH |
| sender_email | TEXT | NOT NULL | CHECK length <= 255 |
| sender_message | TEXT | NULL | CHECK length <= 300, mot perso optionnel |
| recipient_first_name | TEXT | NOT NULL | CHECK length 1-60 |
| recipient_phone | TEXT | NOT NULL | E.164 sans + |
| recipient_phone_country | VARCHAR(2) | NULL | FR/BE/CH |
| recipient_email | TEXT | NULL | CHECK length <= 255, optionnel |
| status | TEXT | `'pending_payment'` | NOT NULL CHECK IN (`pending_payment`, `active`, `used`, `cancelled`, `expired`) |
| voucher_id | UUID FK → vouchers | NULL | ON DELETE SET NULL — lié au voucher créé à `confirm-payment` |
| recipient_customer_id | UUID FK → customers | NULL | ON DELETE SET NULL |
| paid_at | TIMESTAMPTZ | NULL | quand merchant a validé le paiement |
| used_at | TIMESTAMPTZ | NULL | quand voucher consommé (set par hook dans /api/vouchers/use) |
| cancelled_at | TIMESTAMPTZ | NULL | quand annulé |
| cancellation_reason | TEXT | NULL | `merchant` / `auto_expired_3d` / `no_payment` |
| expires_at | TIMESTAMPTZ | NULL | mig 138, durée fixe 3 mois après paid_at à l'origine ; depuis mig 145 = `merchants.gift_card_expiry_months` (1-24, défaut 3) |
| pdf_url | TEXT | NULL | mig 141, URL publique du PDF imprimable rendu par Satori (bucket `gift-cards-pdf`) |
| sender_last_name | TEXT | NULL | mig 141, optionnel |
| recipient_last_name | TEXT | NULL | mig 141, optionnel |
| kind | TEXT | `'amount'` | mig 140, NOT NULL CHECK IN (`amount`, `services`) |
| service_ids | UUID[] | NULL | mig 140, prestations choisies si kind=services |
| service_snapshot | JSONB | NULL | mig 140, snapshot {id, name, price} au moment de l'achat (fallback si la presta est supprimée) |
| scheduled_send_at | TIMESTAMPTZ | NULL | mig 142, date d'envoi différée au destinataire (anniversaire, Noël…). Cron `gift-cards-deliver` envoie SMS+email quand échue |
| notified_at | TIMESTAMPTZ | NULL | mig 142, posé par le cron deliver après envoi (anti-double) |
| image_url | TEXT | NULL | mig 143, URL publique du PNG du bon (bucket `gift-cards-pdf` aussi) — rendu Satori partagé avec le PDF, embarqué dans les emails offreur+destinataire |
| expiry_reminder_sent_at | TIMESTAMPTZ | NULL | **mig 146**, posé par le cron `gift-cards-expire` passe 0 quand le SMS rappel J-7 a été envoyé. NULL = pas encore envoyé. 1 SMS max par bon (anti-spam) |
| created_at | TIMESTAMPTZ | `NOW()` | NOT NULL |
| updated_at | TIMESTAMPTZ | `NOW()` | NOT NULL — trigger auto |

**Indexes** :
- `idx_gift_cards_merchant_status (merchant_id, status, created_at DESC)` — page dashboard avec onglets
- `idx_gift_cards_voucher (voucher_id) WHERE voucher_id IS NOT NULL` — lookup pour SMS offreur quand consommé
- `idx_gift_cards_pending_old (created_at) WHERE status='pending_payment'` — cron auto-cancel
- `idx_gift_cards_active_no_reminder (expires_at) WHERE status='active' AND expiry_reminder_sent_at IS NULL` — **mig 146**, scan rapide cron rappel J-7

**Trigger** : `update_gift_cards_updated_at` → `update_updated_at_column()`

**RLS** : merchant SELECT + UPDATE own (via `merchants.user_id = auth.uid()`), INSERT et SELECT public/anon = service_role only via API routes (anti-spam, route POST publique rate-limitée 3/h par IP).

**vouchers.source CHECK étendu** : `('birthday', 'referral', 'redemption', 'welcome', 'offer', 'gift')` — le voucher créé à l'activation porte `source='gift'`.

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
| 111 | booking_deposit_failures | Table archive `booking_deposit_failures` : snapshot des resas liberees pour acompte non recu (merchant_id, customer_id, client_name/phone, service_ids UUID[], original_slot_date/time, total_duration_minutes, notes, deposit_amount, expired_at). Index `(merchant_id, expired_at DESC)`. RLS SELECT+DELETE pour merchants (via `merchants.user_id = auth.uid()`), INSERT service_role only. Alimentee par le cron `/api/cron/deposit-expiration` (`*/15 * * * *`, helper `src/lib/deposit-release.ts`) |
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
| 138 | gift_cards | Table `gift_cards` (bons cadeaux offerts depuis vitrine, payés via lien externe merchant) + 3 colonnes `merchants` (`gift_card_enabled BOOLEAN`, `gift_card_amounts JSONB DEFAULT [30,50,80,100]`, `gift_card_message TEXT`) + extension `vouchers.source` CHECK avec `'gift'`. Indexes composé `(merchant_id, status, created_at DESC)` + dédié `voucher_id` (lookup SMS offreur quand consommé) + partiel `(created_at) WHERE status='pending_payment'` (cron auto-cancel). RLS merchant SELECT/UPDATE own, INSERT public via API service_role uniquement |
| 139 | sms_gift_card_types | Étend `sms_logs.sms_type` CHECK avec 2 nouveaux types : `gift_card_received` (envoyé au destinataire à la confirmation paiement) et `gift_card_used` (envoyé à l'offreur quand le destinataire consomme). Tous les types existants conservés (reminder, confirmation, birthday, referral_reward, booking_*, marketing) |
| 140 | gift_card_services | Mode "offrir une prestation" : `gift_cards.kind TEXT NOT NULL DEFAULT 'amount' CHECK IN ('amount','services')` + `service_ids UUID[]` + `service_snapshot JSONB` (snapshot {id,name,price} fallback si presta supprimée) |
| 141 | gift_card_payment_pdf | `gift_cards.pdf_url TEXT` (PDF imprimable Satori, bucket gift-cards-pdf) + `sender_last_name`/`recipient_last_name TEXT` optionnels |
| 142 | gift_card_scheduling | `gift_cards.scheduled_send_at TIMESTAMPTZ` (envoi différé destinataire pour anniv/Noël) + `notified_at TIMESTAMPTZ` (posé par cron `gift-cards-deliver`, anti-double) |
| 143 | gift_card_image | `gift_cards.image_url TEXT` (PNG du bon rendu Satori, embarqué dans emails offreur+destinataire). Bucket `gift-cards-pdf` étendu pour accepter `image/png` |
| 144 | gift_card_merchant_image | (Abandonné/cleanup) — feature image custom merchant ajoutée puis retirée par 145 |
| 145 | gift_card_expiry_months_cleanup | `merchants.gift_card_expiry_months SMALLINT NOT NULL DEFAULT 3 CHECK 1-24` (durée validité bon personnalisable, segment 3/6/12 mois côté UI). DROP `merchants.gift_card_image_url` (feature 144 abandonnée) + DROP policy bucket `merchant-uploads` (suppression manuelle Supabase Storage requise) |
| 146 | gift_card_expiry_reminder | `gift_cards.expiry_reminder_sent_at TIMESTAMPTZ` (rappel SMS J-7 destinataire avant expiration, 1 envoi max par bon) + index partiel `(expires_at) WHERE status='active' AND expiry_reminder_sent_at IS NULL` (scan rapide cron `gift-cards-expire` passe 0) |
| 147 | contest_monthly_prizes | Table `merchant_contest_prizes (merchant_id, contest_month VARCHAR(7), prize_description TEXT NOT NULL CHECK 1-300, created_at, updated_at, PK (merchant_id, contest_month))` pour planifier différents lots par mois (avril = coffret, mai = bon 30€…). Le cron `monthly-contest` lit ici en priorité, fallback sur `merchants.contest_prize`. RLS merchant manage own. Trigger `update_updated_at_column`. + Colonne `merchants.contest_missing_prize_alerted_at TIMESTAMPTZ` (idempotence du push+email envoyé J-5 par le cron `morning-jobs` quand le merchant n'a pas défini de lot pour le mois courant — max 1 alerte/mois via comparaison de la date) |
| 148 | customer_email | `customers.email TEXT` (modifiable depuis la carte client via `EmailSection`, CHECK regex + length ≤254) + `merchant_planning_slots.customer_email TEXT` (snapshot à la résa). Email collecté optionnel dans `BookingModal` ; déclenche `BookingConfirmationEmail` (récap RDV + lien acompte si demandé + lien carte fidélité). Pas d'unicité (même email peut servir chez plusieurs marchands). Migrations 001-144+008b déplacées dans `supabase/migrations/old/` (référence historique uniquement, déjà appliquées prod). |
| 149 | milestone_booking_count_online_only | Recrée `merchant_milestone_stats(uuid[])` (mig 133) avec `AND booked_online = true` dans le lateral join `b`. Bug : la milestone "Premiere reservation en ligne" du cron `/api/cron/email-engagement` se déclenchait sur la 1re saisie manuelle dashboard (compteur `booking_count` ne distinguait pas manuel vs vitrine). Cas observé : letjbeauty@hotmail.com 2026-05-02. |
| 150 | sms_campaign_pending_phones | `sms_campaigns.pending_phones JSONB DEFAULT '[]'`. Stocke les numeros non envoyes apres echec credit OVH (HTTP 402) detecte par `sendSms`. Le dispatch detecte le flag `creditExhausted`, break la boucle, sauve les phones restants + re-schedule a +1h. Au dispatch suivant, `pending_phones` non-vide → envoi cible (pas de re-resolution audience pour eviter doublons). Cumul `recipient_count`/`cost_cents` en cas de reprise. Vide a la fin (status='done'). |
| 151 | move_booking_custom_service | Recrée `move_booking` (mig 091/136) pour transférer ET reset les 4 champs presta sur mesure (`custom_service_name/duration/price/color`, mig 130). Bug : déplacer un RDV avec presta custom laissait la presta orpheline sur l'ancien créneau et la cible la perdait (drag&drop merchant + self-reschedule mode créneaux). Côté TS : `customer-edit/route.ts` aussi patché (SELECT slot, free mode INSERT, slot mode fallback clear+fill, DELETE slot mode clear). |
| 152 | processed_stripe_events | Table `processed_stripe_events (event_id PK, event_type, processed_at)` pour dédup webhook Stripe. INSERT en tête de `/api/stripe/webhook` ; conflit PK → already processed → return 200 direct. Évite l'envoi 2-3× des emails non-idempotents (`subscription.updated/deleted`, `invoice.payment_*`) lors des retries Stripe (timeout >30s ou 5xx). RLS activée sans policy = service_role only. Roadmap P0 #1. |
| 153 | offer_discount | `merchant_offers.discount_percent SMALLINT NULL CHECK 1-100` (NULL = bandeau marketing seul, grandfathered) + `merchants.welcome_offer_discount_percent SMALLINT NULL CHECK 1-100` (NULL = legacy voucher mode) + `merchant_planning_slots.applied_offer_id` (FK merchant_offers ON DELETE SET NULL) + `applied_offer_percent` + `applied_welcome_percent` (snapshots des % appliqués au moment du RDV — historique fidèle même si l'offre est désactivée). CHECK `applied_offer_consistency` : `applied_offer_id` et `applied_offer_percent` toujours fournis ensemble. Helper `src/lib/booking-pricing.ts` : `computeBookingPrice` source unique cumul member×welcome×promo (réutilisé vitrine + manual booking + serveur). Welcome devient réduction immédiate à la 1ère résa en ligne quand `discount_percent` saisi (voucher post-résa supprimé en mode online ; conservé en mode offline / `auto_booking_enabled=false` ou legacy sans %). |
| 154 | sms_deposit_request | Étend CHECK `sms_logs.sms_type` avec `deposit_request` (envoyé à la cliente quand le merchant ramène une résa archivée d'acompte échoué via "Relancer l'acompte" dans `BringBackBookingModal` — template FR/EN inclut `merchant.deposit_link`). Au passage, ajoute `gift_card_expiry_reminder` qui était utilisé en code (cron gift-cards-expire mig 146) sans être présent dans le CHECK. Pattern lock-friendly : `ADD CONSTRAINT NOT VALID` puis `VALIDATE CONSTRAINT` séparé (évite ACCESS EXCLUSIVE prolongé sur table à fort débit d'écriture). Côté TS : `SmsType` étendu dans `src/lib/sms.ts` + dedup `deposit_request` scopé à 1h (vs forever) — autorise une 2e relance légitime sur même slot mode créneaux quand le cycle d'archive recommence. |
| 155 | admin_growth_weekly | RPC `admin_growth_weekly(weeks_back INT)` retourne 8 séries hebdo Europe/Paris pour la Growth tab admin (RDV vitrine vs manuel, nouveaux clients vs nouvelles cartes, scans, signups, paid conversions, marketing SMS, gift cards CA) + RPC `admin_growth_rolling()` pour les 5 KPIs cards (net new paying 4w + delta vs prev 4w, WAU/MAU, share online, cohort 4w retention, gift cards CA 4w). Index partial `idx_planning_slots_booked_at_growth ON merchant_planning_slots(booked_at) WHERE client_name IS NOT NULL AND primary_slot_id IS NULL AND booked_at IS NOT NULL`. Toutes les RPCs excluent les super_admins via `LEFT JOIN excluded ex ... WHERE ex.id IS NULL` (NULL-safe + meilleur plan d'exécution vs NOT IN). **Note SQL** : `CROSS JOIN cutoff/base` explicite (pas la virgule) car la virgule a une précédence lâche → `FROM t, cutoff LEFT JOIN ex ON t.col` parse en `FROM t, (cutoff LEFT JOIN ex ON t.col)` et casse la résolution de t (erreur 42P01 invalid reference). Source de vérité UI : `/admin/analytics` tab Growth via route dédiée `/api/admin/analytics/growth`. |
| 156 | voucher_manual_validation | `vouchers.manual_validation_reason TEXT NULL CHECK (length>=3)` + `vouchers.manually_validated_by UUID NULL` (FK merchants ON DELETE SET NULL). Audit trail pour les vouchers marqués utilisés depuis le dashboard merchant (vs scan client classique). Cas d'usage v1 : page `/dashboard/referrals` — boutons "Valider" sur les badges pending/created déclenchent une modale avec textarea raison obligatoire, puis POST `/api/referrals/[id]/validate` (body `{side: 'referred'\|'referrer', reason}`). Côté `referred` : marque le voucher filleul utilisé + déclenche le helper partagé `completeReferralAfterReferredUse` (création voucher parrain + push + SMS, idempotent). Côté `referrer` : marque le voucher parrain utilisé. Tous les flux cross-merchant push/SMS/opt-out conservés. Réutilisable plus tard pour gift_cards / birthday vouchers (colonnes neutres). |
| 157 | offer_target_services | `merchant_offers.target_service_ids UUID[] NULL` (NULL/vide = promo applicable à toute la résa, comportement legacy ; rempli = la promo ne s'applique qu'aux prestations listées). + `merchant_planning_slots.applied_offer_amount NUMERIC(10,2) NULL CHECK >=0` snapshot du montant € réellement économisé par la promo (per-line aware). Helper `computeBookingPrice` étendu : accepte `serviceLines[]` + `promoTargetServiceIds[]?` ; member et welcome restent appliqués au total, seule la promo est per-line. Helper `validateAppliedDiscounts` recalcule serveur-side `applied_offer_amount` depuis `target_service_ids` × prix réels (anti-spoof). UI dashboard `PromoSection` multi-select des services (default = toutes). UI vitrine `BookingModal` : badge `-X%` + prix barré sur les tuiles ciblées + bandeau "Promo -X% sur Coloration" + breakdown "Promo -7€" au lieu de "Promo -10%" quand ciblée. UI manual `BookingDetailsModal` : hint italique sous le toggle promo listant les prestations concernées. |
| 158 | example_vitrine_sms | `merchants.example_vitrine_sms_sent_at TIMESTAMPTZ NULL` (dedup SMS exemple vitrine T+15min après signup, cron `sms-trial-marketing` SECTION 0). Backfill `NOW()` sur tous les existants (defense en profondeur, évite cron pickup massif). Index partial `idx_merchants_example_vitrine_pending ON (created_at) WHERE example_vitrine_sms_sent_at IS NULL`. |
| 159 | merchant_affiliation | `merchants.referred_by_merchant_id UUID NULL REFERENCES merchants(id) ON DELETE SET NULL` (parrainage merchant→merchant, distinct du parrainage cliente→cliente existant). Index partial `idx_merchants_referred_by`. Capture via `?ref=<slug>` sur landing → `qarte_signup_source = affiliate_<slug>` localStorage → API `/api/merchants/create` lookup `merchants.slug` + check anti self-ref `refMerchant.user_id !== user_id`. |
| 160 | affiliate_parent_notified | `merchants.affiliate_parent_notified_at TIMESTAMPTZ NULL` + backfill `NOW()` + index partial. Atomic claim sur Stripe webhook `invoice.payment_succeeded` (gate `billing_reason='subscription_create'`) pour envoi unique du `AffiliateConversionEmail` au parrain quand le filleul convertit. |
| 161 | marketing_sms_logs CHECK + catch-up consolidé | Étend `merchant_marketing_sms_logs.sms_type` CHECK avec 8 types alignés sur `TrialSmsType` TS union (ajoute `checkin_nudge`+`checkin_combo` legacy en code mais absents du CHECK depuis le début, + `example_vitrine` ajouté par mig 158). Catch-up consolidé idempotent qui inclut aussi 124 (`merchant_planning_slots.attendance_status` + index + backfill, requis par cron `morning-jobs.attendanceAutoMark`), 146 (`gift_cards.expiry_reminder_sent_at` + index partial), 147 (table `merchant_contest_prizes` + RLS + `merchants.contest_missing_prize_alerted_at`), 149 (RPC `merchant_milestone_stats` avec `booked_online=true`). Tout `IF NOT EXISTS / OR REPLACE / DROP IF EXISTS`. Bug introspection 2026-05-07 : 4 migs identifiées comme jamais appliquées en prod (124/146/147/149). |
| 162 | sms_robustness | **Robustesse SMS transactionnels**. Sur `sms_logs` : ajout `error_class TEXT` (CHECK 8 valeurs : success/invalid_phone/no_credit/rate_limit/timeout/server_error/config_error/unknown) + `provider_msg_id TEXT` (renomme conceptuellement `ovh_job_id` mal nommé : c'est aussi le SMS Partner message_id) + `fallback_attempted_at TIMESTAMPTZ` + `dlr_received_at TIMESTAMPTZ` + `verify_after TIMESTAMPTZ` + `delivery_status TEXT` (CHECK delivered/not_delivered/waiting, raw DLR SMS Partner). Étend `status` CHECK avec `pending_verify` (SMS envoyé chez SMS Partner mais ambigu, attendre DLR avant de décider du fallback OVH). Backfill `provider_msg_id = ovh_job_id`. **2 indexes hot path** : `idx_sms_logs_pending_verify ON (status, verify_after) WHERE status='pending_verify' AND verify_after IS NOT NULL` (cron sms-verify) + `idx_sms_logs_provider_msg_id ON (provider, provider_msg_id) WHERE provider_msg_id IS NOT NULL` (DLR webhook lookup, sans cet index = full scan = retry storm SMS Partner). Nouvelle table `sms_phone_blacklist (phone PK, reason, detected_provider CHECK ovh/sms_partner/both, added_at, last_seen_at, attempt_count)` pour les numéros confirmés invalides après 2 tentatives sur 2 providers (skip à la source via `isPhoneBlacklisted()` cache LRU 1000 entries). RLS activée sans policy = service_role only. App config keys utilisées : `sms_alert_*_last_sent_at` pour dedup admin alerts + `sms_evening_last_run_at` (ran_at + sent + errors) garde-fou anti-prématurité de `sms-batch-audit`. |
| 163 | past_due_sms | **Dunning past_due — 2 SMS transactionnels J0 + J+2** en complement des 4 emails existants (J0/J+3/J+7/J+10). Ajoute 2 colonnes dedup atomiques sur `merchants` : `past_due_sms1_sent_at TIMESTAMPTZ` (J0, envoye par Stripe webhook `invoice.payment_failed`) + `past_due_sms2_sent_at TIMESTAMPTZ` (J+2, envoye par cron `morning` si toujours past_due). Reset des 2 flags a NULL sur `invoice.payment_succeeded` (cycle suivant repart proprement). **Index partiel** `idx_merchants_past_due_sms2_pending ON merchants(updated_at) WHERE subscription_status='past_due' AND past_due_sms1_sent_at IS NOT NULL AND past_due_sms2_sent_at IS NULL` — cron morning filtre rapidement les candidats J+2. **CHECK `merchant_marketing_sms_logs.sms_type` etendue** avec 2 nouveaux types : `past_due_initial` + `past_due_reminder` (alignes sur src/lib/sms-past-due.ts). Helper `sendPastDueSms(supabase, merchant, step)` : guards en cascade (deleted_at, no_contact, status, phone, blacklist, step 2 requires sms1) + atomic UPDATE WHERE flag IS NULL avec re-check status (race-safe webhook/cron) + envoi via selectProvider (FR/BE→SMS Partner, CH→OVH) + log + rollback flag si echec. Caractere transactionnel critique (info compte) → ne respecte PAS `marketing_sms_opted_out`, seulement `no_contact` (full opt-out). Helper `resetPastDueSmsFlags` appele dans `invoice.payment_succeeded`. |
| 165 | deposit_new_customers_only | `merchants.deposit_only_for_new_customers BOOLEAN NOT NULL DEFAULT FALSE`. Toggle merchant : si TRUE, l'acompte au booking en ligne est skip pour les clientes deja connues (`customers` row existe pour ce `merchant_id` = retour). Gate server `/api/planning/book/route.ts` (`skipForReturning = merchant.deposit_only_for_new_customers && !isNewCustomer`) + UI client `BookingModal.tsx` (`recognition.kind === 'known'`). Coexiste OR avec `member_programs.skip_deposit` (programme membre prioritaire). Manual booking inchange (jamais d'acompte). UI dashboard : nouveau toggle (couleur amber-500) dans la section Acompte de `/dashboard/planning` + ligne discrète gray-500 en bas linkant `/dashboard/members` ("Pour exempter une cliente précise ou remise permanente, crée un programme membre"). |
| 166 | billing_interval_semestrial | **CHECK constraint sur `merchants.billing_interval`** : valeurs autorisées `'monthly' | 'semestrial' | 'annual'`. Plan 6 mois (Tout-en-un 120€ / Fidélité 95€, 1 mois offert) remplace l'annuel pour les nouveaux merchants en testing depuis mai 2026. Abonnés annuels existants conservent leur plan + NFC offerte legacy. Stripe : `interval='month' + interval_count=6` (configuré côté dashboard Stripe). 2 nouveaux env `STRIPE_PRICE_ID_SEMESTRIAL` + `STRIPE_PRICE_FIDELITY_SEMESTRIAL`. Bonus SMS engagement : mensuel 100 / 6 mois 110 / annuel 120 (lookup `ENGAGEMENT_BONUS` dans `lib/plan-tiers.ts`). |
| 167 | customer_booking_message | `merchant_planning_slots.customer_message TEXT NULL` — note libre laissée par la cliente à la résa en ligne (distincte de `notes`, la note merchant). `move_booking` recréée pour transférer/reset le champ. |
| 168 | booking_horizon | `merchants.booking_horizon_days SMALLINT NOT NULL DEFAULT 90 CHECK (30,60,90)` — horizon de réservation configurable (combien de jours à l'avance une cliente peut réserver en ligne). Remplace la constante code 90j partagée. S'applique aux 2 modes. Réglable dans Planning > Paramètres > Résa en ligne. Source unique `lib/booking-window.ts` (`normalizeBookingHorizon` fallback 90), lue par les 4 consommateurs (api planning GET public, p/[slug] SSR, BookingModal maxDate, api book garde serveur). Colonne additive NOT NULL DEFAULT — rétrocompat totale. |
| 164 | past_due_blocking | **Blocage merchants past_due apres 72h**. Ajoute `merchants.past_due_since TIMESTAMPTZ` set par Stripe webhook `invoice.payment_failed` a la transition active→past_due (atomic claim WHERE past_due_since IS NULL — Stripe peut re-fire, on ne reset pas le compteur a chaque retry), reset NULL sur `invoice.payment_succeeded`. **Backfill conditionnel** (mai 2026, decision produit "trop d'impayes") : pour les past_due deja en base, `past_due_since = COALESCE(past_due_sms1_sent_at, updated_at)` UNIQUEMENT si cette estimation est > 72h (donc bloque immediatement les past_due > 72h, laisse les recents passer par le flow webhook normal). Source `past_due_sms1_sent_at` (mig 163) plus fiable que `updated_at` (toggle settings reset). Index partiel `idx_merchants_past_due_since ON (past_due_since) WHERE subscription_status='past_due' AND past_due_since IS NOT NULL`. **Source de verite double** : (1) blocage 72h via helper [`src/lib/merchant-access.ts`](../src/lib/merchant-access.ts) `isPastDueBlocked()` + `isMerchantBlocked()` (combine trial-expired + past_due_blocked), utilise par dashboard layout (redirect dur vers `/dashboard/subscription`) + 8 routes API client-facing (checkin, cagnotte/checkin, welcome, referrals, planning/book, vouchers/use, merchant-offers/claim, gift-cards/request) qui retournent 403 + `<SuspendedBanner />` etendu sur `/p/[slug]` + `/scan/[code]` (meme texte neutre "Page suspendue", on ne mentionne PAS l'impaye cote client). (2) emails dunning J+3/J+7/J+10 cron morning bascules de `updated_at` vers `past_due_since` (sinon toggle settings reset le compteur — bypass trivial). UX dashboard `/dashboard/subscription` : nouveau bandeau rouge `alertPastDueBlocked` "Paiement a regulariser — compte suspendu" + desc "Tes clientes ne peuvent plus reserver ni scanner. Mets a jour ta carte..." (separe du `alertPastDue` initial qui reste pour J0-J+2). |
| 170 | home_service_radius | `merchants.home_service_radius_km SMALLINT NULL CHECK 1-200` — rayon d'intervention configurable pour le service à domicile (avant : cap dur 60 min de trajet, non réglable). NULL = pas de limite → fallback sur le cap 60 min existant (rétrocompat). Backfill **15 km** pour les merchants déjà `home_service_enabled=true` (valeur médiane pro mobile urbaine). Pré-rempli à 20 km à toute nouvelle activation côté UI. Validation **Haversine** (vol d'oiseau, [`src/lib/geo.ts`](../src/lib/geo.ts) — module pur extrait de `travel-time.ts` pour être importable client) à 3 niveaux : BookingModal vitrine côté client (bloque l'étape avant tout call API), `/api/planning/free-slots` (retourne `{ slots: [], outOfZone: true, radiusKm }`, court-circuite ORS), `/api/planning/book` (defense in depth, 400 `out_of_zone`). Couplé au badge vitrine `/p/[slug]` « À domicile · jusqu'à X km » (pill primary color, cohabite avec « Y aller » si adresse visible, ou le remplace fonctionnellement si masquée). |
| 169 | drop_churn_survey | **Suppression du formulaire de churn** (questionnaire post-expiration). `DROP TABLE merchant_churn_surveys` + `DROP FUNCTION increment_churn_survey_skip` + `ALTER merchants DROP COLUMN churn_survey_seen_at, churn_survey_skip_count, team_demo_requested_at`. Code retire en parallele : pages `/dashboard/survey` + `/admin/churn-surveys`, routes `/api/churn-survey` / `/api/admin/churn-surveys` / `/api/merchant/survey-skip`, 3 templates email (ChurnSurveyReminder, PostSurveyFollowUp, PostSurveyLastChance), section 1b du cron `morning`, `src/lib/churn-survey-config.ts`. Les merchants fully expired sont desormais rediriges directement vers `/dashboard/subscription`. La valeur `churn_survey` reste dans le CHECK `merchant_marketing_sms_logs.sms_type` (lignes historiques). |

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
