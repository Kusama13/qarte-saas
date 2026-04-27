-- Migration 130 : Prestation personnalisée one-shot par booking.
--
-- Permet au merchant de creer, lors de la prise de rdv, une prestation
-- ephemere (nom + duree + prix + couleur) sans polluer son catalogue
-- merchant_services. Elle vit avec le slot et meurt avec lui.
--
-- Une seule prestation custom par slot (suffit pour 95% des cas reels).
-- Si non utilisee, les 4 colonnes restent NULL.
--
-- Calculs aval :
-- - totalMinutes booking = sum(merchant_services.duration via junction) + COALESCE(custom_service_duration, 0)
-- - totalPrice booking   = sum(merchant_services.price    via junction) + COALESCE(custom_service_price,    0)
-- - Stats CA : custom_service_price compte (cf. /api/dashboard/stats/route.ts slotRevenue)
-- - Top prestations : custom_service_* IGNORES (volontaire — pas de recurrence)

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS custom_service_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_service_duration INTEGER,
  ADD COLUMN IF NOT EXISTS custom_service_price INTEGER,
  ADD COLUMN IF NOT EXISTS custom_service_color TEXT;

-- Garde-fous : duree positive si renseignee, prix positif si renseigne
ALTER TABLE merchant_planning_slots
  ADD CONSTRAINT custom_service_duration_positive
    CHECK (custom_service_duration IS NULL OR custom_service_duration > 0),
  ADD CONSTRAINT custom_service_price_positive
    CHECK (custom_service_price IS NULL OR custom_service_price >= 0);
