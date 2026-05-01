-- 141 — gift cards : lien paiement dédié + PDF imprimable + tracking public
--
-- 1) Lien paiement dédié (obligatoire pour activer les bons) : un merchant
--    configure ici 1 ou 2 liens spécifiques aux bons cadeaux (Revolut, PayPal,
--    Stripe Payment Link…). Indépendants des deposit_link* du Planning,
--    aucun fallback : si vide, l'option bons cadeaux est inactive.
--
-- 2) pdf_url : URL du PDF A5 imprimable généré au moment de la confirmation
--    de paiement, joint aux emails offreur + destinataire.
--
-- 3) Pas de nouvelle colonne pour le tracking : la route publique
--    /gift-cards/track/[code] lit gift_cards.code (déjà unique) et expose
--    uniquement les champs publics (status, dates, prénoms — pas les emails
--    ni numéros).

-- ============================================
-- merchants : liens paiement dédiés bons cadeaux
-- ============================================

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_payment_link TEXT,
  ADD COLUMN IF NOT EXISTS gift_card_payment_link_label TEXT,
  ADD COLUMN IF NOT EXISTS gift_card_payment_link_2 TEXT,
  ADD COLUMN IF NOT EXISTS gift_card_payment_link_2_label TEXT;

COMMENT ON COLUMN merchants.gift_card_payment_link IS
  'Lien paiement dédié bons cadeaux (Revolut/PayPal/Stripe…). Indépendant de deposit_link, aucun fallback.';
COMMENT ON COLUMN merchants.gift_card_payment_link_label IS
  'Libellé affiché du lien (ex: "Revolut"). Auto-détecté si NULL.';

-- ============================================
-- gift_cards : URL du PDF imprimable
-- ============================================

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

COMMENT ON COLUMN gift_cards.pdf_url IS
  'URL publique du PDF A5 imprimable. Généré au moment de confirm-payment, stocké dans bucket gift-cards-pdf.';

-- ============================================
-- gift_cards : noms de famille (offreur + destinataire)
-- ============================================
-- Permet d'afficher un nom complet sur le PDF, dans les emails et la fiche
-- merchant. Optionnels pour ne pas casser les commandes existantes.

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS sender_last_name TEXT
    CHECK (sender_last_name IS NULL OR length(sender_last_name) BETWEEN 1 AND 60),
  ADD COLUMN IF NOT EXISTS recipient_last_name TEXT
    CHECK (recipient_last_name IS NULL OR length(recipient_last_name) BETWEEN 1 AND 60);

-- ============================================
-- Index pour tracking public (lookup par code)
-- ============================================
-- code est déjà UNIQUE → btree implicit, pas besoin d'index supplémentaire.

-- ============================================
-- Storage : bucket public pour les PDF des bons cadeaux
-- ============================================
-- Public en lecture (les URLs sont incluses dans les emails et la page de
-- suivi /gift-cards/track/[code]). L'upload se fait via service_role
-- (route /api/gift-cards/[id]/confirm-payment), donc pas de policy INSERT
-- pour les utilisateurs anonymes ou authentifiés normaux.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gift-cards-pdf',
  'gift-cards-pdf',
  true,
  5242880,                       -- 5 MB max par PDF (large marge, un A5 fait ~50-200 KB)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS : lecture publique des PDF (lien direct dans email + page suivi)
DROP POLICY IF EXISTS "Public read gift card PDFs" ON storage.objects;
CREATE POLICY "Public read gift card PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gift-cards-pdf');
