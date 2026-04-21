# Refonte navigation mobile — sidebar → bottom tab bar

**Date** : 2026-04-21
**Contexte** : la sidebar mobile (hamburger + drawer) pose des problèmes de fige iOS PWA et n'est pas le pattern standard des apps mobiles. Les merchants passent la majorité du temps sur mobile → besoin d'une nav native-like.

---

## État actuel

**10 entrées de menu** dans [layout.tsx:86-97](src/app/[locale]/dashboard/layout.tsx#L86-L97) :

| # | Route | Label (FR) | Fréquence d'usage (estimée) |
|---|---|---|---|
| 1 | `/dashboard` | Accueil | ⭐⭐⭐⭐⭐ quotidien |
| 2 | `/dashboard/program` | Programme fidélité | ⭐⭐ setup puis rare |
| 3 | `/dashboard/public-page` | Ma page | ⭐⭐ setup puis rare |
| 4 | `/dashboard/qr-download` | QR code | ⭐⭐ setup puis rare |
| 5 | `/dashboard/planning` | Planning | ⭐⭐⭐⭐⭐ quotidien si enabled |
| 6 | `/dashboard/customers` | Clientes | ⭐⭐⭐⭐ fréquent |
| 7 | `/dashboard/referrals` | Parrainage | ⭐⭐ rare |
| 8 | `/dashboard/marketing` | Notifications | ⭐⭐⭐ hebdomadaire |
| 9 | `/dashboard/subscription` | Abonnement | ⭐ très rare |
| 10 | `/dashboard/settings` | Paramètres | ⭐ très rare |

10 tabs, c'est trop pour un bottom nav (standard iOS/Android = 3 à 5, max 5 visibles).

---

## Contraintes à respecter

1. **iOS safe area** : bottom nav doit respecter `env(safe-area-inset-bottom)` (home indicator)
2. **PWA standalone** : bottom nav doit rester visible même en mode standalone (pas caché par barre Safari)
3. **Clavier mobile** : quand clavier s'ouvre (focus input), le bottom nav ne doit pas remonter au milieu de l'écran → `position: fixed` + gestion `visualViewport`
4. **Plan locked** : certaines routes sont verrouillées selon le plan (ex: planning nécessite fidelity+ tier). Besoin de l'affichage du cadenas.
5. **Banners existants** : 4 types de banners (trial, grace, canceling, past_due) actuellement dans la sidebar. Où les afficher sur mobile sans sidebar ?
6. **NotificationBell** : actuellement en top-right mobile — garder ou déplacer ?
7. **Logo + nom shop + logout** : actuellement en bas de sidebar. Déplacer vers `/dashboard/settings` ?
8. **Badge "CŒUR" / "PRO"** : badge tier actuellement visible dans sidebar. Déplacer vers Settings.
9. **AdminAnnouncementBanner** : visible dans sidebar desktop — garder en banner mobile au-dessus du contenu (existe déjà)
10. **WhatsApp help button** : actuellement en bas de sidebar — déplacer vers Settings ou modal flottant
11. **iOS PWA** : éviter `position: fixed` + `backdrop-blur` simultanés (provoque des freezes sur certains iOS). Préférer `background-color` solide.

---

## Options envisagées

### Option A — 5 tabs fixes + "Plus" pour le reste (pattern Instagram/TikTok) ✅ **RECOMMANDÉ**

**Tabs visibles en permanence (5)** :
1. 🏠 Accueil (`/dashboard`)
2. 📅 Planning (`/dashboard/planning`)
3. 👥 Clientes (`/dashboard/customers`)
4. 📣 Notifs (`/dashboard/marketing`) — badge si campagnes en attente
5. ⚙️ Plus (bottom sheet)

**Dans "Plus" (bottom sheet)** :
- Programme fidélité
- Ma page
- QR code
- Parrainage
- Abonnement
- Paramètres
- Aide WhatsApp
- Déconnexion

**Avantages** :
- Pattern familier (Instagram, TikTok, Spotify, Revolut)
- 4 tabs quotidiens directement accessibles
- Sheet "Plus" natif iOS (drag to dismiss, safe area propre)

**Inconvénients** :
- "Plus" cache les items → moins découvrables pour nouveaux merchants
- Setup onboarding (program/public-page/qr) enfoui dès l'arrivée → risque que les nouveaux merchants oublient

**Mitigation setup** : bannière dynamique "Tu n'as pas encore configuré X" sur l'accueil (déjà présent partiellement via `previewDone` check).

---

### Option B — 4 tabs + FAB central (pattern Strava / Uber)

**Tabs (4)** :
1. Accueil
2. Planning
3. **FAB central** : "+" → action primaire (créer résa, ajouter cliente)
4. Clientes
5. Plus

**Avantages** : met en avant une action primaire (résa manuelle)

**Inconvénients** : on a plusieurs actions primaires selon le contexte (résa, cliente, campagne). FAB statique = pas adapté.

**Verdict** : écartée, complexité sans gain clair.

---

### Option C — Bottom nav "adaptatif" selon la page

**Principe** : les tabs changent selon la section (ex: sur planning, tabs = "Jour / Semaine / Résas / Paramètres")

**Avantages** : contextuel

**Inconvénients** : déroutant pour l'utilisateur (perd ses repères), anti-pattern mobile. Écartée.

---

## Plan détaillé — Option A

### Phase 1 — Refactor structure (pas de changement visuel)

1. **Extraire le navItems actuel** de [layout.tsx](src/app/[locale]/dashboard/layout.tsx) vers `src/app/[locale]/dashboard/_nav/nav-config.ts`
   - Typer chaque item : `{ href, icon, label, color, bg, primary: boolean, locked?: boolean }`
   - `primary: true` = affiché dans bottom nav mobile (5 items)
   - `primary: false` = enfoui dans le sheet "Plus"

2. **Créer `src/app/[locale]/dashboard/_nav/BottomNav.tsx`**
   - Component client, lg:hidden
   - 5 tabs (4 routes + bouton "Plus")
   - Active state basé sur `pathname`
   - `position: fixed; bottom: 0` + `padding-bottom: env(safe-area-inset-bottom)`
   - Background blanc opaque (pas de backdrop-blur pour éviter freeze iOS)
   - Height ~56px + safe area
   - Icons Lucide + label court en dessous (text-[10px])

3. **Créer `src/app/[locale]/dashboard/_nav/MoreSheet.tsx`**
   - Bottom sheet plein écran mobile
   - Animation slide-up via Framer Motion (mode="wait", pointerEvents exit)
   - Liste des items "Plus" (Programme, Ma page, QR, Parrainage, Abonnement, Paramètres, Aide, Déconnexion)
   - Drag handle en haut
   - Tap backdrop pour fermer
   - **Inclut le badge tier + nom shop + logo** en header du sheet (remplace le footer sidebar)

4. **Garder la sidebar desktop identique** (lg:block) — aucun changement pour >= 1024px

### Phase 2 — Gestion des banners et notifications

1. **Trial / Grace / Canceling / Past_due banners** :
   - Sur mobile sans sidebar, afficher en top banner sticky sous le header
   - Ou : dans l'accueil et sur la page subscription uniquement (pas partout)
   - **Recommandation** : sticky banner top, compact (1 ligne + CTA), dismissable uniquement pour "canceling" (les autres urgents restent visibles)

2. **NotificationBell** :
   - Déplacer dans le bottom nav sur le tab "Notifs" (avec badge count)
   - OU garder top-right — simple, visible, pas de régression UX
   - **Recommandation** : garder top-right (cohérence desktop)

3. **AdminAnnouncementBanner** : existe déjà en mode banner mobile, laisser tel quel

### Phase 3 — Settings refactor

1. **Déplacer depuis sidebar footer vers `/dashboard/settings`** :
   - Logo + nom shop (header de Settings)
   - Badge tier CŒUR/PRO
   - Bouton WhatsApp help → section "Support"
   - Bouton Déconnexion → section "Compte" (en bas, style destructif)

2. **Settings devient le "compte + paramètres"** complet (pattern iOS Reglages)

### Phase 4 — Gestion du keyboard (iOS)

1. Utiliser `window.visualViewport` pour détecter ouverture clavier
2. Masquer temporairement le bottom nav quand clavier ouvert (évite qu'il flotte au milieu de l'écran)
3. Hook `useVirtualKeyboardVisible()` réutilisable

### Phase 5 — Tests et migration

1. Tests iPhone réel (standalone + Safari)
2. Vérifier chaque route loading sans la sidebar (padding-bottom du main content doit tenir compte du bottom nav : ~60-70px + safe area)
3. Vérifier que les modals plein écran (PlanningModal, etc.) cachent le bottom nav (z-index + pointer-events)
4. Tester les transitions entre onglets sans flicker

---

## Layout mobile final

```
┌─────────────────────────────────┐ ← status bar
│  [AdminBanner (si actif)]       │
│  [Trial/Grace Banner]       [🔔]│ ← top compact, bell ici
├─────────────────────────────────┤
│                                 │
│                                 │
│         Contenu page            │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│ 🏠   📅   👥   📣   ⋯           │ ← bottom nav (5 tabs)
│ Home Plan Cli  Notif Plus       │
└─────────────────────────────────┘ ← safe area iOS
```

---

## Fichiers impactés (estimation)

| Fichier | Action | Effort |
|---|---|---|
| `src/app/[locale]/dashboard/layout.tsx` | Modifier — extraire nav + conditionner sidebar/bottom | Moyen |
| `src/app/[locale]/dashboard/_nav/nav-config.ts` | Nouveau | Faible |
| `src/app/[locale]/dashboard/_nav/BottomNav.tsx` | Nouveau | Moyen |
| `src/app/[locale]/dashboard/_nav/MoreSheet.tsx` | Nouveau | Moyen |
| `src/app/[locale]/dashboard/_nav/MobileHeader.tsx` | Nouveau (bell + banner top) | Faible |
| `src/app/[locale]/dashboard/settings/page.tsx` | Modifier — accueillir logout/whatsapp/logo | Moyen |
| `src/hooks/useVirtualKeyboardVisible.ts` | Nouveau | Faible |
| `messages/fr.json` / `en.json` | Ajouter labels courts pour bottom nav (`navShort.home`, etc.) | Faible |
| CSS tokens safe-area | Vérifier `pb-[env(safe-area-inset-bottom)]` appliqué au main + nav | Faible |

**Estimation** : 1.5 à 2 journées (développement + tests iOS réels).

---

## Risques et mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Setup onboarding cachés dans "Plus" → nouveaux merchants perdus | Élevée | Bannière guidée sur Accueil + flow post-signup pousse activement vers setup |
| Bottom nav recouvert par clavier iOS | Élevée | Hook `useVirtualKeyboardVisible()` masque le nav |
| Conflit z-index avec modals plein écran | Moyenne | Modal z-50, nav z-40. Modal cache le nav visuellement. Tester avec `pointer-events` |
| Régression desktop (sidebar) | Faible | Phase 1 isole le refactor : sidebar inchangée >= 1024px |
| Trop de tap sur "Plus" (8 items enfouis) | Moyenne | Vérifier analytics après rollout. Si 2 items "Plus" sont très utilisés, les promouvoir dans les 5 tabs visibles |
| Badge tier + banners → surcharge visuelle top | Moyenne | Merger banners en un seul banner sticky adaptatif |
| iOS PWA standalone + `position: fixed` → jump au scroll | Moyenne | Tests iPhone réel. Fallback : transform3d ou `position: sticky` |

---

## Questions ouvertes à trancher avant code

1. **Nom des 5 tabs** : FR court (max 10 chars). Proposition :
   - `Accueil` / `Planning` / `Clientes` / `Notifs` / `Plus`
   - À valider / reformuler

2. **Badge notifs** : numérique (ex: "3") ou dot ? Actuellement le bell a "9+" max.
3. **"Plus" s'ouvre en full-screen sheet ou drawer latéral ?** Full-screen sheet est plus natif iOS. Drawer latéral aurait l'avantage de continuité avec l'actuel hamburger.
4. **Abonnement** dans "Plus" ou toujours accessible via les banners trial/past_due ? Les banners suffisent probablement.
5. **Bottom nav visible sur toutes les pages dashboard ou caché sur certaines pages ?**
   - Caché sur : `/dashboard/setup`, `/dashboard/personalize`, `/dashboard/survey` (déjà ignorés par le layout actuel)
   - Caché si `trialStatus.isInGracePeriod || isFullyExpired` ET pathname === `/dashboard/subscription` (cohérence avec le fix déjà appliqué pour la flèche retour + bell)

---

## Rollout proposé

1. **Phase 1-2** (refactor + banners) : merge sur main, test en staging d'abord
2. **Phase 3** (Settings refactor) : en parallèle
3. **Phase 4** (keyboard handling) : fait dès le début avec phase 1 (sinon bug évident au 1er test)
4. **Phase 5** (tests + polish) : 1 jour full sur iPhone réel
5. **Feature flag optionnel** : envelopper via env var ou user agent (ex: ne livrer d'abord qu'aux comptes test) — surcoût mais plus safe

**Commit atomique** suggéré : chaque composant dans son propre commit pour faciliter le rollback partiel si un fix casse l'UX mobile.

---

## Alternatives pragmatiques si refonte complète est trop lourde

### Option minimale — Garder sidebar + réorganiser

Si la refonte complète est trop ambitieuse :
- Garder la sidebar mobile MAIS améliorer l'ouverture (fix hamburger déjà en place dans commit `4453bd6`)
- Ajouter juste 3-4 raccourcis en bottom nav sticky (Home, Planning, Customers, Menu)
- Les autres items restent dans la sidebar via bouton "Menu"
- Moins ambitieux mais peut être livré en une demi-journée

**Recommandation finale** : aller sur Option A (refonte complète) parce que la sidebar mobile est un point de friction récurrent, pas juste esthétique. Les apps mobiles modernes (Instagram, Revolut, Qonto, Doctolib côté pro) utilisent toutes bottom nav — c'est ce que les merchants attendent.
