-- Migration 132 : Convertit custom_service_price de INTEGER (centimes) vers DECIMAL(10,2) (euros)
--
-- Bug originel : la colonne avait ete creee en INTEGER en pensant stocker des centimes,
-- mais merchant_services.price (la colonne de reference) est en decimal(10,2) en euros.
-- Resultat : formatCurrency affichait 4000 € au lieu de 40 €, et les sommes total =
-- catalogPrice + customPriceCents donnaient des valeurs absurdes.
--
-- Le USING divise les valeurs existantes par 100 (cas ou un merchant a deja teste la
-- feature avant ce fix) pour les ramener en euros.

ALTER TABLE merchant_planning_slots
  ALTER COLUMN custom_service_price TYPE DECIMAL(10,2)
  USING (custom_service_price::DECIMAL / 100);

ALTER TABLE booking_deposit_failures
  ALTER COLUMN custom_service_price TYPE DECIMAL(10,2)
  USING (custom_service_price::DECIMAL / 100);
