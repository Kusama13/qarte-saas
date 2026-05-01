-- 145 — gift cards : durée de validité personnalisable + cleanup image custom
--
-- 1) Ajout `merchants.gift_card_expiry_months` : le merchant choisit lui-même
--    la durée de validité de ses bons (1 à 24 mois, défaut 3). Reflété dans
--    le PDF/PNG généré ET dans l'expiration auto par le cron.
--
-- 2) Suppression de la colonne liée à l'image custom uploadée par le merchant
--    (mig 144) : on a supprimé la feature côté UI, on épure la DB.
--    - merchants.gift_card_image_url (DROP)
--    - bucket storage `merchant-uploads` (DROP, plus utilisé)
--
-- /!\ on garde `gift_cards.image_url` (mig 143) — c'est le PNG rendu par
-- Satori embarqué dans l'email destinataire, toujours utilisé.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_expiry_months SMALLINT NOT NULL DEFAULT 3
    CHECK (gift_card_expiry_months BETWEEN 1 AND 24);

COMMENT ON COLUMN merchants.gift_card_expiry_months IS
  'Durée de validité des bons cadeaux en mois (1-24, défaut 3). Le destinataire a ce délai après la validation pour utiliser son bon.';

-- Cleanup colonne image custom merchant (feature désactivée en V1)
ALTER TABLE merchants DROP COLUMN IF EXISTS gift_card_image_url;

-- Drop la policy RLS du bucket (la seule chose qu'on peut faire en SQL)
DROP POLICY IF EXISTS "Public read merchant uploads" ON storage.objects;

-- /!\ Le bucket `merchant-uploads` doit être supprimé manuellement via le
-- dashboard Supabase (Storage > merchant-uploads > Empty bucket > Delete) :
-- Postgres bloque DELETE FROM storage.objects/buckets directement (RLS
-- protect_delete()). Pas critique si tu le laisses : il devient juste
-- orphelin, plus aucun code ne le touche.
