# Handoff — Bons cadeaux Qarte

> Doc pour reprendre après compaction. Tout ce qui a été fait, ce qui reste, où trouver les choses.

## État du commit

**Commit en cours** : `7f3891ed` "feat(gift-cards): bons cadeaux end-to-end (vitrine, dashboard, SMS, emails)"
**Branche** : `main`
**Status** : commit fait localement, **NON pushé** (en attente validation merchant)
**Build** : `npx tsc --noEmit` passe clean
**Dev server** : peut tourner sur localhost:3000

## Ce qui a été livré

Système complet de bons cadeaux end-to-end. Pas de paiement intégré (Qarte = 0% commission), l'offreur paie le merchant via lien externe (Revolut/PayPal/Stripe configuré dans Planning > Réservation en ligne).

### Flow complet

1. Visiteur sur `/p/[slug]` → clique section bon cadeau (gradient merchant) → modal 4 étapes (montant > destinataire prénom+tel+email optionnel > offreur prénom+tel+email obligatoire+mot perso > récap avec preview Apple Wallet)
2. Submit → `POST /api/gift-cards/request` → status `pending_payment` + emails (offreur avec lien paiement + référence GIFT-XXXXXX, merchant notification) + push merchant
3. Offreur paie hors-Qarte avec référence en commentaire
4. Merchant ouvre `/dashboard/gift-cards` (widget urgent sur accueil si pending) → onglet À valider → "Marquer payé" → confirm inline (bandeau ambre clic-clic)
5. Cascade backend : crée customer destinataire + loyalty_card + voucher (`source='gift'`, expires 12 mois) + status `active` + SMS destinataire `gift_card_received` + email destinataire optionnel + email confirmation offreur
6. Destinataire arrive en salon → merchant consomme voucher via flow standard (CustomerManagementModal > Récompenses)
7. `/api/vouchers/use` détecte `source='gift'` → lookup gift_card via voucher_id → status `used` + SMS systématique offreur `gift_card_used`
8. Cron horaire `/api/cron/gift-cards-expire` auto-cancel les `pending_payment > 3 jours`

### Décisions validées par le merchant
- Expiration : **12 mois** après paid_at
- SMS offreur quand consommé : **systématique** (pas de toggle)
- Email destinataire : **optionnel** (SMS suffit)
- Auto-cancel pending_payment : **3 jours**
- Toggle activation : **uniquement dans /dashboard/gift-cards** (retiré de Programme/Fidélité)
- Container : **max-w-6xl** (= referrals/customers, "plus de largeur")
- Couleur accent : **rose/pink** (cohérent DESIGN.md fidélité, le bon crée une carte fidélité)

## Architecture fichiers

### Migrations DB
- `supabase/migrations/138_gift_cards.sql` — table `gift_cards` + 3 colonnes `merchants` (gift_card_enabled, gift_card_amounts JSONB, gift_card_message) + extend `vouchers.source` CHECK avec 'gift'
- `supabase/migrations/139_sms_gift_card_types.sql` — étend `sms_logs.sms_type` CHECK avec gift_card_received + gift_card_used (+ tous les autres existants conservés)

**À appliquer manuellement** dans Supabase SQL Editor avant tests prod.

### Lib
- `src/lib/gift-cards.ts` — helpers : `generateGiftCardCode()` (GIFT-XXXXXX, retry 5×), `computeGiftCardExpiry()` (12 mois), `parseGiftCardAmounts()`, `merchantHasPaymentLink()`, constantes `GIFT_CARD_*`
- `src/lib/sms.ts` — étendu : `SmsType` += gift_card_received/used, templates FR/EN, branche switch dans `sendBookingSms`, params `giftSenderName`/`giftRecipientName`/`giftAmount`
- `src/lib/email.ts` — 4 helpers `sendGiftCard*Email`

### Types
- `src/types/index.ts` — `GiftCard`, `GiftCardStatus`, `GiftCardCancellationReason` + extend `Voucher.source` avec `'gift'` + 3 fields sur `Merchant`

### API routes (1 endpoint = 1 fichier, choix du merchant pour la maintenance)
- `POST /api/gift-cards/request` — public vitrine, rate-limit 3/h IP, banned check sender+recipient, génère code, insert pending_payment, fire-and-forget emails+push merchant
- `GET /api/gift-cards?merchantId=&status=` — merchant auth, retourne liste + counts par status
- `POST /api/gift-cards/[id]/confirm-payment` — merchant valide : crée customer+card+voucher, fire-and-forget SMS+emails, atomic update status='active'
- `POST /api/gift-cards/[id]/cancel` — merchant annule pending uniquement
- `PATCH /api/gift-cards/settings` — merchant met à jour gift_card_enabled/amounts/message + revalide ISR vitrine
- `GET /api/cron/gift-cards-expire` — cron horaire, auto-cancel pending_payment > 3j (vercel.json `0 * * * *`)
- `src/app/api/vouchers/use/route.ts` — étendu avec hook fire-and-forget : si voucher.source='gift', lookup gift_card via voucher_id, update status='used', SMS offreur

### Emails React Email (4 templates dans src/emails/)
- `GiftCardOrderConfirmationEmail` — offreur après commande (gradient violet→rose, code GIFT en gros, liens paiement merchant détectés via `detectPaymentProvider`, 3 étapes "What happens next")
- `GiftCardActivatedEmail` — offreur quand merchant valide (gradient vert success, "ton cadeau est parti")
- `GiftCardReceivedEmail` — destinataire (gradient `${primaryColor}→${secondaryColor}` du merchant, mot perso encadré violet, CTA carte fidélité)
- `GiftCardMerchantNotificationEmail` — merchant à la commande (détails offreur+destinataire, référence à attendre, action 1-2-3)
- Tous exportés depuis `src/emails/index.ts`, helpers dans `src/lib/email.ts`

### UI Dashboard
- `src/app/[locale]/dashboard/gift-cards/page.tsx` — page complète :
  - Container `max-w-6xl mx-auto`
  - H1 canonical `text-lg md:text-2xl font-bold tracking-tight text-slate-900` avec icône `Gift w-5 h-5 text-rose-500` inline
  - **SettingsPanel** (en haut) : `bg-white rounded-2xl shadow-sm border border-gray-100 p-6` avec toggle ON/OFF + description. Si activé, config inline auto-affichée (montants chips éditables rose-50/200, textarea mot intro, bouton Save quand dirty). PAS de chevron collapse (retiré, c'était confus).
  - Si pas activé : composant `DisabledPitch` qui montre "Comment ça marche" 1-2-3 avec bullets numérotés rose
  - Si activé : 4 tabs (À valider/Actifs/Consommés/Annulés) pattern marketing flex-1 bg-slate-900 actif, badges rouge si pending_payment > 0
  - Liste `GiftCardRow` : `bg-white border border-slate-100 rounded-xl shadow-sm p-4 md:p-5` avec montant + code + flèche sender→recipient + 2 colonnes contact + mot perso violet + dates chips + actions inline
  - **Confirm/Cancel inline** (PAS de modal) : pattern garde-fou clic-clic. Clic Marquer payé → bandeau ambre `AlertTriangle` + 2 boutons "Pas encore"/"Oui, j'ai reçu". Clic Annuler → bandeau rose + boutons. State machine `mode: 'view' | 'confirming' | 'cancelling'`.
  - StatusPill, ContactBlock, DateChip, EmptyState comme sub-composants

- `src/components/dashboard/PendingGiftCardsWidget.tsx` — widget urgent dashboard accueil (gradient rose-fuchsia-violet, count, lien `/dashboard/gift-cards`). Visible uniquement si `gift_card_enabled` ET count > 0.
  - Monté dans `src/app/[locale]/dashboard/page.tsx` après `AttendanceCheckPrompt`

- `src/app/[locale]/dashboard/_nav/nav-config.ts` — entrée NAV_ITEMS `/dashboard/gift-cards` icône Gift fuchsia (Plus mobile)
- `src/app/[locale]/dashboard/layout.tsx` — entrée navItems sidebar desktop juste avant Marketing/Notifications. **Programme passe sur icône `Heart`** (pour libérer Gift pour gift-cards, plus cohérent avec le label "Fidélité").

### UI Vitrine
- `src/app/[locale]/p/[slug]/GiftCardModal.tsx` — modal 4 étapes (montant > destinataire > offreur > récap), preview gradient merchant style Apple Wallet, écran succès avec instructions paiement (3 étapes ambrées). Reset état à chaque ouverture. Validation Zod côté serveur uniquement (front fait juste les contrôles min). Mode démo : passe direct au succès sans appel API.
- Section déclenchant la modal dans `src/app/[locale]/p/[slug]/ProgrammeView.tsx` (juste avant le label "Carte fidélité simulée") : button gradient merchant avec icône Gift watermark + "Dès XX€" calculé via `Math.min(...amounts)`. Gated sur `merchant.gift_card_enabled && !isSuspended`.
- `src/app/[locale]/p/[slug]/page.tsx` — select étendu avec gift_card_enabled, gift_card_amounts, gift_card_message

### i18n
- `messages/fr.json` + `messages/en.json` : ~110 clés sous `giftCards.*` (toggleTitle, amountsLabel, recipientFirstName, etc.)
- Ajout `dashNav.giftCards` ("Bons cadeaux" / "Gift cards")

### Docs
- `docs/context.md` — section dédiée "Bons cadeaux (mig 138-139)" insérée avant "Clients fideles"
- `docs/supabase-context.md` — section "2.47 gift_cards" + lignes mig 138-139 dans le tableau migrations

## Patterns design utilisés (validés par impeccable)

DESIGN.md → page conforme :
- Couleur accent : **rose-500** (= fidélité dans DESIGN.md, cohérent car le bon cadeau crée une carte fidélité)
- H1 : `text-lg md:text-2xl font-bold tracking-tight text-slate-900`
- Section card : `bg-white rounded-2xl shadow-sm border border-gray-100 p-6` (= referrals)
- List item card : `bg-white border border-slate-100 rounded-xl shadow-sm p-4 md:p-5`
- Tabs : pattern marketing `flex-1 bg-slate-900` actif

Bans impeccable respectés :
- ❌ Side-stripe `border-l-Xpx` → retiré, status par pill seule
- ❌ Glassmorphism gratuit (`bg-white/60`) → solid `bg-white`
- ❌ Modal as first thought → confirm inline pattern garde-fou clic-clic
- ❌ Em dashes → virgules/points
- ❌ Identical card grids → liste verticale hauteur variable

Mobile-first :
- Tap targets ≥44px (`py-2.5` = 44px)
- `flex-col-reverse sm:flex-row` (CTA primaire en haut sur mobile)
- `truncate` sur emails longs
- `touch-manipulation` partout
- Tabs `flex-1 min-w-0` (pas de scroll horizontal jusqu'à 360px)

## Ce qui reste / à tester

### À faire avant push
- [ ] Appliquer migrations 138 + 139 dans Supabase SQL Editor (DB locale + prod)
- [ ] Setup `OPENROUTESERVICE_API_KEY` non requis ici (rien à voir avec gift cards)
- [ ] Tester end-to-end depuis la vitrine (commander un bon, valider paiement, consommer, vérifier les 2 SMS et 4 emails)
- [ ] Vérifier responsive mobile sur les 3 surfaces (modal vitrine, page dashboard, widget accueil)

### Améliorations futures envisagées (pas critiques v1)
- Stats agrégées en haut de la page (CA bons cadeaux ce mois, count actifs, etc.) — pas demandé par le merchant
- Filtre par recherche nom/code/téléphone dans la liste — utile si volume > 50 bons
- Export CSV
- Bouton "Renvoyer le SMS au destinataire" sur les bons actifs (cas d'usage : la cliente a perdu son SMS)
- Notification push merchant quand un bon est consommé (actuellement pas de signal côté merchant que la cliente a utilisé son bon)
- Limit display sender_message quand long (currently no truncate)

### Edge cases connus
- Si l'offreur saisit un email invalide, l'inscription échoue côté Zod (400) avant insert — UX OK
- Si le destinataire est un client existant chez le merchant, le `confirm-payment` réutilise sa loyalty_card existante (pas de doublon)
- Si 2 merchants ont le même destinataire (cross-salon), chacun aura sa propre customer + carte (RLS scope par merchant_id)
- Race condition : double-clic Marquer payé → atomic update `eq('status', 'pending_payment')` rejette le 2e
- Si `recipient_email` non fourni → SMS uniquement, pas d'email destinataire envoyé (silent skip)

### Anti-spam et limites
- Rate limit `/api/gift-cards/request` : 3 par heure par IP (déclenche email + push merchant donc strict)
- Banned numbers : check sender + recipient sur table `banned_numbers` du merchant
- Trial expired → 403 pour cohérence avec autres routes client-facing
- gift_card_enabled = false → 403 (gate côté serveur)
- Pas de moyen de paiement configuré → 503 (le merchant doit configurer Revolut/PayPal/Stripe d'abord)

## Commandes utiles

```bash
# Type check
npx tsc --noEmit

# Dev server
npm run dev    # localhost:3000

# Lint
npm run lint

# Tests
npm test

# Voir le commit
git log --oneline -3

# Diff du commit gift-cards
git show 7f3891ed --stat

# Push (UNIQUEMENT après validation explicite merchant)
git push origin main
```

## Conventions à respecter (rappel CLAUDE.md)

- NEVER push sans approbation explicite
- Tutoiement merchant, vouvoiement client
- Pas d'emojis dans le code (sauf SMS, là c'est OK)
- Hooks AVANT tout early return
- E.164 sans + pour téléphones (33612345678)
- Migrations appliquées MANUELLEMENT par le merchant dans Supabase SQL Editor
- Visit dates : `visited_at` (jamais `created_at`)
- `Number(value || 0)` pour fields cagnotte/montants nullable
- Imports Link/router : `@/i18n/navigation` pas `next/navigation`
- Icônes : lucide-react uniquement
- Couleur primary : rose pour gift-cards, indigo pour planning, etc. (DESIGN.md)
