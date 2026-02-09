# MAJ du 08/02/2026 - Refactoring des pages monolithiques

## Objectif
Refactorer les deux fichiers les plus volumineux du projet pour ameliorer la maintenabilite sans changer le comportement visible.

## Fichiers modifies

### customer/card/[merchantId]/page.tsx
- **Avant** : 2327 lignes
- **Apres refactoring** : 1514 lignes (-35%)
- **Apres nettoyages** : ~913 lignes (-61%) — suppression QR scanner, Safari Arrow, ajout smart install bar

### scan/[code]/page.tsx
- **Avant** : 1406 lignes
- **Apres** : 990 lignes (-30%)

## Composants extraits (src/components/loyalty/)

| Fichier | Role | Lignes |
|---------|------|--------|
| `HistorySection.tsx` | Historique visites/ajustements/remboursements (30 max) | ~240 |
| `ExclusiveOffer.tsx` | Carte d'offre exclusive depliable | ~122 |
| `MemberCardModal.tsx` | Modal carte membre VIP style credit card | ~134 |
| `InstallPrompts.tsx` | Smart install bar + modals PWA install (iOS/Android) + beforeinstallprompt | ~335 |
| `ReviewPrompt.tsx` | Prompt avis Google avec dismiss permanent | ~64 |
| `ScanSuccessStep.tsx` | Etape succes du scan (progression tiers, push) | ~423 |

## Hook partage (src/hooks/)

| Fichier | Role | Lignes |
|---------|------|--------|
| `usePushNotifications.ts` | Logique push notifications (detection iOS, subscribe, erreurs) | ~153 |

Ce hook remplace la logique push dupliquee dans les deux pages (~50 lignes chacune + handlers).

## Modifications supplementaires (session 2)

### Smart Install Bar (remplace Safari Arrow + ancien sticky banner)
- **Supprime** : overlay Safari Arrow plein ecran (z-40, mal positionne)
- **Supprime** : ancien sticky banner sans bouton dismiss, animations pulsantes infinies
- **Ajoute** : barre sticky `bottom-0` avec safe-area-inset pour iPhone
- **Ajoute** : bouton X dismiss (cooldown 7 jours via localStorage timestamp)
- **Ajoute** : support `beforeinstallprompt` Android (install natif comme app store)
- **Ajoute** : event listener `appinstalled` pour masquer la barre apres install
- **Timing** : apparition apres 3s (au lieu de 1.5s) — plus respectueux

### Autres changements
- `HistorySection.tsx` : limite affichage 10 -> 30 entrees
- `HeroSection.tsx` : texte genre-inclusif (client(e)s fidelise(e)s)
- Suppression QR scanner de la page carte (redondant avec camera native)
- `tsconfig.json` : exclusion du dossier backup `MAJ du 08:02` de la compilation

## Ce qui n'a PAS change
- Aucune modification d'API, de types, ou de base de donnees
- Les modals iOS instructions et iOS version warning sont identiques
- Push notifications : logique inchangee
- Les fichiers originaux sont dans le sous-dossier `originaux/`

## Contenu du dossier

```
MAJ du 08:02/
  context.md          <- ce fichier
  card-page.tsx       <- version intermediaire (post-refactoring, pre-nettoyages)
  scan-page.tsx       <- version modifiee de scan/[code]/page.tsx
  originaux/
    card-page.tsx     <- original (2327 lignes)
    scan-page.tsx     <- original (1406 lignes)
```

## Modifications supplementaires (session 3)

### Dashboard — Widget comparaison hebdomadaire
- **Supprime** : graphique recharts (LineChart 7 jours) + imports recharts
- **Ajoute** : widget comparaison semaine-sur-semaine (cette sem. vs precedente)
  - Big number visites + badge % evolution (vert/rouge)
  - Barres de comparaison visuelles
  - 2 requetes `count` en parallel (7j + 7-14j) au lieu d'un `select visited_at`
- **Fichier** : `src/app/dashboard/page.tsx`

### Priorite sticky recompense vs PWA install
- Reward sticky passe de `z-40` a `z-50` pour etre au-dessus de la barre PWA
- Barre PWA masquee quand la recompense est affichee (`showInstallBar && !isRewardSticky`)
- Variable `isRewardSticky` extraite pour eviter duplication
- **Fichier** : `src/app/customer/card/[merchantId]/page.tsx`

### Tier 2 dans Social Kit (page + email + API)
- Captions social-kit : variable `tier2Text` conditionnelle injectee dans les 3 textes
- Email SocialKitEmail : props tier2 + section palier 2 (violet) + textes conditionnels
- `sendSocialKitEmail()` : 3 nouveaux params (tier2Enabled, tier2StampsRequired, tier2RewardDescription)
- API social-kit route : select tier2 fields + passage a sendSocialKitEmail
- API test-emails : donnees tier2 de test
- **Fichiers** : `social-kit/page.tsx`, `SocialKitEmail.tsx`, `lib/email.ts`, `api/emails/social-kit/route.ts`, `api/test-emails/route.ts`

## Modifications supplementaires (session 4)

### Page Subscription — Audit design + corrections
- Toast z-index : `z-50` → `z-[60]` (au-dessus des elements sticky)
- Grille features : `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`, suppression `truncate`, ajout `shrink-0`
- Icones FAQ : `?` et `!` texte brut → `<HelpCircle>` et `<ShieldCheck>` (Lucide)
- Bouton retour : lien "Tableau de bord" avec `<ArrowLeft>` ajoute en haut
- CTA subscribe : bouton d'abonnement ajoute dans la colonne gauche sous le countdown
- Prix annuel : ajout prix barre `228 €` avant `190 €`
- Typo : "cet interface" → "cette interface"
- **Fichier** : `src/app/dashboard/subscription/page.tsx`

### Boutons retour — Couleur indigo/violet
- Remplacement gradient `from-slate-800 to-slate-900` (noir) par `from-indigo-600 to-violet-600` (indigo/violet)
- Shadow `shadow-slate-200` → `shadow-indigo-200`
- **Fichiers** : `src/app/dashboard/qr-download/page.tsx`, `src/app/dashboard/social-kit/page.tsx`

### Responsiveness dashboard (audit complet)
- Headings : ajout `text-2xl sm:text-3xl md:text-4xl` sur subscription, qr-download, social-kit, customers
- Tooltip Shield (dashboard) : `w-80` → `w-[calc(100vw-3rem)] sm:w-80`
- Palette couleurs (program) : `grid-cols-5` → `grid-cols-3 sm:grid-cols-5`
- Bottom CTAs (social-kit) : `flex` → `flex flex-col sm:flex-row`
- FAQ section (subscription) : `p-8` → `p-5 sm:p-8`, ajout `grid-cols-1`
- **Fichiers** : `page.tsx`, `customers/page.tsx`, `program/page.tsx`, `qr-download/page.tsx`, `social-kit/page.tsx`, `subscription/page.tsx`

## Commits recents

| Hash | Description |
|------|-------------|
| `ee35f58` | feat: dashboard weekly comparison, reward sticky priority, tier2 social kit |
| `f21a1b1` | fix: back buttons indigo/violet + responsive dashboard |

## Pour deployer
1. Verifier `npx tsc --noEmit` (0 erreurs attendues)
2. Tester navigation client : scan QR -> validation -> succes -> carte complete
3. Tester push notifications (iOS Safari standalone + Chrome Android)
4. Tester offre exclusive, historique, modal membre, prompt review
5. Tester smart install bar : apparition apres 3s, dismiss X, reapparition apres 7j
6. Tester install natif Android via beforeinstallprompt
7. Verifier safe-area sur iPhone (pas de chevauchement barre home)
8. Tester dashboard responsive : tooltip Shield, grille features, headings sur mobile
9. Tester page subscription : bouton retour, CTA subscribe, prix barre, FAQ icons
10. Tester social-kit + qr-download : boutons retour indigo/violet, bottom CTAs mobile

## Modifications supplementaires (session 5)

### Codes promo progressifs dans les emails
Strategie d'escalade promotionnelle pour maximiser la conversion post-trial :
- **J-1 trial (TrialEndingEmail)** : aucun coupon (conversion au prix normal, pas de cannibalisation)
- **J+1 trial expired (TrialExpiredEmail)** : `QARTE50` — 1 mois a 9€ (-10€)
- **J+14 reactivation (ReactivationEmail)** : `QARTEBOOST` — 2 mois a 9€
- **J+30 reactivation (ReactivationEmail)** : `QARTELAST` — 3 mois a 9€
- `allow_promotion_codes: true` deja actif dans Stripe checkout

### ReactivationEmail — Rewrite complet avec 3 niveaux d'urgence
- **J+7** : ton chaleureux, liste benefices, pas de promo
- **J+14** : win-back "on a une offre pour vous", stats clients, code QARTEBOOST
- **J+30** : banniere rouge "SUPPRESSION DANS 5 JOURS", titre rouge, stats rouges "clients perdus definitivement", code QARTELAST, bouton rouge "Sauver mon compte"

### Signatures email professionnalisees
- Remplacement de "Judicael, fondateur de Qarte" par "L'equipe Qarte" dans 4 templates :
  - `TrialExpiredEmail.tsx`
  - `InactiveMerchantDay30Email.tsx`
  - `IncompleteSignupReminder2Email.tsx`
  - `Day5CheckinEmail.tsx`

### Route test-emails enrichie
- 8 emails de test au total (+3 nouveaux : `trial_expired_promo`, `reactivation_promo_2months`, `reactivation_promo_3months`)

### Fichiers modifies (session 5)
| Fichier | Changement |
|---------|------------|
| `src/emails/TrialEndingEmail.tsx` | prop `promoCode` |
| `src/emails/TrialExpiredEmail.tsx` | prop `promoCode` + affichage promo + signature |
| `src/emails/ReactivationEmail.tsx` | rewrite complet avec 3 niveaux d'urgence |
| `src/emails/InactiveMerchantDay30Email.tsx` | signature |
| `src/emails/IncompleteSignupReminder2Email.tsx` | signature |
| `src/emails/Day5CheckinEmail.tsx` | signature |
| `src/lib/email.ts` | params `promoCode`/`promoMonths` dans 3 fonctions |
| `src/app/api/cron/morning/route.ts` | logique codes promo par timing |
| `src/app/api/test-emails/route.ts` | 3 nouveaux emails de test promo |
