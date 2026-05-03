# Spec — Dupliquer un RDV sur une ou plusieurs autres dates

> Spec gardée au chaud, à implémenter plus tard. Décisions UX validées le 2026-05-03.

## Contexte

Use case : une cliente fidèle (ou le merchant lui-même) veut caler ses prochains rendez-vous d'avance ("on se revoit dans 2 semaines, puis 4, puis 6"). Aujourd'hui le merchant doit retaper toute la résa N fois — services, durée, presta sur mesure, adresse home-service, notes, contact. Inefficient.

**Objectif** : un bouton "Dupliquer" dans `BookingDetailsModal`, à côté de "Déplacer", qui ouvre une modale permettant d'ajouter N dates+heures et duplique le RDV en lot, avec gestion best-effort des conflits.

## Décisions validées

- **UX** : multi-dates en un coup (liste éditable +/-, 1 submit duplique tout)
- **Conflits** : best-effort — on crée ce qui passe, on remonte un récap des dates ignorées (ex. "2/3 RDV créés. 24 mai 14:00 ignoré : créneau occupé.")

## Périmètre v1

- **Mode libre uniquement** (`booking_mode = 'free'`). En mode créneaux, le bouton "Dupliquer" est masqué (cohérent avec philosophie "features planning avancées = libre"). Si demande explicite plus tard, étendre la logique côté API pour résoudre un slot vide.
- **Pas de récurrence automatique** ("toutes les 2 semaines pendant 6 mois") — uniquement N dates explicites entrées une par une. Si besoin, on ajoute un helper "+2 semaines / +1 mois" plus tard.
- **Pas de duplication multi-slot** : si le RDV source a `primary_slot_id` ou des fillers attachés → bouton désactivé (cohérent avec `move_booking` qui rejette `multi_slot_not_supported`).

## Champs propagés vers chaque clone

| Champ | Cloné ? | Note |
|---|---|---|
| `client_name`, `client_phone`, `customer_id` | ✅ | identique |
| `total_duration_minutes` | ✅ | identique |
| `service_id` (legacy), `planning_slot_services[]` | ✅ | INSERT nouvelles lignes avec `slot_id` du clone |
| `custom_service_name/duration/price/color` | ✅ | identique (cohérent avec mig 130/151) |
| `notes` | ✅ | par défaut copié (le merchant peut éditer après) |
| `customer_address`, `customer_lat`, `customer_lng` | ✅ | identique (l'adresse cliente bouge rarement). `recomputeDayTravel` déclenché par date affectée. |
| `booked_online` | ❌ | forcé à `false` (clone créé manuellement par merchant) |
| `booked_at` | ❌ | `NOW()` à la création |
| `deposit_confirmed`, `deposit_deadline_at` | ❌ | NULL — le clone n'a pas d'acompte. Si demande, le merchant l'ajoute après. |
| `travel_time_minutes`, `travel_time_overridden` | ❌ | recalculés par `recomputeDayTravel` après insert |
| `planning_slot_photos`, `result_photos`, `customer_notes` | ❌ | non clonés (spécifiques au RDV source réalisé) |

## Architecture

### API — nouvel endpoint `POST /api/planning/duplicate-booking`

Réutilise la logique d'overlap de `manual-booking` mais en lot. Préféré à un loop de N appels HTTP côté frontend pour :
- 1 seule auth + 1 seul fetch merchant
- Récap structuré côté serveur (`{created: [], skipped: [{date, time, reason}]}`)
- Atomicité par cible (un échec ne casse pas les autres)

**Schéma Zod** :
```ts
{
  merchantId: uuid,
  sourceSlotId: uuid,                    // RDV à dupliquer
  targets: Array<{ date: YYYY-MM-DD, start_time: HH:MM }>,  // 1-12
  send_sms?: boolean,                    // 1 SMS confirmation_no_deposit par date créée
}
```

**Flow** :
1. Auth + ownership check (`merchant.user_id === user.id`)
2. Reject si `booking_mode !== 'free'` (v1)
3. Fetch source slot avec join `planning_slot_services(service_id)` — vérifier `client_name IS NOT NULL`, pas de `primary_slot_id`, pas de fillers attachés (cohérent avec `move_booking`)
4. Pour chaque target (séquentiel ou parallèle ; séquentiel suffit, max 12) :
   - Check overlap (réutilise la logique lignes 66-96 de `manual-booking/route.ts`) — buffer inclus
   - Si conflit → push dans `skipped[]` avec raison
   - Sinon : INSERT slot avec tous les champs propagés ci-dessus + INSERT `planning_slot_services` rows
   - Si home service + coords → mark date pour recompute
5. À la fin, `recomputeDayTravel` une fois par date affectée (Set pour dédup)
6. Si `send_sms` et phone valide → `sendBookingSms` `confirmation_no_deposit` par date créée (fire-and-forget)
7. Push merchant `booking_duplicated` (1 push global avec count : "3 RDV ajoutés pour Sarah M.") — cohérent avec patterns existants
8. Return `{ created: [{ slotId, date, start_time }], skipped: [{ date, start_time, reason }] }`

**Reuse possible** : extraire un helper `checkOverlapFreeMode(supabase, merchantId, date, startMins, endMins, buffer, excludeSlotId?)` partagé avec `manual-booking` et `customer-edit` (réutilisable, ~25 lignes). Optionnel v1, à factoriser v2 si on touche encore ces routes.

### UI — bouton + overlay inline dans `BookingDetailsModal`

Cohérent avec le pattern existant "Déplacer" qui ouvre un overlay inline (pas une modale séparée).

**Bouton** : ajouté dans le grid 3-cols actuel (Save | Déplacer | Cancel) → passe à grid 4-cols (Save | Déplacer | **Dupliquer** | Cancel) ou redesign en 2 lignes si trop serré. Icône `Copy` (lucide-react). Masqué si :
- `booking_mode !== 'free'` (v1)
- `slot.primary_slot_id` ou slot a des fillers (multi-slot)
- Slot non bookée (cohérent avec "Déplacer")

**Overlay "Dupliquer"** (`BookingDetailsModal.tsx`) :
- Header : "Dupliquer ce RDV" + nom client + résumé (services + durée totale)
- Liste `targets` (state local `Array<{ id, date, start_time }>`) avec :
  - Date picker (`<input type=date>`, min = today+1)
  - Heure picker (`<input type=time>`)
  - Bouton croix pour retirer la ligne (min 1 ligne)
- Bouton `[+ Ajouter une date]` (max 12 lignes)
- Checkbox "Envoyer un SMS de confirmation à chaque RDV créé" (off par défaut)
- Footer : `[Annuler]` + `[Dupliquer N RDV]` (label dynamique)
- Submit → POST `/api/planning/duplicate-booking` → toast récap + ferme overlay + refresh planning

**Récap toast** :
- 100 % succès : `"3 RDV créés ✓"` (vert)
- Partiel : `"2/3 RDV créés. 24 mai 14:00 ignoré : créneau occupé."` (orange)
- 0 % : `"Aucun RDV créé. Tous les créneaux sont occupés."` (rouge)

## Fichiers à créer / modifier

### À créer
- **`src/app/api/planning/duplicate-booking/route.ts`** — endpoint POST décrit ci-dessus (~150 lignes)

### À modifier
- **`src/app/[locale]/dashboard/planning/BookingDetailsModal.tsx`** — ajouter le bouton "Dupliquer" + l'overlay inline (~120 lignes ajoutées). Pattern à mimer : l'overlay "déplacer" lignes 1265-1375.
- **`messages/fr.json`** + **`messages/en.json`** — clés i18n : `duplicateBooking`, `duplicateBookingTitle`, `addDate`, `duplicateNRdv`, `duplicationPartialSuccess`, etc.
- **`docs/context.md`** — ajouter une bullet sous "Move (déplacement)" décrivant le nouveau endpoint + UX.

### Pas modifié (vérifié, pas concerné)
- `move_booking` RPC : pas touchée (la duplication n'utilise pas de RPC, c'est de la création pure)
- `customer-edit/route.ts` : la duplication est merchant-side uniquement, pas exposée au client
- `manual-booking/route.ts` : peut rester tel quel (le helper d'overlap n'est extrait que si on factorise plus tard)

## Verification

1. **Mode libre, 1 date, sans conflit** :
   - Source : RDV "Sarah" 14:00 90min avec 2 services + custom presta
   - Target : 24 mai 14:00
   - Vérifier en DB : nouveau slot avec mêmes services dans `planning_slot_services`, `custom_service_*` copiés, `booked_online=false`, `booked_at=NOW()`, `deposit_confirmed=NULL`
2. **Mode libre, 3 dates avec 1 conflit** :
   - Targets : 10 mai 14:00, 24 mai 14:00 (créneau déjà pris), 7 juin 14:00
   - Vérifier réponse `{ created: [10mai, 7juin], skipped: [{24mai, reason: 'créneau occupé'}] }`
   - Toast affiche le récap correct
3. **Home service activé, adresse + coords** :
   - Vérifier que le clone a `customer_address`/`customer_lat`/`customer_lng`
   - Vérifier que `travel_time_minutes` est calculé après insert (via `recomputeDayTravel`)
4. **Multi-slot rejeté** :
   - Source = RDV avec fillers → bouton masqué côté UI
   - Si quelqu'un appelle l'API direct avec un sourceSlotId multi-slot → 400 `multi_slot_not_supported`
5. **SMS opt-in** :
   - `send_sms: true` + 3 dates créées → 3 SMS `confirmation_no_deposit` envoyés (vérifier `sms_logs`)
   - `send_sms: false` → aucun SMS
6. **Mode créneaux** :
   - Bouton masqué côté UI
   - Si appel API direct → 400 `mode_not_supported`
7. **Auth** :
   - Source slot d'un autre merchant → 403 / 404
8. **Limite 12 dates** :
   - Ajouter 13e ligne → bouton "+ Ajouter" désactivé

## Estimation effort

- API endpoint : 1h30
- Overlay UI dans BookingDetailsModal + state + submit : 2h
- i18n + toast récap : 30min
- Test end-to-end manuel sur les 8 scénarios : 1h
- Docs : 15min

**Total : ~5h** sur la v1. Risque principal : densité visuelle du grid de boutons en bas du modal (déjà 3 boutons + maintenant 4). Si trop serré sur mobile, passer en menu kebab "..." → [Déplacer, Dupliquer, Annuler].

## Hors scope v1 (à tracker si demandé)

- Mode créneaux (résoudre slot vide existant à la date+heure cible)
- Récurrence auto ("+2 semaines × 6 fois" en 1 clic)
- Duplication multi-slot (RDV de 4h cassé en 4 fillers d'1h)
- Cloner l'historique photos/notes (volontairement exclu : ce sont des artefacts du RDV passé)
- Cloner l'acompte (volontairement exclu : chaque clone démarre fresh, le merchant relance manuellement si besoin)
