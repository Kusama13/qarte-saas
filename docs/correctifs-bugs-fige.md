# Correctifs bugs de fige / clics impossibles — Dashboard mobile/PWA

**Date** : 2026-04-21
**Scope** : Dashboard merchant uniquement (desktop/tablette OK, bugs 100 % mobile iOS + PWA standalone)
**Statut** : P0 + P1 corrigés le 2026-04-21 (voir section "Correctifs appliqués" en fin de doc). Validation iPhone réel obligatoire.

## Symptômes remontés

1. **Raccourcis qui exigent 2-3 taps** avant de réagir
2. **Hamburger sidebar** qui ne s'ouvre pas au 1er tap
3. **Un merchant bloqué sur `/dashboard/program`** post-signup (reste figé après création compte)

Aucun de ces bugs n'a été reproduit sur desktop/tablette → pointe vers iOS PWA standalone + Safari Mobile.

---

## Méthode

3 agents exploratoires parallèles + vérification manuelle de chaque claim critique. J'ai écarté les faux positifs (ex : `useBodyScrollLock` accusé d'oublier son cleanup — c'est faux, le cleanup est appelé à chaque changement de dep).

Les bugs listés ci-dessous sont **vérifiés dans le code**, pas spéculatifs.

---

## P0 — Bugs critiques confirmés

### 1. Spinner infini sur `/dashboard/program` si `auth.getUser()` échoue

**Fichier** : [src/app/[locale]/dashboard/program/page.tsx:73-119](src/app/[locale]/dashboard/program/page.tsx#L73-L119)

**Preuve** :
```ts
const fetchMerchant = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.push('/auth/merchant');
    return;  // ← setLoading(false) JAMAIS appelé
  }
  const { data } = await supabase.from('merchants').select('*')...
  if (data) { setMerchant(data); setFormData(...); ... }
  setLoading(false);  // appelé seulement dans le happy path
};
```

**Cas cassant** : post-signup sur mobile/PWA, token pas encore propagé → `getUser()` retourne `user=null` → `router.push` déclenché mais spinner reste affiché (ligne 268-273, `if (loading) return <Loader2 />`).

Aggravant : pas de `try/catch` — si `getUser()` throw (rare), même résultat.

**Fix** :
```ts
const fetchMerchant = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/merchant'); return; }
    const { data } = await supabase.from('merchants').select('*')...;
    if (data) { setMerchant(data); setFormData(...); ... }
  } catch (e) {
    console.error('[program] fetchMerchant failed:', e);
  } finally {
    setLoading(false);
  }
};
```

**Mieux encore** : utiliser `useMerchant()` du contexte au lieu de refetch — le contexte a déjà try/catch/finally solide ([MerchantContext.tsx:47-104](src/contexts/MerchantContext.tsx#L47-L104)). Toutes les autres pages dashboard consomment le contexte, program est l'exception.

---

### 2. Conflit de scopes Service Worker (/ vs /dashboard)

**Fichiers** :
- [src/lib/push.ts:108](src/lib/push.ts#L108) → `scope: '/'`
- [src/hooks/useMerchantPushNotifications.ts:79](src/hooks/useMerchantPushNotifications.ts#L79) → `scope: '/dashboard'`
- [src/hooks/useInstallPrompt.ts:47](src/hooks/useInstallPrompt.ts#L47) → `scope: '/dashboard'`

**Preuve** : le même `/sw.js` est enregistré avec deux scopes différents selon le hook appelant. iOS PWA standalone réagit mal à deux registrations actives pour le même fichier SW — le navigateur finit avec un `controller=null` sur certaines pages, ce qui casse les handlers de click qui dépendent de la synchro SW.

**Symptôme** : user tape un bouton, l'event passe dans le vide car le SW contrôleur est en train de se réinstaller.

**Fix** : unifier sur `scope: '/'` partout. Les trois endroits doivent utiliser le même scope. Le manifest pro ([src/app/api/manifest/pro/route.ts:10](src/app/api/manifest/pro/route.ts#L10)) est à `scope: '/dashboard'` — aligner aussi (ou laisser, mais s'assurer qu'il n'y a qu'UNE seule registration SW active).

---

### 3. Autocomplete client `onMouseDown` au lieu de `onClick` (casse sur iOS touch)

**Fichier** : [src/app/[locale]/dashboard/planning/ClientSelectModal.tsx:208](src/app/[locale]/dashboard/planning/ClientSelectModal.tsx#L208)

**Preuve** :
```tsx
<input
  onBlur={() => setTimeout(() => onShowCustomerSearch(false), 200)}
/>
// ...
<button onMouseDown={() => onSelectCustomer(c)}>  // ← BUG iOS
```

Pattern "mousedown before blur" standard sur desktop. Sur iOS PWA standalone, `mousedown` est synthétisé **après** `touchend` et parfois après `blur` → le dropdown se ferme AVANT que le click ne s'enregistre. User doit taper 2 fois.

**Fix** : remplacer `onMouseDown` par `onPointerDown` (fiable iOS+desktop) OU passer à `onClick` + augmenter le timeout blur à 300ms.

```tsx
<button onPointerDown={() => onSelectCustomer(c)}>
```

---

### 4. AnimatePresence sans `mode="wait"` sur les modals planning

**Fichier** : [src/app/[locale]/dashboard/planning/page.tsx](src/app/[locale]/dashboard/planning/page.tsx) (multiples usages, ~10+)

**Preuve** : les modals planning (booking, block-slot, client-select, etc.) utilisent `<AnimatePresence>` sans `mode="wait"`. Quand on ferme modal A et ouvre modal B dans la foulée (ou qu'on rouvre le même), les deux backdrop `motion.div` (z-50) coexistent pendant l'animation exit (~300 ms) avec `opacity: 0` mais **sans `pointer-events: none`**. iOS PWA ignore l'opacity pour le hit testing dans certains cas et le backdrop invisible intercepte le tap.

**Fix** :
```tsx
<AnimatePresence mode="wait">
```

**Plus safe** : ajouter `pointer-events-none` explicite sur les backdrops en cours d'exit. Framer ne le fait pas automatiquement.

---

## P1 — Important

### 5. `userScalable: false` dans viewport

**Fichier** : [src/app/layout.tsx:22](src/app/layout.tsx#L22)

**Preuve** : `userScalable: false` désactive le double-tap zoom mais en iOS PWA standalone certains builds Safari retardent aussi la synthèse `click` depuis `touch` quand cette règle est active. Résultat : délai de ~300ms ressenti comme un "tap qui ne marche pas".

**Fix** : retirer `userScalable: false` (utiliser `maximumScale: 1` si on veut juste bloquer le zoom sur input focus) ET ajouter `touch-action: manipulation` sur tous les boutons critiques. Tailwind : classe `touch-manipulation`.

**Vérifier** : audit visuel des boutons dashboard qui n'ont PAS `touch-manipulation`. Le hamburger l'a déjà ([layout.tsx:161](src/app/[locale]/dashboard/layout.tsx#L161)), mais pas le bell sur mobile ni les items de nav.

---

### 6. NotificationBell : `router.push` + `setOpen(false)` synchrones sur tap

**Fichier** : [src/components/dashboard/NotificationBell.tsx:134-143](src/components/dashboard/NotificationBell.tsx#L134-L143)

**Preuve** :
```tsx
const handleClick = (notif: Notification) => {
  ...
  setOpen(false);
  if (notif.url) {
    if (notif.url.includes('?')) {
      window.location.href = `/${locale}${notif.url}`;
    } else {
      router.push(notif.url);  // ← react state pas flush avant nav iOS PWA
    }
  }
};
```

Sur iOS PWA, `router.push` Next.js peut déclencher la transition avant que `setOpen(false)` ait unmount le dropdown. User voit le dropdown pendant 100ms après, clique dessus (pensant qu'il est toujours ouvert) — le tap est consommé par la nav en cours.

**Fix** : soit tout passer en `<Link>` soit `await` un tick avant push :
```tsx
setOpen(false);
requestAnimationFrame(() => router.push(notif.url));
```

---

### 7. Cache merchant stale post-signup

**Fichier** : [src/contexts/MerchantContext.tsx:24-40](src/contexts/MerchantContext.tsx#L24-L40)

**Preuve** : `MerchantContext` initialise le state depuis `localStorage` (CACHE_DURATION = 5 min). Post-signup, la personalize page fait `window.location.href = '/dashboard/program'` (hard nav). À l'arrivée sur program, le contexte peut charger un cache avec un merchant pré-setup qui masque brièvement les bons écrans d'onboarding — pendant ce temps le fetch réel tourne.

**Pas un bug strict** mais une source de confusion de flow. À surveiller si le merchant "bloqué sur program" voyait un state incohérent.

**Fix optionnel** : bypasser le cache sur le 1er mount post-signup via un flag `?fresh=1` dans le `window.location.href` de personalize.

---

## P2 — Mineur (à vérifier runtime)

### 8. Installer plus de `touch-manipulation`

Les boutons de la sidebar (nav items), du bell, des toasts n'ont pas systématiquement `touch-manipulation`. Rajouter via Tailwind. Impact : fixe le délai 300ms iOS < 16.4.

### 9. InstallAppBanner z-40 sous modal z-50

Vérifier que le banner install cache bien `pointer-events` quand un modal est ouvert par-dessus. Peu fréquent en pratique mais possible.

---

## Faux positifs identifiés (ne pas toucher)

Ces claims des agents ont été **rejetés après vérif** :

| Claim | Verdict | Pourquoi |
|---|---|---|
| `useBodyScrollLock` oublie son cleanup quand `active=false` | ❌ FAUX | React appelle toujours le cleanup du useEffect précédent avant de rerun. Le code est correct. |
| NotificationBell `pointerdown` handler ferme le dropdown en boucle | ❌ FAUX | Le `dropdownRef` wrap la totalité du composant (bell + dropdown), donc `contains(e.target)` retourne `true` pour les taps internes. Handler ne ferme QUE sur clic externe. |
| Sidebar `inert` reorder nécessaire | ❌ FAUX | `inert={isMobile && !sidebarOpen ? true : undefined}` est correct. Le problème "hamburger bloqué" vient plutôt du SW scope conflict (#2). |
| Redirect loop program ↔ subscription | ⚠️ NON REPRO | Les conditions `shouldRedirectSurvey` / `shouldRedirectSubscription` excluent `/dashboard/program` implicitement via le flow trial. Pas de loop observé. |

---

## Plan d'action priorisé

| Priorité | Tâche | Effort | Fichier(s) |
|---|---|---|---|
| **P0** | Fix spinner infini program page | 5 min | program/page.tsx |
| **P0** | Unifier scope SW sur `/` partout | 10 min | push.ts, useMerchantPushNotifications.ts, useInstallPrompt.ts |
| **P0** | `onMouseDown` → `onPointerDown` autocomplete client | 2 min | ClientSelectModal.tsx |
| **P0** | `mode="wait"` + `pointer-events-none` backdrops planning | 15 min | PlanningModal.tsx + tous les modals planning |
| **P1** | Retirer `userScalable: false` + audit `touch-manipulation` | 20 min | layout.tsx root + audit visuel |
| **P1** | NotificationBell : RAF avant router.push | 3 min | NotificationBell.tsx |
| **P2** | Cache merchant fresh flag post-signup | 10 min | MerchantContext + personalize |

**Total estimé** : ~1h de code, mais tests PWA sur iOS réel obligatoires pour valider (simulateur insuffisant).

---

## Notes de test

Pour reproduire et valider les fixes, utiliser :
1. iPhone réel (pas simulateur — simulateur n'exhibe pas la plupart de ces bugs)
2. Mode standalone (PWA installée depuis "Ajouter à l'écran d'accueil")
3. Safari devtools via Mac (Préférences > Avancé > Menu Développement)
4. Tests : signup fresh → flow onboarding complet → dashboard nav → ouverture modals planning → notifications

**Red flag runtime** à surveiller dans la console :
- `SW controller: null`
- `A different Service Worker was already registered with a scope of X`
- Warnings Framer Motion `AnimatePresence` sur children dupliqués

---

## Correctifs appliqués — 2026-04-21

| # | Fix | Fichier(s) |
|---|---|---|
| 1 | try/catch/finally sur fetchMerchant program page | `src/app/[locale]/dashboard/program/page.tsx` |
| 2 | SW scope unifié sur `/` partout | `src/hooks/useMerchantPushNotifications.ts`, `src/hooks/useInstallPrompt.ts` (push.ts déjà à `/`) |
| 3 | `onMouseDown` → `onPointerDown` autocomplete client (+ `touch-manipulation`) | `src/app/[locale]/dashboard/planning/ClientSelectModal.tsx`, `planning/page.tsx` |
| 4 | `mode="wait"` sur toutes les AnimatePresence planning + `pointerEvents: 'none'` sur backdrops pendant exit | `PlanningModal.tsx`, `ClientSelectModal.tsx`, `BookingDetailsModal.tsx`, `planning/page.tsx` |
| 5 | `userScalable: false` retiré du viewport root | `src/app/layout.tsx` |
| 6 | `requestAnimationFrame` avant `router.push` dans NotificationBell (laisse le flush state avant nav) + `touch-manipulation` sur bell | `src/components/dashboard/NotificationBell.tsx` |

**Non traité (jugé non critique)** :
- P2.7 : cache merchant fresh flag post-signup (source de confusion flow, pas bug bloquant)
- P2.8 : audit `touch-manipulation` sur tous les boutons dashboard (grosse opération, à faire si les symptômes persistent)
- P2.9 : InstallAppBanner z-index vs modals (cas rare)
- Manifest pro `scope: '/dashboard'` laissé tel quel (scope manifest ≠ scope SW, pas de conflit)

**Tests à faire** : signup fresh sur iPhone réel en PWA installée → flow onboarding → dashboard nav → taps sur modals planning → notifications bell. Vérifier absence des symptômes (pas de double-tap, hamburger ouvre au 1er tap, pas de blocage program page).
