-- 143 — gift cards : image PNG (rendu Satori) embarquée dans l'email destinataire
--
-- En complément du PDF A5 imprimable (mig 141), on génère une variante PNG
-- au format portrait (1240×1758px ≈ A5 à 210dpi) du même rendu Satori, pour
-- l'embarquer comme <img> dans l'email reçu par le destinataire. Le PNG est
-- stocké dans le même bucket `gift-cards-pdf` que les PDF (l'id reste tel quel,
-- on étend juste les MIME types autorisés).

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN gift_cards.image_url IS
  'URL publique du PNG portrait (rendu Satori) embarqué dans l''email destinataire. Généré au moment de confirm-payment.';

-- Étend les MIME types acceptés du bucket existant pour autoriser image/png
-- en plus de application/pdf. (Le bucket a été créé par la mig 141.)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'image/png']
WHERE id = 'gift-cards-pdf';
