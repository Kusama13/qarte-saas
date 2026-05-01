-- 144 — gift cards : image personnalisée uploadée par le merchant
--
-- Le merchant peut uploader une image (photo salon, ambiance, palette) qui
-- sera utilisée comme arrière-plan du bon cadeau (zone visuelle droite +
-- overlay assombri pour garder la lisibilité du texte). Si NULL → on retombe
-- sur le rendu drenched primary→secondary par défaut.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_image_url TEXT;

COMMENT ON COLUMN merchants.gift_card_image_url IS
  'URL publique de l''image custom uploadée pour personnaliser les bons cadeaux. NULL = rendu drenched primary par défaut.';

-- Bucket dédié aux uploads merchant (réutilisable pour d'autres features
-- type photo de profil, illustrations, etc.). Public en lecture car
-- embarquée dans les PDF/PNG des bons cadeaux distribués aux destinataires.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-uploads',
  'merchant-uploads',
  true,
  5242880,                                                 -- 5 MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS : lecture publique (les images sont embarquées dans les bons distribués)
DROP POLICY IF EXISTS "Public read merchant uploads" ON storage.objects;
CREATE POLICY "Public read merchant uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'merchant-uploads');
