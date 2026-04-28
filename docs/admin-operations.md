# Admin operations — snippets SQL prêts à coller

Procédures manuelles à exécuter dans **Supabase SQL Editor** (service_role).
Toutes ces opérations sont destructives — vérifier l'email deux fois avant de
lancer.

---

## 1. Supprimer un compte utilisateur (purge complète)

Snippet de référence : un seul bloc `DO $$` qui résout l'email → trouve le
merchant → soft-delete → hard-delete merchant → delete auth user. Pas besoin
de copier-coller un user_id ou merchant_id à la main.

Le passage par soft-delete est **obligatoire** avant le hard-delete : le
trigger `prevent_merchant_hard_delete` (mig 102) bloque tout `DELETE FROM
merchants` tant que `deleted_at IS NULL`.

```sql
DO $$
DECLARE
  v_user_id UUID;
  v_merchant_id UUID;
BEGIN
  SELECT u.id, m.id INTO v_user_id, v_merchant_id
  FROM auth.users u
  LEFT JOIN merchants m ON m.user_id = u.id
  WHERE u.email = 'EMAIL_ICI';

  IF v_merchant_id IS NOT NULL THEN
    UPDATE merchants SET deleted_at = NOW() WHERE id = v_merchant_id;
    DELETE FROM merchants WHERE id = v_merchant_id;
  END IF;

  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
END $$;
```

**Effets** :
- Tout est purgé : merchant, customers liés, loyalty_cards, visits, redemptions, vouchers, planning slots, member programs, push subs, sms logs, etc. (cascade via FK `ON DELETE CASCADE`).
- L'email est libéré : la personne peut se réinscrire avec le même email.
- Fonctionne aussi si l'utilisateur n'a pas (ou plus) de merchant — le `IF v_merchant_id IS NOT NULL` skip proprement.
- Idempotent : relancer le bloc après suppression renvoie juste 0 ligne affectée.

**⚠️ Si abonnement Stripe actif** : annule-le côté Stripe AVANT (sinon facturation continue). Ça ne se fait pas via SQL — passer par le dashboard Stripe ou laisser le webhook traiter `customer.subscription.deleted`.

---

## 2. Soft-delete uniquement (réversible)

Équivalent du bouton "Supprimer" de la page admin (`/admin/merchants/[id]`).
Garde l'auth user et toutes les données — juste masque le merchant des listes
admin (filtre `deleted_at IS NULL`). Réversible via :

```sql
UPDATE merchants SET deleted_at = NULL WHERE id = 'MERCHANT_ID';
```

Pour soft-delete depuis l'email :

```sql
UPDATE merchants
SET deleted_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_ICI')
  AND deleted_at IS NULL
RETURNING id, shop_name, deleted_at;
```

---

## 3. Helpers DB existants

| Helper | Migration | Usage |
|---|---|---|
| `prevent_merchant_hard_delete()` (trigger) | 102 | Bloque hard delete si `deleted_at IS NULL` |
| `get_user_id_by_email(target_email TEXT)` | 107 | RPC pour résoudre un email vers un `auth.users.id` (utile depuis le code TS) |

Exemple TS (depuis un script ou route admin) :
```ts
const { data: userId } = await supabaseAdmin.rpc('get_user_id_by_email', {
  target_email: 'EMAIL_ICI',
});
```
