# MAJ du 08/02/2026 - Refactoring des pages monolithiques

## Objectif
Refactorer les deux fichiers les plus volumineux du projet pour ameliorer la maintenabilite sans changer le comportement visible.

## Fichiers modifies

### customer/card/[merchantId]/page.tsx
- **Avant** : 2327 lignes
- **Apres** : 1514 lignes (-35%)

### scan/[code]/page.tsx
- **Avant** : 1406 lignes
- **Apres** : 990 lignes (-30%)

## Composants extraits (src/components/loyalty/)

| Fichier | Role | Lignes |
|---------|------|--------|
| `HistorySection.tsx` | Historique visites/ajustements/remboursements | ~240 |
| `ExclusiveOffer.tsx` | Carte d'offre exclusive depliable | ~122 |
| `MemberCardModal.tsx` | Modal carte membre VIP style credit card | ~134 |
| `InstallPrompts.tsx` | Toasts/modals PWA install (iOS/Android) | ~315 |
| `ReviewPrompt.tsx` | Prompt avis Google avec dismiss permanent | ~64 |
| `ScanSuccessStep.tsx` | Etape succes du scan (progression tiers, push) | ~423 |

## Hook partage (src/hooks/)

| Fichier | Role | Lignes |
|---------|------|--------|
| `usePushNotifications.ts` | Logique push notifications (detection iOS, subscribe, erreurs) | ~153 |

Ce hook remplace la logique push dupliquee dans les deux pages (~50 lignes chacune + handlers).

## Ce qui n'a PAS change
- Aucun changement fonctionnel / visuel
- Aucune modification d'API, de types, ou de base de donnees
- Les pages gardent la meme structure et le meme rendu
- Les fichiers originaux sont dans le sous-dossier `originaux/`

## Contenu du dossier

```
MAJ du 08:02/
  context.md          <- ce fichier
  card-page.tsx       <- version modifiee de customer/card/[merchantId]/page.tsx
  scan-page.tsx       <- version modifiee de scan/[code]/page.tsx
  originaux/
    card-page.tsx     <- original (2327 lignes)
    scan-page.tsx     <- original (1406 lignes)
```

## Pour deployer
1. Verifier `npx tsc --noEmit` (0 erreurs attendues)
2. Tester navigation client : scan QR -> validation -> succes -> carte complete
3. Tester push notifications (iOS Safari standalone + Chrome Android)
4. Tester offre exclusive, historique, modal membre, prompt review
