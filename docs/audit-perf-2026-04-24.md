# Audit perf Qarte SaaS — 2026-04-24

Réalisé le 24/04/2026. Implémentation prévue **dimanche soir** (créneau de moindre traffic).

---

## TL;DR

L'app est globalement bien écrite, mais **une décision architecturale (MerchantContext fetché côté client) plombe les perfs perçues** sur tout le dashboard. Plus quelques quick-wins bundle.

Stack : Next 15.5.9 + React 18.3.1 + Supabase + Vercel.

---

## ✅ Déjà fait (24/04)

### `optimizePackageImports` activé
**Fichier** : [next.config.mjs:7-9](../next.config.mjs#L7)

```js
experimental: {
  optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns', 'date-fns-tz', 'recharts'],
}
```

**Gain attendu** : -150 à -250 KB JS livré sur les routes consommatrices.
**Risque** : nul (feature officielle Next 15).
**À mesurer** : tailles de chunks au prochain `next build`.

---

## 📋 Roadmap dimanche soir

Ordre recommandé : du moins risqué au plus risqué.

### Étape 1 — Activer Vercel Speed Insights (30 min, 0 risque)

**Pourquoi** : sans data réelle utilisateur (LCP, INP, CLS), on optimise à l'aveugle. Permet de mesurer l'impact des changements suivants.

**Comment** :
```bash
npm install @vercel/speed-insights
```

Dans [src/app/layout.tsx](../src/app/layout.tsx) ajouter :
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

// Dans le <body>
<SpeedInsights />
```

Activer dans le dashboard Vercel : Project Settings > Speed Insights > Enable.

**Validation** : Web Vitals visibles dans Vercel dashboard sous 24h.

---

### Étape 2 — Blog en RSC (1h, faible risque)

**Pourquoi** : [blog/page.tsx](../src/app/[locale]/blog/page.tsx) commence par `'use client'` alors que le contenu est statique (array hardcoded). Conséquences :
- Meta tags pas dans le HTML initial → SEO dégradé
- framer-motion chargé pour des cards
- Pas de streaming SSR

**Pages concernées** : `/blog/page.tsx` + 6 articles individuels qui ont peut-être le même problème.

**Comment** :
1. Vérifier les 6 pages blog : `grep -l "'use client'" src/app/\[locale\]/blog/`
2. Sur la page liste, retirer `'use client'`, retirer les `motion.*` (remplacer par CSS Tailwind `transition-*`), garder `<Link>` et `<Image>`
3. Sur les pages article, idem si pas d'interactivité
4. Build local + check rendering OK
5. Vérifier que les meta sont bien dans le HTML : `curl https://localhost:3000/blog | grep -i og:`

**Risque** :
- Animations perdues sur le scroll (acceptable, c'était cosmétique)
- Si une page article a vraiment besoin d'interactivité (vidéo embed, accordion), garder `'use client'` sur celle-là

**Rollback** : `git revert` du commit. Pas de migration DB, pas de cleanup.

---

### Étape 3 — Refactor MerchantContext en server-fetched (4-6h, RISQUE MOYEN)

**⚠️ C'est LE gros morceau. Faire en dernier, avec tests sérieux.**

**Pourquoi** : [MerchantContext.tsx](../src/contexts/MerchantContext.tsx) fetch le merchant en `useEffect` au mount via `supabase.auth.getUser()` + `from('merchants').select()`. Tout le dashboard attend ce round-trip côté client avant de render. Coût observé : 300-800 ms en TTI sur 4G.

**Gain attendu** : -500 ms à -1 s TTI sur tout le dashboard, -20 KB JS, hydration synchrone.

**Plan d'attaque** :

1. **Créer un helper server** `src/lib/merchant-server.ts` :
   ```ts
   import { cookies } from 'next/headers';
   import { createServerClient } from '@supabase/ssr';

   export async function getMerchantFromSession() {
     const cookieStore = await cookies();
     const supabase = createServerClient(/* config avec cookies */);
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return null;
     const { data: merchant } = await supabase
       .from('merchants')
       .select('*')
       .eq('user_id', user.id)
       .single();
     return merchant;
   }
   ```

2. **Splitter le layout dashboard** :
   - [src/app/[locale]/dashboard/layout.tsx](../src/app/[locale]/dashboard/layout.tsx) devient async server
   - Fetch le merchant côté serveur
   - Passe via props à un nouveau composant `DashboardClientShell.tsx` (`'use client'`)
   - Le shell wrap `MerchantProvider` avec `initialMerchant` prop

3. **Modifier MerchantProvider** :
   - Accepter `initialMerchant` en prop
   - Si présent → skip le fetch initial
   - Garder `refetch()` pour les updates post-mutation

4. **Tester l'auth flow complet** :
   - Login merchant → dashboard (vérifier que merchant arrive dans HTML)
   - Signup → onboarding → dashboard
   - Logout → redirect login OK
   - Refresh page dashboard avec session expirée → redirect login OK
   - Update profil → vérifier que `refetch()` fonctionne

5. **Tester sur mobile + PWA standalone** (cookies se comportent différemment).

**Risques concrets** :
- Cookie auth SSR peut casser si `@supabase/ssr` mal configuré
- Race condition si `refetch()` côté client n'invalide pas le cache server
- Les pages enfants qui font `useMerchant()` doivent toutes recevoir le merchant (vérifier qu'aucune ne dépend du loading state actuel)

**Plan de rollback** :
```bash
git revert <commit-hash>
git push
```
Pas de migration DB → rollback instantané. **Garder le commit isolé** pour faciliter le revert.

**Métrique de succès** : TTI dashboard descend de ~3-4s à ~1.5-2s (mesurer via Speed Insights après 24h).

---

## 🔬 Validation post-déploiement

Après chaque étape :

1. **Smoke test manuel** :
   - Login → dashboard charge
   - `/dashboard/customers` charge avec data
   - `/dashboard/planning` ouvre, drag-drop OK
   - `/customer/card/[merchantId]` charge sans erreur
   - Logout → login flow OK

2. **Vercel Logs** : check 1h après déploiement → pas d'erreur 500 anormale

3. **Speed Insights** (24-48h après) : LCP / INP / CLS dashboard

---

## ❌ Choses qu'on ne fera PAS (faux positifs identifiés)

- **`prefetch={true}` sur les Links nav** : Next 15 prefetch déjà les Links visibles. No-op.
- **Service Worker cache strategy** : trop risqué (bugs cache stale = bugs visibles users). Reporter.
- **Dynamic import recharts** : déjà code-splittée par route App Router. Pas dans les bundles des autres pages.
- **Dynamic import QRScanner** : c'est du dead code (importé nulle part).
- **Lazy-load image-compression** : déjà code-splittée par route. Gain marginal.
- **SWR / react-query** : refactor architectural pour gain marginal sur cette app.
- **Animations framer → CSS partout** : 1-2h de bricolage pour 30 KB de gain. Couvert par `optimizePackageImports`.

---

## 🚀 À considérer plus tard (Q3 2026)

- **React 19 + React Compiler** : memoization automatique, gros gain re-renders. Nécessite migration React 18 → 19 d'abord.
- **PPR (Partial Prerendering)** sur `/p/[slug]` : shell statique + dispos en streaming. Impact LCP majeur sur la vitrine publique.
- **Cron sms-hourly batching** : si > 500 merchants actifs, risque de timeout. Pour l'instant OK.
- **Optimistic mutations sur customer card** : UX win, pas perf critique.

---

## Fichiers clés référencés

- [next.config.mjs](../next.config.mjs)
- [src/app/layout.tsx](../src/app/layout.tsx)
- [src/app/[locale]/dashboard/layout.tsx](../src/app/[locale]/dashboard/layout.tsx)
- [src/contexts/MerchantContext.tsx](../src/contexts/MerchantContext.tsx)
- [src/app/[locale]/blog/page.tsx](../src/app/[locale]/blog/page.tsx)
- [src/app/[locale]/dashboard/page.tsx](../src/app/[locale]/dashboard/page.tsx)
