# Gift Cards V3 — Handoff (post-compaction)

Commit en attente : `0f2927d3` (4 commits ahead of main, jamais pushés).

## Ce qui est fait

### Rendu visuel — refonte complète Satori
- `src/lib/gift-card-render.tsx` : layout A6 paysage (1748×1240 print, 1240×880 email), clone du modèle spa hammam montré par user. Palette **fixe** dusty rose / cream / brun foncé (PALETTE constant). Pas de personnalisation V1.
- 1 seul `satori()` puis 2 passes Resvg `fitTo` → ~33% perf.
- Polices via `@fontsource` WOFF (pas TTF, Google Fonts ne sert plus que WOFF2 que Satori ne lit pas) : Bodoni Moda 400/700italic, Spectral italic, Manrope 500, JetBrains Mono.
- Cache fonts module-scope (`src/lib/gift-card-fonts.ts`), warm sur Vercel.
- `src/lib/amount-in-words.ts` : 50 → "Cinquante euros" (FR/EN, 0-9999).
- `src/lib/gift-card-pdf.ts` : `renderAndUploadGiftCardAssets()` unifie PDF+PNG en 1 appel + `versionedPath()` pour casser le cache Gmail/CDN.
- Plus de `src/pdf/GiftCardPDF.tsx` (ancien `@react-pdf/renderer`, retiré du package.json).

### Téléphone sur le bon — sécurité
- Lit `merchants.display_phone` (numéro vitrine, opt-in) UNIQUEMENT.
- **JAMAIS** `merchants.phone` (perso, login).
- `displayPhoneNumber(phone, country)` avec country merchant pour BE/CH propres.
- Si `display_phone` vide → pas de tél sur le bon (juste l'URL `getqarte.com/p/slug` si auto_booking).

### Validité personnalisable — mig 145
- `merchants.gift_card_expiry_months SMALLINT (1-24, défaut 3)` — segment 3/6/12 mois côté UI.
- `computeGiftCardExpiry(paidAt, months)` propagé.
- Vitrine `GiftCardModal` reçoit `expiryMonths` en prop pour i18n dynamique de `validityNote`.
- Mig 145 drop aussi `merchants.gift_card_image_url` + policy bucket (image custom abandonnée).

### Cron `gift-cards-expire` — refonte 2-passes
- Passe 1 (existante) : `pending_payment > 3j` → `cancelled`.
- Passe 2 **NEW** : `active` dont `expires_at` échue → `expired` + `DELETE` du voucher dans `vouchers` (le bon disparaît de la carte fidélité).

### Cron `gift-cards-deliver`
- Batches de 8 en parallèle (`Promise.allSettled`) — 200 bons en ~12s vs ~100s (>maxDuration 60s).
- Type fort sur le row (plus de `as any`).

### confirm-payment
- Wrappé dans `after()` Next 15 → side effects survivent au return Vercel.
- Single render call (`renderAndUploadGiftCardAssets`) au lieu de 2.

### Email destinataire
- Image PNG du bon embarquée en haut (au lieu du gros carré gradient violet/rose).
- **Boutons côte-à-côte** table-based (`Row`+`Column` react-email) pour Outlook-safe :
  - **Réserver** (primary) → vitrine `/p/slug`
  - **Mon bon** (cream + brun + border) → carte fidélité `/customer/card/{merchantId}`
  - Si pas `auto_booking_enabled` → un seul bouton "Ouvrir mon bon" full width
- Sign-off harmonisé style email offreur : "Profite bien de ton moment / **L'équipe Qarte 💜**" (highlight `#4b0082` font-weight 600).

### Email offreur (`GiftCardActivatedEmail`)
- Mêmes PNG du bon embarqué en preview (au-dessus du PDF box).
- Bouton "Télécharger le PDF imprimable" (renommé pour bien différencier image vs PDF).
- Section verte "✨ Bon envoyé à X · 30€" supprimée (redondante avec image).

### SMS — fix € symbol (GSM-7)
- Nouveau `formatCurrencyForSms(amount, country)` dans `src/lib/utils.ts` → "50 EUR" / "50 CHF" / "50 GBP".
- Appliqué dans `confirm-payment`, `consume`, `vouchers/use`, `cron/gift-cards-deliver`.
- Les emails gardent `formatCurrency` original avec "50 €" propre.

### Dashboard `/dashboard/gift-cards`
- Toggle principal en haut (`ProgramToggleCard` standalone) — déverrouille tout.
- **2 onglets** : Paramètres / Suivi (DesignTab supprimé V1).
- Suivi badge rouge si `pending_payment > 0`.
- Settings réordonnés : paiement → montants → services → validité → message.
- Boutons amounts redessinés (white border, hover rose subtle, × discret).
- API settings PATCH partial : ne touche aux fields que si fournis (anti-écrasement après mig 145).
- DesignTab + GiftCardPreview + ColorChip components SUPPRIMÉS.
- Backend image upload supprimé (`/api/merchants/me/gift-card-image` route deleted, mig 145 drop col).
- `/api/gift-cards/preview` GARDÉ pour future réintégration (pas appelé actuellement).

### Helpers extraits (DRY)
- `formatLongDate(date, locale)` dans `src/lib/utils.ts` — remplace 4× `toLocaleDateString`.
- `resolveGiftCardServiceNames()` dans `src/lib/gift-cards.ts` — centralise lookup LIVE+snapshot.
- `renderAndUploadGiftCardAssets()` dans `src/lib/gift-card-pdf.ts` — 1 appel pour PDF+PNG.

## Migrations à appliquer (Supabase SQL Editor)
1. **143** — `gift_cards.image_url` + bucket extension PNG (idempotent, déjà appliquée chez user).
2. **144** — `merchants.gift_card_image_url` (sera dropped par 145, mais col créée puis bucket merchant-uploads). **Probablement appliquée.**
3. **145** — `merchants.gift_card_expiry_months SMALLINT NOT NULL DEFAULT 3 CHECK 1-24`, drop `merchants.gift_card_image_url`, drop policy bucket. **À APPLIQUER.** Postgres bloque le DELETE FROM storage.objects/buckets, le bucket `merchant-uploads` doit être supprimé manuellement via dashboard Supabase Storage si on veut nettoyer.

## TODO post-compaction
1. **Appliquer mig 145** dans Supabase SQL Editor.
2. **User a explicitement demandé** : adopter le sign-off offreur ("Profite bien... / L'équipe Qarte 💜" highlight purple) sur **TOUS les autres emails** du projet (pas juste GiftCardReceivedEmail). Audit à faire dans `src/emails/*.tsx`.
3. Push (4 commits ahead of main, aucun push depuis longtemps).

## Données test
- Merchant test : Elodie Nails (`id=764509ad-8e5b-4cef-b61c-f9bbea832fc0`)
  - `phone = 33618546792` (perso, NE PAS afficher)
  - `display_phone = 33511223344` (vitrine, AFFICHÉ → "05 11 22 33 44")
  - `slug = admin`, `auto_booking_enabled = true`
- Bon test : `GIFT-E6TW8V` (`id=582bb2af-18bb-41b7-9260-40a591dc848a`, status=active, kind=amount, 30€)
- Script test : `npx tsx scripts/send-test-gift-card.ts GIFT-E6TW8V judicaeltraore01@gmail.com [--both]` (par défaut 1 mail destinataire seul, `--both` pour offreur aussi).

## Stack tech rappel
- Next.js 15.5.12 + React 18 + Supabase + Resend
- `serverExternalPackages: ['@resvg/resvg-js', 'satori', 'pdf-lib']` dans next.config.mjs (binaires natifs)
- `after()` from `next/server` (Next 15) pour fire-and-forget Vercel
- `@react-email/components` pour email rendering, `Row` + `Column` pour layouts table-based Outlook-safe
- `displayPhoneNumber` from `src/lib/utils.ts` pour formatter les phones (FR/BE/CH)

## Bugs/edge cases connus
- Si user lance le test script sans `--both`, seul email destinataire envoyé (pas offreur). C'est volontaire pour itérer rapidement.
- Bon test E6TW8V a `expires_at` figé au moment de sa première confirmation → ne reflète pas les changements de `merchant.gift_card_expiry_months` ultérieurs (volontaire, on ne raccourcit pas un bon déjà payé).
- Bucket `merchant-uploads` reste orphelin en DB après mig 145 (Postgres bloque le DELETE direct, dashboard Supabase requis).
