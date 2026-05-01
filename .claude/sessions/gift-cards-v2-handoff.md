# Handoff — Bons cadeaux v2 (post mode services)

> Doc pour reprendre après compaction. Récapitule TOUT ce qui a été ajouté
> au-delà du commit `7f3891ed` (v1 end-to-end) et `05c1cf43` (mode services).

## Commits

| SHA | Sujet |
|-----|------|
| `7f3891ed` | v1 — bons cadeaux end-to-end (vitrine, dashboard, SMS, emails) |
| `05c1cf43` | v2a — mode "offrir une prestation" + adapt SMS/emails |
| **À committer** | v2b — payment links dédiés + PDF + tracking + scheduling + consume + 3 mois |

Status : **prêt à committer + push après validation**, type check 0 erreur.

## Migrations DB à appliquer manuellement

- ✅ `140_gift_card_services.sql` — déjà appliquée
- ✅ `141_gift_card_payment_pdf.sql` — déjà appliquée (avec bloc storage bucket dans la version finale)
- ⚠️ **`142_gift_card_scheduling.sql` — À APPLIQUER** (sinon page de suivi 404 + cron deliver fail)

Toutes idempotentes.

## Ce qui a été livré (au-dessus du mode services)

### 1. Liens de paiement dédiés bons cadeaux (mig 141)
- 4 colonnes merchants : `gift_card_payment_link`, `_label`, `_2`, `_2_label`
- **Indépendants** des `deposit_link` Planning (pas de fallback). Si vide → 503 sur la vitrine.
- UI dashboard SettingsPanel : section "Liens de paiement bons cadeaux" avec 2 inputs URL + auto-detect provider (badge ✓ Revolut / PayPal / Stripe à droite)
- Label sauvegardé en DB = `detectPaymentProvider(url)` automatique
- **Même pattern dans Planning > Réservation en ligne** : 2 inputs URL + auto-detect, plus besoin du label manuel
- Helper `buildGiftCardPaymentLinks()` dans `src/lib/gift-cards.ts`
- Warning ambré inline sous les inputs si vides (au lieu d'être en haut de page)

### 2. Nom + prénom obligatoires (mig 141)
- Colonnes `gift_cards.sender_last_name`, `recipient_last_name` (CHECK 1-60 chars)
- Modal vitrine : 2 inputs prénom/nom en grid 2 colonnes pour offreur ET destinataire
- Validation email avec `validateEmail` + `suggestEmailCorrection` (pattern signup) — bloc avant passage à l'étape suivante, "Tu voulais dire X ?" avec bouton de correction
- 4 emails affichent nom complet partout (preview, body, sceau, etc.)
- Dashboard GiftCardRow affiche nom complet (sender → recipient)
- Customer.last_name rempli au confirm-payment

### 3. PDF A5 imprimable (mig 141)
- **Lib** : `@react-pdf/renderer` v4.5.1
- **Template** [src/pdf/GiftCardPDF.tsx](src/pdf/GiftCardPDF.tsx) — design papier cadeau ivoire + dashed border couleur merchant + Times-Roman pour montant/prestation + sceau "BON CADEAU" + code mono + footer code+validité
- **Helper** [src/lib/gift-card-pdf.ts](src/lib/gift-card-pdf.ts) : `renderAndUploadGiftCardPdf()` → render → upload bucket `gift-cards-pdf` → URL publique
- **Bucket Supabase Storage** créé par mig 141 (`storage.buckets` + RLS public read)
- **Trigger** dans `/api/gift-cards/[id]/confirm-payment` : génère PDF, stocke `pdf_url`
- **Lien PDF dans email offreur** uniquement (`GiftCardActivatedEmail`) — bloc orange "🎁 Bon cadeau imprimable" avec bouton CTA download
- Email destinataire : **pas** de PDF (déjà tout dans la carte fidélité — reco utilisateur)
- Resend `attachments` ajouté dans `sendEmail` factory (gardé même si maintenant on utilise lien plutôt qu'attachment)

### 4. Page de suivi publique (mig 141 — pas de schema, juste la page)
- URL : `/gift-cards/track/GIFT-XXXXXX` (sous `[locale]` pour next-intl)
- API : `GET /api/gift-cards/track/[code]` (rate-limit 60/h IP, expose champs publics uniquement)
- Page : lookup direct DB (pas de fetch HTTP pour éviter problème NEXT_PUBLIC_APP_URL en local)
- View : `GiftCardTrackView` aux couleurs merchant
  - Carte cadeau (montant ou prestations)
  - Status badge (pending/active/used/cancelled/expired)
  - Timeline 3-4 étapes (commande → paiement → [envoi planifié si scheduled] → utilisé)
  - Code référence
  - Bouton "Télécharger le PDF" si dispo
- Lien tracking ajouté dans email confirmation offreur (sous footnote)

### 5. Envoi planifié au destinataire (mig 142)
- Colonnes `gift_cards.scheduled_send_at` (TIMESTAMPTZ) + `notified_at`
- Index partial cron : `WHERE status='active' AND notified_at IS NULL AND scheduled_send_at IS NOT NULL`
- Modal vitrine : champ date dans étape sender (sous mot perso) — min=demain, max=+1an, hint *"Si tu veux que la personne reçoive son bon à une date précise (anniversaire, Noël…)"*. Conversion en datetime à 9h locale du jour choisi.
- API request accepte `scheduled_send_at` (ISO datetime)
- Confirm-payment : si scheduled futur → status='active' MAIS skip SMS+email destinataire (PDF + email offreur partent quand même immédiatement)
- Cron horaire `/api/cron/gift-cards-deliver` (vercel.json `5 * * * *`) :
  - Atomic claim sur `notified_at IS NULL` avant envoi (anti race multi-worker)
  - Envoie SMS + email destinataire à l'échéance
  - LIVE lookup services pour résilience
- Email offreur a 2 variantes selon scheduled :
  - Subject "Marie vient de recevoir ton bon" (immédiat) vs "Ton bon est programmé" (différé)
  - Bloc violet `scheduledBox` avec date "Envoi le 25 décembre 2025"
- Page suivi : étape timeline supplémentaire si scheduled

### 6. Bouton "Consommer" inline dans gift-cards page
- Endpoint `POST /api/gift-cards/[id]/consume` :
  - Auth merchant + ownership
  - Atomic update `gift_cards.status='active'` → `'used'` + `used_at`
  - Update `vouchers.is_used=true`
  - Trigger SMS systématique offreur (`gift_card_used`) avec label services si applicable
- UI : bouton violet "Consommer le bon" sur les rows actifs
  - Pattern garde-fou clic-clic (RowMode `'consuming'`)
  - Bandeau violet de confirmation : *"Confirme que [Marie] a utilisé son bon (50€ ou liste prestations). On envoie un SMS à l'offreur dans la foulée."*
- **Voucher gift retiré de la fiche cliente** (CustomerRewardsCombinedTab) — géré exclusivement depuis page gift-cards
- Lien "Ouvrir la fiche de Marie" retiré aussi (utilisateur n'en voulait pas)

### 7. Validité changée à 3 mois (était 12)
- `GIFT_CARD_EXPIRY_MONTHS = 3` dans `src/lib/gift-cards.ts`
- Mention discrète dans modal vitrine récap : *"Le bon est valable 3 mois à compter de la validation du paiement par le salon."*
- Bons existants non affectés (`expires_at` figé à création)

## Bug fixes inclus

- **API settings** ne sauvegardait PAS `gift_card_payment_link*` malgré schema accepting them → ajout updatePayload + `urlOrEmpty` Zod
- **Page de suivi** `/gift-cards/track/[code]` était hors `[locale]` → middleware next-intl ne la résolvait pas → déplacée sous `[locale]`
- **Page de suivi** faisait fetch sur `NEXT_PUBLIC_APP_URL` (prod) au lieu de lookup direct DB → réécrite en SSR direct
- **Modal vitrine shell** désaligné du BookingModal (header gradient + footer custom) → réécrit pour matcher : header blanc sticky + step indicator barres + AnimatePresence slide + sticky CTA in-step + max-w-md centré
- **Icône kind=services** : `Sparkles` → `Wand2` (plus différenciant)
- **Textes UI revus** : pas d'optionnel sur paymentLinks, pas de mention "fallback Planning", reformulation services hint pour clarifier "soit montant, soit prestation"
- **Carte preview "papier cadeau"** : design distinct du palier 2 (ivoire texturé + dashed primary + serif Georgia)
- **qarte.fr → getqarte.com** dans SMS templates (déjà dans v2a)

## Architecture fichiers nouveaux/modifiés (v2b)

### Migrations
- `141_gift_card_payment_pdf.sql` (créée+étendue)
- `142_gift_card_scheduling.sql` (créée)

### Lib
- `src/lib/gift-cards.ts` — helpers `merchantHasPaymentLink` (réécrit, plus de fallback deposit), `buildGiftCardPaymentLinks` (nouveau), `GIFT_CARD_EXPIRY_MONTHS = 3`
- `src/lib/gift-card-pdf.ts` (nouveau) — render+upload PDF
- `src/lib/email.ts` — étendu : `attachments` dans sendEmail factory + 4 helpers gift-card avec last_name + pdfUrl + scheduledSendAt

### Types
- `src/types/index.ts` — Merchant.gift_card_payment_link* (4 cols), GiftCard.sender_last_name + recipient_last_name + pdf_url + scheduled_send_at + notified_at, GiftCardKind, GiftCardServiceSnapshot

### API routes nouvelles
- `POST /api/gift-cards/[id]/consume` — merchant marque comme utilisé + SMS offreur
- `GET /api/gift-cards/track/[code]` — public, rate-limited 60/h IP
- `GET /api/cron/gift-cards-deliver` — cron horaire, envoie scheduled

### API routes modifiées
- `request` — accepte kind/service_ids/scheduled_send_at, snapshot services, payment links via helper
- `confirm-payment` — last_name au customer, generation PDF + storage, SMS+email destinataire conditionnel sur scheduled, lien PDF passed à email offreur
- `settings` — schema simplifié (urlOrEmpty), persiste payment_link* avec label auto-detect
- `vouchers/use` — passe servicesLabel au SMS gift_card_used (déjà v2a)

### UI Dashboard
- `src/app/[locale]/dashboard/gift-cards/page.tsx` — sous-toggle services + section payment links + bouton Consommer + retiré lien fiche cliente + warning inline ambré
- `src/app/[locale]/dashboard/planning/page.tsx` — DepositLinkInput component avec auto-detect

### UI Vitrine
- `src/app/[locale]/p/[slug]/GiftCardModal.tsx` — refonte complète shell BookingModal-like + étape kind + étape services + inputs nom + email validation + champ date + carte preview papier cadeau + recap adapté
- `src/app/[locale]/p/[slug]/ProgrammeView.tsx` — passe services + servicesEnabled au modal, retire "Dès XX€" (déjà v2a)

### UI Page suivi
- `src/app/[locale]/gift-cards/track/[code]/page.tsx` (nouveau, lookup direct DB)
- `src/app/[locale]/gift-cards/track/[code]/GiftCardTrackView.tsx` (nouveau, view client)

### Composants modifiés
- `src/components/dashboard/CustomerRewardsCombinedTab.tsx` — retire 'gift' du filtre vouchers (commentaire explicatif)

### PDF
- `src/pdf/GiftCardPDF.tsx` (nouveau) — template A5 papier cadeau

### Emails
- `GiftCardOrderConfirmationEmail` — preview + body + carte avec last_name + lien suivi en bas
- `GiftCardActivatedEmail` — last_name + bloc PDF orange + bloc scheduled violet + sujet adapté
- `GiftCardReceivedEmail` — last_name partout, plus de PDF attachment
- `GiftCardMerchantNotificationEmail` — nom complet partout

### i18n
- ~30 nouvelles clés dans giftCards : kindAmount/Services, headerSubtitle, recipient/senderLastName, didYouMean, programPaymentLinks*, scheduledSendAt*, validityNote, voucherLink (avec param name), consumeCta/Body/Confirm/Cancel, toastConsumed, etc.

### Config
- `vercel.json` — ajout cron `gift-cards-deliver` (`5 * * * *`)
- `package.json` — `@react-pdf/renderer ^4.5.1`

## Décisions importantes (souvenirs)

- **PDF**: lien dans email offreur (pas attachment) + pas de PDF du tout pour destinataire (redondant avec carte fidélité)
- **Scheduled**: PDF + email offreur partent immédiatement, SEULE la notification destinataire est différée
- **Payment links**: indépendants de Planning. Si merchant veut les mêmes → il copie/colle. Pas de fallback automatique
- **Auto-detect provider**: badge UI vert + label sauvegardé en DB côté serveur
- **Consume**: pattern garde-fou clic-clic violet. Voucher gift retiré de la fiche cliente
- **Validité 3 mois** (était 12)
- **Modal vitrine shell aligné BookingModal** (centré, header blanc, step bars, slide animations, sticky CTA in-step)
- **Icône kind=services**: `Wand2` (pas Sparkles)
- **Carte preview**: papier cadeau ivoire (différent du palier 2)

## Idées en attente (parking)

- ❌ **#4 URL shortener interne** : utilisateur a dit non
- 💡 Endpoint admin `/api/gift-cards/test-emails` pour preview rapide
- 💡 Bouton "Renvoyer SMS au destinataire" sur les bons actifs
- 💡 Notification push merchant quand bon consommé
- 💡 Stats agrégées (CA bons cadeaux ce mois)
- 💡 Filtre recherche / export CSV

## Reste à faire avant push

- [ ] **Appliquer migration 142** dans Supabase SQL Editor (sinon page suivi + cron + scheduling fail)
- [ ] Tester end-to-end avec un nouveau bon
- [ ] Push après validation merchant

## Conventions à respecter (rappel CLAUDE.md)

- NEVER push sans approbation
- Tutoiement merchant, vouvoiement client (sauf modal vitrine où on tutoie l'offreur — convention existante)
- Migrations appliquées MANUELLEMENT par le merchant
- E.164 sans + pour téléphones
- `Number(value || 0)` pour cagnotte/montants
- Imports Link/router : `@/i18n/navigation`
- Icônes : lucide-react
