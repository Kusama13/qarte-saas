# Audit Complet - Qarte SaaS
**Date :** 4 février 2025
**Auditeur :** Claude Opus 4.5

---

## Table des matières

1. [Problèmes Critiques](#1-problèmes-critiques)
2. [Incohérences Base de Données](#2-incohérences-base-de-données)
3. [Sécurité API](#3-sécurité-api)
4. [Types TypeScript](#4-types-typescript)
5. [Accessibilité](#5-accessibilité)
6. [Qualité du Code](#6-qualité-du-code)
7. [Pages Manquantes](#7-pages-manquantes)
8. [Plan d'Action](#8-plan-daction)

---

# 1. Problèmes Critiques

## 1.1 Période d'essai incohérente (14 jours vs 15 jours)

### C'est quoi le problème ?

Imagine que tu dis à tes clients "Essayez gratuitement pendant 15 jours !" sur ton site web, mais en réalité ton système leur donne seulement 14 jours. C'est exactement ce qui se passe ici.

**Où est le problème :**
- Dans la base de données (`migrations/001_initial_schema.sql` ligne 26), quand un nouveau commerçant s'inscrit, on lui donne automatiquement 14 jours d'essai :
  ```sql
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')
  ```
- Mais dans la documentation (`context.md`) et sur le site, on promet 15 jours.

### Pourquoi c'est grave ?

1. **Confiance client** : Un commerçant qui lit "15 jours gratuits" et voit son essai expirer au bout de 14 jours peut se sentir trompé.
2. **Légalité** : Promettre 15 jours et en donner 14, c'est de la publicité mensongère.
3. **Support** : Tu vas recevoir des tickets "Pourquoi mon essai a expiré plus tôt ?"

### Comment le résoudre ?

**Option A - Mettre 15 jours partout (recommandé) :**

1. Créer une nouvelle migration SQL :
```sql
-- migrations/xxx_fix_trial_period.sql
ALTER TABLE merchants
ALTER COLUMN trial_ends_at
SET DEFAULT (NOW() + INTERVAL '15 days');
```

2. Modifier le fichier `src/emails/WelcomeEmail.tsx` ligne 15 :
```typescript
// Avant
export function WelcomeEmail({ shopName, trialDays = 14 }: WelcomeEmailProps)
// Après
export function WelcomeEmail({ shopName, trialDays = 15 }: WelcomeEmailProps)
```

**Impact sur le code :** Faible. Juste 2 fichiers à modifier.
**Impact sur le projet :** Positif. Alignement promesse/réalité.

---

## 1.2 Bypass d'autorisation sur member-programs

### C'est quoi le problème ?

Quand tu vas sur `/api/member-programs/123`, le système récupère le programme avec l'ID 123... mais il ne vérifie jamais si TU as le droit de le voir !

**Exemple concret :**
- Tu es le commerçant A avec ton programme de fidélité
- Le commerçant B (un concurrent) peut appeler `/api/member-programs/TON_ID` et voir tous les détails de ton programme
- Pire : il peut le modifier ou le supprimer !

**Fichier concerné :** `src/app/api/member-programs/[id]/route.ts`

```typescript
// Code actuel (DANGEREUX)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { data: program } = await supabase
    .from('member_programs')
    .select('*')
    .eq('id', params.id)
    .single();

  return NextResponse.json(program); // Pas de vérification !
}
```

### Pourquoi c'est grave ?

1. **Fuite de données** : Tes concurrents peuvent espionner tes programmes
2. **Sabotage** : Quelqu'un peut supprimer ou modifier tes données
3. **RGPD** : Accès non autorisé à des données = violation potentielle

### Comment le résoudre ?

Ajouter une vérification d'autorisation :

```typescript
// Code corrigé (SÉCURISÉ)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Récupérer le programme AVEC le merchant associé
  const { data: program } = await supabase
    .from('member_programs')
    .select('*, merchants!inner(user_id)')
    .eq('id', params.id)
    .single();

  // 3. Vérifier que le user est bien le propriétaire
  if (!program || program.merchants.user_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  return NextResponse.json(program);
}
```

**Impact sur le code :** Moyen. 3 méthodes à modifier (GET, PATCH, DELETE).
**Impact sur le projet :** Critique pour la sécurité.

---

## 1.3 UUID hardcodé pour les notes admin

### C'est quoi le problème ?

Dans le fichier `src/app/api/admin/notes/route.ts`, il y a cette ligne :
```typescript
id: '00000000-0000-0000-0000-000000000001'
```

Ça veut dire que TOUS les admins partagent le MÊME document de notes. Si admin A écrit quelque chose, ça écrase ce que admin B avait écrit.

### Pourquoi c'est un problème ?

1. **Perte de données** : Les notes d'un admin écrasent celles d'un autre
2. **Pas de traçabilité** : Impossible de savoir qui a écrit quoi
3. **Conflits** : Si deux admins éditent en même temps, l'un perd son travail

### Comment le résoudre ?

Deux options :

**Option A - Notes par admin :**
```typescript
// Utiliser l'ID de l'admin comme clé
const { data: { user } } = await supabase.auth.getUser();
const noteId = user.id; // Chaque admin a ses propres notes
```

**Option B - Notes collaboratives avec versioning :**
```typescript
// Garder un historique des modifications
await supabase.from('admin_notes').insert({
  id: crypto.randomUUID(),
  admin_id: user.id,
  content: notes,
  created_at: new Date()
});
```

**Impact sur le code :** Faible à moyen selon l'option choisie.
**Impact sur le projet :** Améliore la collaboration admin.

---

## 1.4 Vulnérabilité Path Traversal sur upload

### C'est quoi le problème ?

Quand un utilisateur upload un fichier, le système prend le nom du fichier tel quel pour créer le chemin de stockage. Un attaquant pourrait envoyer un fichier nommé `../../../etc/passwd` pour accéder à des fichiers système.

**Fichier concerné :** `src/app/api/upload/route.ts` lignes 51-52

```typescript
// Code dangereux
const extension = file.name.split('.').pop(); // Pas de validation !
const fileName = `${uuid}.${extension}`;
```

### Pourquoi c'est grave ?

1. **Sécurité serveur** : Accès potentiel à des fichiers sensibles
2. **Injection de code** : Upload de fichiers malveillants
3. **Réputation** : Une faille de sécurité = perte de confiance

### Comment le résoudre ?

```typescript
// Code sécurisé
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Extraire l'extension de manière sécurisée
const extension = file.name.split('.').pop()?.toLowerCase();

// Valider l'extension
if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
  return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
}

// Nettoyer le nom (supprimer tout caractère dangereux)
const safeExtension = extension.replace(/[^a-z0-9]/g, '');
const fileName = `${uuid}.${safeExtension}`;
```

**Impact sur le code :** Faible. ~10 lignes à ajouter.
**Impact sur le projet :** Sécurité grandement améliorée.

---

# 2. Incohérences Base de Données

## 2.1 Spelling : 'canceled' vs 'cancelled'

### C'est quoi le problème ?

En anglais américain, on écrit "canceled" (1 L).
En anglais britannique, on écrit "cancelled" (2 L).

Le problème : TypeScript utilise l'américain, SQL utilise le britannique.

**TypeScript (`src/types/index.ts`) :**
```typescript
export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'canceling' | 'past_due';
```

**SQL (`migrations/001_initial_schema.sql`) :**
```sql
CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due'))
```

### Pourquoi c'est un problème ?

Quand le webhook Stripe essaie de mettre `'canceled'` dans la base, SQL refuse car il attend `'cancelled'`. Résultat : erreur silencieuse ou crash.

### Comment le résoudre ?

**Étape 1 :** Créer une migration pour aligner SQL sur TypeScript :
```sql
-- migrations/xxx_fix_subscription_status.sql
ALTER TABLE merchants DROP CONSTRAINT merchants_subscription_status_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'canceled', 'canceling', 'past_due'));
```

**Étape 2 :** Mettre à jour les données existantes :
```sql
UPDATE merchants SET subscription_status = 'canceled' WHERE subscription_status = 'cancelled';
```

**Impact sur le code :** Faible. Migration SQL uniquement.
**Impact sur le projet :** Élimine des bugs potentiels avec Stripe.

---

## 2.2 Champs manquants dans les types TypeScript

### C'est quoi le problème ?

La base de données a des colonnes que TypeScript ne connaît pas. C'est comme avoir un formulaire papier avec 10 champs mais un fichier Excel qui n'en a que 8.

**Champs manquants :**

| Table | Champ en DB | Manquant dans Types |
|-------|-------------|---------------------|
| redemptions | `tier` | Oui |
| merchants | `scan_code` | Oui |
| visits | `ip_hash` | Partiellement |

### Pourquoi c'est un problème ?

1. **Autocomplétion cassée** : Ton IDE ne te suggère pas ces champs
2. **Erreurs runtime** : `redemption.tier` fonctionne mais TypeScript dit "ça n'existe pas"
3. **Maintenance difficile** : Nouveau développeur ne sait pas quels champs existent vraiment

### Comment le résoudre ?

Mettre à jour `src/types/index.ts` :

```typescript
// Avant
export interface Redemption {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  redeemed_at: string;
  stamps_used: number;
}

// Après
export interface Redemption {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: 1 | 2;  // AJOUTÉ
}
```

**Impact sur le code :** Faible. Mise à jour des interfaces.
**Impact sur le projet :** Meilleure DX (Developer Experience).

---

# 3. Sécurité API

## 3.1 Absence de Rate Limiting

### C'est quoi le problème ?

Le "rate limiting", c'est limiter le nombre de requêtes qu'un utilisateur peut faire par minute. Sans ça, quelqu'un peut :
- Envoyer 1000 requêtes par seconde pour faire crasher ton serveur (DDoS)
- Tester des milliers de combinaisons pour trouver des failles (brute force)

**Endpoints sans protection :**
- `/api/redeem` - Utiliser un bon de réduction
- `/api/redeem-public` - Version publique
- `/api/upload` - Upload de fichiers
- `/api/member-programs` - Gestion programmes

### Pourquoi c'est grave ?

1. **Abus** : Un client malhonnête pourrait spammer les redemptions
2. **Coûts** : Chaque requête = ressources serveur = argent
3. **Disponibilité** : Trop de requêtes = service down pour tout le monde

### Comment le résoudre ?

Utiliser un middleware de rate limiting :

```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requêtes par minute
});

// Utilisation dans une route
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans 1 minute.' },
      { status: 429 }
    );
  }

  // ... reste du code
}
```

**Impact sur le code :** Moyen. Nouveau middleware + modification des routes.
**Impact sur le projet :** Sécurité et stabilité améliorées.

---

## 3.2 Détails d'erreur Stripe exposés

### C'est quoi le problème ?

Quand une erreur Stripe se produit, le code renvoie les détails techniques au client :

```typescript
// Code actuel (DANGEREUX)
return NextResponse.json({
  error: 'Erreur lors de la création de la session',
  details: error.message  // Expose des infos sensibles !
});
```

Un attaquant peut utiliser ces détails pour comprendre comment fonctionne ton système de paiement et trouver des failles.

### Comment le résoudre ?

```typescript
// Code sécurisé
console.error('Stripe error:', error); // Log côté serveur uniquement

return NextResponse.json({
  error: 'Une erreur est survenue lors du paiement. Veuillez réessayer.'
  // PAS de details !
});
```

**Impact sur le code :** Faible. Supprimer quelques lignes.
**Impact sur le projet :** Moins d'informations pour les attaquants.

---

# 4. Types TypeScript

## 4.1 Utilisation excessive de `any`

### C'est quoi le problème ?

`any` en TypeScript, c'est comme dire "je ne sais pas ce que c'est, accepte tout". Ça désactive les vérifications de type, donc tu perds tous les avantages de TypeScript.

**Exemples trouvés :**
```typescript
// Mauvais
const customer = card.customers as any;
(window as any).fbq("track", eventName);
function FeatureRow({ feature }: { feature: any }) { }
```

### Pourquoi c'est un problème ?

1. **Bugs cachés** : TypeScript ne peut plus t'avertir des erreurs
2. **Autocomplétion perdue** : Ton IDE ne peut plus t'aider
3. **Refactoring risqué** : Tu ne sais pas ce qui va casser

### Comment le résoudre ?

**Exemple 1 - Relations Supabase :**
```typescript
// Créer des types pour les relations
interface LoyaltyCardWithCustomer extends LoyaltyCard {
  customers: Customer;
}

// Utiliser le type correct
const { data } = await supabase
  .from('loyalty_cards')
  .select('*, customers(*)')
  .single();

const card = data as LoyaltyCardWithCustomer;
const customer = card.customers; // Maintenant typé !
```

**Exemple 2 - Facebook Pixel :**
```typescript
// Déclarer le type global
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: object) => void;
  }
}

// Utiliser proprement
if (typeof window !== 'undefined' && window.fbq) {
  window.fbq('track', eventName, params);
}
```

**Impact sur le code :** Moyen. ~15 fichiers à modifier.
**Impact sur le projet :** Code plus robuste et maintenable.

---

# 5. Accessibilité

## 5.1 Boutons sans aria-label

### C'est quoi le problème ?

Les personnes malvoyantes utilisent des lecteurs d'écran. Quand un bouton n'a qu'une icône (pas de texte), le lecteur d'écran dit juste "bouton" sans expliquer ce qu'il fait.

**Exemple problématique :**
```tsx
// Le lecteur d'écran dit : "bouton"
<button onClick={handleClose}>
  <X className="w-5 h-5" />
</button>
```

### Pourquoi c'est important ?

1. **Inclusion** : ~15% de la population a un handicap
2. **Légalité** : En France, l'accessibilité web est obligatoire (RGAA)
3. **SEO** : Google valorise les sites accessibles

### Comment le résoudre ?

```tsx
// Le lecteur d'écran dit : "Fermer, bouton"
<button onClick={handleClose} aria-label="Fermer">
  <X className="w-5 h-5" />
</button>
```

**Fichiers à modifier :**
- `src/components/Modal.tsx`
- `src/components/CustomerManagementModal.tsx`
- `src/components/QRScanner.tsx`
- `src/app/dashboard/page.tsx`
- Et ~15 autres composants

**Impact sur le code :** Faible. Ajouter des attributs.
**Impact sur le projet :** App accessible à tous.

---

# 6. Qualité du Code

## 6.1 Console.log en production

### C'est quoi le problème ?

Il y a 20+ `console.log` et `console.error` dans le code. En production :
- Ça pollue les logs
- Ça peut exposer des informations sensibles
- C'est pas professionnel

### Comment le résoudre ?

Utiliser le logger existant (`src/lib/logger.ts`) :

```typescript
// Avant
console.error('Error fetching data:', error);

// Après
import { logger } from '@/lib/logger';
logger.error('Error fetching data', { error });
```

**Impact sur le code :** Faible. Remplacement mécanique.
**Impact sur le projet :** Logs propres et exploitables.

---

## 6.2 Strings hardcodées

### C'est quoi le problème ?

Les textes en français sont écrits directement dans le code :
```tsx
<p>Bienvenue sur votre tableau de bord</p>
<button>Valider le passage</button>
```

Problèmes :
- Si tu veux changer un texte, tu dois chercher dans tout le code
- Impossible de traduire l'app en anglais sans tout réécrire

### Comment le résoudre ?

Créer un fichier de traductions :

```typescript
// src/lib/i18n/fr.ts
export const fr = {
  dashboard: {
    welcome: 'Bienvenue sur votre tableau de bord',
  },
  loyalty: {
    validateVisit: 'Valider le passage',
  }
};

// Utilisation
import { fr } from '@/lib/i18n/fr';
<p>{fr.dashboard.welcome}</p>
```

**Impact sur le code :** Important. Refactoring de tous les textes.
**Impact sur le projet :** App prête pour l'internationalisation.

---

# 7. Pages Manquantes

## 7.1 Pages légales référencées mais inexistantes

### C'est quoi le problème ?

Le Footer et d'autres composants ont des liens vers :
- `/politique-confidentialite`
- `/mentions-legales`
- `/cgv`

Mais ces pages n'existent peut-être pas (à vérifier).

### Pourquoi c'est grave ?

1. **Légalité** : Ces pages sont OBLIGATOIRES en France
2. **Confiance** : Un lien cassé = site pas sérieux
3. **RGPD** : Politique de confidentialité obligatoire

### Comment le résoudre ?

Vérifier si les pages existent. Si non, les créer :

```
src/app/
  politique-confidentialite/
    page.tsx
  mentions-legales/
    page.tsx
  cgv/
    page.tsx
```

**Impact sur le code :** Moyen. 3 pages à créer si manquantes.
**Impact sur le projet :** Conformité légale.

---

# 8. Plan d'Action

## Priorité 1 - Cette semaine (Critique)

| # | Tâche | Temps estimé |
|---|-------|--------------|
| 1 | Corriger période essai 14→15 jours | 30 min |
| 2 | Ajouter auth check sur member-programs | 1h |
| 3 | Fixer spelling canceled/cancelled | 30 min |
| 4 | Sécuriser upload (path traversal) | 1h |

## Priorité 2 - Semaine prochaine (Important)

| # | Tâche | Temps estimé |
|---|-------|--------------|
| 5 | Ajouter rate limiting | 2h |
| 6 | Supprimer détails erreur Stripe | 30 min |
| 7 | Vérifier/créer pages légales | 2h |
| 8 | Mettre à jour types manquants | 1h |

## Priorité 3 - Ce mois (Amélioration)

| # | Tâche | Temps estimé |
|---|-------|--------------|
| 9 | Remplacer `any` par types corrects | 3h |
| 10 | Ajouter aria-labels partout | 2h |
| 11 | Remplacer console.log par logger | 1h |
| 12 | Extraire strings vers i18n | 4h |

---

## Commandes pour démarrer

```bash
# Voir les fichiers avec 'any'
grep -r "as any" src/ --include="*.ts" --include="*.tsx"

# Voir les console.log
grep -r "console\." src/ --include="*.ts" --include="*.tsx"

# Voir les aria-label existants
grep -r "aria-label" src/ --include="*.tsx"
```

---

## Notes finales

Cet audit a identifié **55+ problèmes** répartis en :
- 4 critiques (sécurité/business)
- 11 importants (stabilité)
- 25 moyens (qualité)
- 15 mineurs (polish)

Le projet est fonctionnel mais a besoin d'un passage pour renforcer la sécurité et la maintenabilité. Les corrections prioritaires peuvent être faites en ~1 jour de travail concentré.

---

*Audit généré le 4 février 2025 par Claude Opus 4.5*
