# Plan pricing Qarte — avril 2026

> Plan opérationnel 2 tiers. Mode plan, pas d'implémentation.
> Skills appliqués : `pricing-strategy` (good-better, value metric, paradox of choice), `marketing-psychology` (anchoring externe, default effect, endowment, hyperbolic discounting), `paywall-upgrade-cro` (feature gating post-trial only), `competitor-alternatives` (anchoring vs Planity/Booksy).

---

## 1. Décision pricing

### Grille finale

| | **Fidélité** | **Tout-en-un** ⭐ |
|---|---|---|
| **Mensuel** | **19€/mois** | **24€/mois** |
| **Annuel** | **190€/an** (~17% off) | **240€/an** (~17% off) |
| **Cible** | Pro qui a déjà un outil booking (Planity, Booksy, agenda papier) et veut juste fidéliser | Pro qui veut tout dans 1 outil — remplace Planity/Booksy entièrement |
| **Pitch** | *"Garde ton outil booking, ajoute la fidélité"* | *"Réservation + fidélité + vitrine, sans commission"* |

### Logique du gap 19€ → 24€

- **+5€ (+26%)** pour débloquer planning + résa en ligne + acompte 0% commission + 100 SMS marketing
- Skill `marketing-psychology` : *Default effect + Hyperbolic discounting* — celui qui a testé tout en trial paie 5€ de plus sans hésiter pour ne rien perdre (*Endowment effect*)
- Pas de tier 3 (Pro+) à ce stade — voir section 9 (rationale 2 tiers vs 3)

### Pourquoi pas de plan gratuit

- Trial 7j + churn survey bonus jours suffisent comme entrée gratuite
- Skill `pricing-strategy` : *Zero-Price Effect* est un piège pour Qarte (cible TPE = pas de monétisation indirecte)
- L'engagement payant filtre les sérieux

---

## 2. Features par tier (audit complet)

### Pilier 1 — Fidélité (cœur des 2 tiers)

| Feature | Fidélité | Tout-en-un |
|---|:---:|:---:|
| Mode passage (tampons) + Cagnotte (cashback) | ✅ | ✅ |
| Tier 2 (palier 1 + palier 2) | ✅ | ✅ |
| QR Code download | ✅ | ✅ |
| Carte NFC offerte (annuel) | ✅ | ✅ |
| Anniversaire client + voucher auto | ✅ | ✅ |
| Parrainage (10€/10€) | ✅ | ✅ |
| Offres : Bienvenue / Duo / Étudiante | ✅ | ✅ |
| Jours x2 (double tampons) | ✅ | ✅ |
| Avis Google auto | ✅ | ✅ |
| Qarte Shield (anti-fraude) | ✅ | ✅ |
| Push notifications clientes | ✅ | ✅ |
| Stats fidélité | ✅ | ✅ |
| Programmes Membres VIP (clients fidèles) | 🔒 | ✅ |
| Jeu concours mensuel | 🔒 | ✅ |

### Pilier 2 — Planning + Réservation en ligne

| Feature | Fidélité | Tout-en-un |
|---|:---:|:---:|
| Planning créneaux | 🔒 | ✅ |
| Mode libre | 🔒 | ✅ |
| Réservation en ligne via vitrine | 🔒 | ✅ |
| Acompte (lien own, 0% commission) | 🔒 | ✅ |
| Annulation / modification client | 🔒 | ✅ |
| Multi-services / multi-créneaux | 🔒 | ✅ |
| Photos avant/après | 🔒 | ✅ |
| Journal client (notes) | 🔒 | ✅ |
| Vue jour / 2j / semaine | 🔒 | ✅ |
| Daily digest merchant | 🔒 | ✅ |
| Archive acomptes échoués + bring-back | 🔒 | ✅ |

### Pilier 3 — Vitrine SEO

| Feature | Fidélité | Tout-en-un |
|---|:---:|:---:|
| Page publique `/p/[slug]` | ✅ | ✅ |
| Indexation Google + JSON-LD | ✅ | ✅ |
| Bio, services, horaires, photos | ✅ | ✅ |
| Liens sociaux + display phone | ✅ | ✅ |
| Bandeau message libre | ✅ | ✅ |
| **Booking module sur la vitrine** | 🔒 (CTA "contacte le salon") | ✅ |
| QR desktop floating | ✅ | ✅ |

### SMS

| Feature | Fidélité | Tout-en-un |
|---|:---:|:---:|
| **Quota mensuel inclus** | **50 SMS** | **100 SMS** |
| SMS rappel J-1 RDV | 🔒 (besoin planning) | ✅ |
| SMS confirmation RDV | 🔒 (besoin planning) | ✅ |
| SMS anniversaire | ✅ | ✅ |
| SMS récompense parrainage | ✅ | ✅ |
| Auto-SMS welcome / avis Google / voucher expire / inactif | 🔒 | ✅ |
| **Campagnes SMS marketing manuelles** (modération admin) | 🔒 | ✅ |
| Packs SMS additionnels (50-250 à 0,075€/SMS) | ✅ | ✅ |

### Push merchant

| Feature | Fidélité | Tout-en-un |
|---|:---:|:---:|
| PWA Pro installable | ✅ | ✅ |
| Push nouvelle résa | 🔒 | ✅ |
| Push anniversaire / digest / weekly recap | ✅ | ✅ |
| Notification bell | ✅ | ✅ |

### Multi-pays / autres

| Feature | Fidélité | Tout-en-un |
|---|:---:|:---:|
| FR / BE / CH | ✅ | ✅ |
| 10 currencies | ✅ | ✅ |
| Programme ambassadeur 20% | ✅ | ✅ |

---

## 3. Économie unitaire

### Coût SMS pour Qarte
Hypothèse : **0,075€ HT par SMS + 1€ HT de frais/mois**.

| Tier | SMS inclus | Coût SMS HT/mois | Prix tier HT (TVA 20%) | Marge brute HT | % marge |
|---|---|---|---|---|---|
| **Fidélité** | 50 | 50 × 0,075 + 1 = **4,75€** | 19€ TTC = 15,83€ HT | 11,08€ | **70%** |
| **Tout-en-un** | 100 | 100 × 0,075 + 1 = **8,50€** | 24€ TTC = 20€ HT | 11,50€ | **57%** |

Marge brute **>55% sur les 2 tiers**. Cohérent avec un SaaS sain. Coûts variables hors SMS (Stripe ~3% + Resend + Supabase) absorbent ~5-10% supplémentaires → marge nette ~45-60%.

### Conversion attendue
- **Fidélité** : 25-35% du mix (cible Planity users + price-sensitive)
- **Tout-en-un** : 65-75% du mix (cible majoritaire post-trial)
- **ARPU mix** : ~22-23€/mois mensuel équivalent

---

## 4. Trial = full access (décision clé)

### Principe
Pendant les 7 jours de trial, le merchant a accès à **tout Tout-en-un** sauf **les SMS sortants** (locked comme aujourd'hui via `PAID_STATUSES`). Le choix de tier se fait **au checkout**, pas avant.

### Pourquoi
- Skill `paywall-upgrade-cro` : *"Value before ask. User should have experienced real value first. Upgrade should feel like natural next step. Timing: After 'aha moment'"*
- Skill `marketing-psychology` : *Endowment Effect* — celui qui a goûté planning + booking ne veut plus le perdre → choisit Tout-en-un
- *IKEA Effect* — il a configuré sa vitrine, son programme, ses prestations → valeur perçue maximale au checkout

### Implication technique
```ts
export function getPlanFeatures(merchant: Merchant) {
  // Trials = accès Tout-en-un (sauf SMS déjà gated par PAID_STATUSES)
  if (merchant.subscription_status === 'trial') return PLAN_TIERS.all_in;
  return PLAN_TIERS[merchant.plan_tier ?? 'all_in'];
}
```
Le feature gating s'applique **uniquement aux merchants abonnés** (`active`, `canceling`, `past_due`).

---

## 5. Anchoring sans tier 3 — comparaison externe

Sans Pro+ comme decoy interne, l'anchoring se fait via les concurrents (skill `competitor-alternatives` + `marketing-psychology` *Anchoring*) :

```
        Planity         Booksy          Qarte Tout-en-un
       (gratuit)        (60€/mois)      24€/mois
       + 20% comm       + commission    ✓ 0% commission
       sur tes RDV      sur tes RDV     ✓ SMS inclus
```

L'anchor devient **le coût réel chez les concurrents** (commission cumulée). Plus puissant qu'un Pro+ artificiel parce que ancré dans leur réalité business.

**À mettre sur la pricing page** : tableau comparatif côte-à-côte avec calcul "si tu fais X RDV/mois via Booksy à 20% commission, tu paies Y€/mois — Qarte = 24€ flat".

---

## 6. Migration des merchants existants

### Règle simple
Tous les merchants actifs aujourd'hui sont **passés en Tout-en-un automatiquement** (toutes leurs features fonctionnent comme avant).

### Sous-cas

| Cas | Action |
|---|---|
| **Grandfathered 19€/mois** (testé avant) | Reste sur **Tout-en-un à 19€/mois à vie**. Verrouillé. NE PAS confondre avec Fidélité (qui est aussi 19€ pour les nouveaux mais avec features réduites) |
| **Grandfathered 180€/an** | Reste sur Tout-en-un à 180€/an à vie |
| **Nouveaux 24€/240€** | Restent sur Tout-en-un (prix actuel) |
| **Tarifs négociés Stripe** | Inchangés |

### UX critique pour grandfathered 19€

Sur `/dashboard/subscription` :
- Affiche **vrai prix** (déjà géré via `unit_amount` Stripe, feature avril 2026)
- Mention : *"Tarif historique préservé — tu gardes Tout-en-un à 19€/mois à vie"*
- Évite la panique *"je paie 19€, je vais perdre le planning ?"* en voyant la pricing page publique

### Comm
Email aux 100% merchants actifs : *"On a élargi la gamme. Tu restes sur ton tarif actuel + tu peux changer de plan si tu veux."* + lien vers la nouvelle pricing page.

---

## 7. TrialEnding — recommandation intelligente par tier

L'email **TrialEnding** devient un moment pédagogique clé. Plutôt que "Abonne-toi", c'est *"Choisis comment tu veux continuer"* :

**Subject** : *"{firstName}, +2 jours. Voici comment adapter Qarte à ton usage"*

**Body** :
- Récap de **ce qu'ils ont utilisé** pendant le trial (stats : X scans, Y résas, vitrine complétée)
- 2 cards des tiers avec **reco intelligente basée sur l'usage** :
  - Si `activation_score >= 2` ET planning utilisé (`booked_online >= 1`) → recommande **Tout-en-un** pré-sélectionné
  - Si seulement fidélité utilisée (`visits >= 1` mais `booked_online = 0`) → recommande **Fidélité** pré-sélectionné

Skill `marketing-psychology` : *Default effect* (reco pré-sélectionnée dans le checkout) + *Personalization*.

---

## 8. Implémentation technique

### Stripe
- **Créer 2 nouveaux Prices Fidélité** (FR EUR) :
  - `STRIPE_PRICE_FIDELITY` 19€/mois
  - `STRIPE_PRICE_FIDELITY_ANNUAL` 190€/an
- Garder les 2 actuels pour Tout-en-un (24€/240€)
- Active Stripe Tax sur tous

### DB
```sql
ALTER TABLE merchants
  ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'all_in'
    CHECK (plan_tier IN ('fidelity', 'all_in'));

CREATE INDEX idx_merchants_plan_tier ON merchants(plan_tier)
  WHERE subscription_status IN ('active', 'canceling', 'past_due');
```

Backfill : tous les merchants actuels → `'all_in'` (zéro changement perçu).

### Constants partagées
```ts
// src/lib/plan-tiers.ts (nouveau)
export const PLAN_TIERS = {
  fidelity: {
    sms_quota: 50,
    planning: false,
    booking_online: false,
    marketing_sms: false,
    member_programs: false,
    contest: false,
  },
  all_in: {
    sms_quota: 100,
    planning: true,
    booking_online: true,
    marketing_sms: true,
    member_programs: true,
    contest: true,
  },
} as const;

export function getPlanFeatures(merchant: Merchant) {
  if (merchant.subscription_status === 'trial') return PLAN_TIERS.all_in;
  return PLAN_TIERS[merchant.plan_tier ?? 'all_in'];
}
```

### Feature gating

**Pattern serveur** : helper `requireTier(merchant, 'all_in')` qui throw si insuffisant.
**Pattern UI** : condition simple `if (planTier === 'fidelity') return <UpgradeCTA />`.

Routes à gater (tier ≥ all_in, abonnés seulement) :
- `POST /api/planning/*` (création slots, booking, photos)
- `POST /api/sms/campaign/*` (compose marketing)
- `POST /api/member-programs` (Programmes Membres VIP)
- `PATCH /api/contest`
- Auto-SMS marketing dans `sms-hourly` cron (skip si tier=fidelity sauf birthday/parrainage)

UI à gater (Fidélité voit l'item grisé + badge "Tout-en-un") :
- Sidebar : Planning section
- `/dashboard/program` : section Membres VIP
- `/dashboard/marketing` : onglet SMS campagnes
- `/dashboard/contest`
- Vitrine `/p/[slug]` : booking module remplacé par CTA "Contacte le salon"

### SMS quota dynamique
```ts
// src/lib/sms.ts
export function getSmsQuotaForMerchant(merchant: Merchant): number {
  return getPlanFeatures(merchant).sms_quota; // 50 (Fidélité) ou 100 (Tout-en-un)
}
```
Touch `getSmsUsageThisMonth()`, alertes 80%/100%, `notifyMerchantQuotaAlert`.

### Pricing page `/pricing` (refonte)
- 2 cards côte-à-côte
- Toggle mensuel/annuel
- Tout-en-un highlighted ("Recommandé") + badge "Le plus populaire"
- **Comparison externe** Planity/Booksy/Qarte en dessous (anchoring)
- FAQ : "Puis-je changer de plan ?", "Que se passe-t-il si je downgrade ?"
- Anchor "0,80€/jour" sur Tout-en-un

### Subscription page `/dashboard/subscription`
- Affiche tier actuel + vrai prix Stripe
- Bouton "Changer de plan" → modal avec les 2 options
- Si downgrade Tout-en-un → Fidélité : warning *"Tu vas perdre accès à : planning, résa en ligne, member programs, jeu concours, campagnes SMS marketing. Continuer ?"*
- Stripe `subscription.update({ items: [{ price: NEW_PRICE_ID }], proration_behavior: 'create_prorations' })`

### Choix du plan post-trial
**Option recommandée** : choix dans le checkout Stripe (réduit friction).
- Trial 7j → tester Tout-en-un complet
- À J-2 fin trial : email TrialEnding avec reco basée sur usage + lien direct vers checkout pré-sélectionné
- Au checkout : 2 options visibles, pré-sélection sur la reco

### Admin
- `/admin/merchants` : colonne tier + filtre
- `/admin/tracking` : MRR par tier, distribution par tier, conversion par tier
- `/admin/merchants/[id]` : afficher tier + historique changements (via Stripe webhook log)

### Email comm migration
- **PlansLaunchEmail** : annonce aux active merchants (rassurant, "ton tarif est préservé")
- **TrialEnding email** mis à jour : montre les 2 tiers avec reco
- **SubscriptionConfirmedEmail** : mentionne le tier choisi

---

## 9. Pourquoi 2 tiers et pas 3

### Décision
Pas de tier "Pro+" à ce stade. Reconsidération possible si :
1. Base atteint 500+ abos actifs
2. Identification d'un segment qui demande explicitement plus (volume SMS énorme, multi-établissements)

### Rationale (skills `pricing-strategy` + `marketing-psychology`)

| Argument 2 tiers | Skill |
|---|---|
| **Paradox of choice** : cible TPE peu tech-savvy, décision rapide nécessaire | `pricing-strategy` *"Limit options. Three pricing tiers beat seven"* |
| **Decoy effect non crédible** : white-label / 250 SMS / multi-utilisateurs ne résonnent pas avec l'ICP indépendant | `marketing-psychology` |
| **Anchoring possible via concurrents** (Planity 20% comm, Booksy 60€) | `competitor-alternatives` |
| **30-40% moins de dev** (2 Stripe Prices, pas de matrice 3-state) | Pragma |
| **ROI marginal** d'un tier 3 (5-10% adoption × +15€ = ~75€ MRR sur 100 abos) | Calcul ROI |
| **Focus marketing** : 2 messages clairs (Fidélité-only vs Tout-en-un) > 3 messages confus | `pricing-strategy` *"One clear story per tier"* |

### Effort dev économisé vs 3 tiers
- ~2-3 jours dev en moins
- Maintenance + support + tests divisé par 1,5x

---

## 10. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Cannibalisation Tout-en-un → Fidélité (Fidélité trop attractif à 19€) | Fidélité bien gaté (no planning, no campagnes SMS, no member VIP, no contest). Si pain point booking, ils upgradent. Gap 5€ rend l'upgrade évident. |
| Grandfathered 19€ paniquent en voyant la pricing page (pensent perdre planning) | Mention claire "Tarif historique préservé Tout-en-un" sur leur dashboard. Email dédié. |
| Merchants existants demandent à passer Fidélité (perte revenue) | Politique : grandfathering = leur tarif d'origine SUR LEUR TIER d'origine (Tout-en-un 19€). Switch vers Fidélité = nouveau tarif Fidélité 19€ mais features réduites. |
| Complexity support | Doc interne claire + `/admin` filtrable par tier |
| Conversion trial → Fidélité plutôt que Tout-en-un (perte ARPU) | Email TrialEnding personnalisé pousse Tout-en-un quand usage planning détecté |

---

## 11. Mesure du succès

### KPIs primaires (3 mois post-launch)

- **MRR mix** : viser Fidélité 25-35% / Tout-en-un 65-75%
- **ARPU global** : doit rester ≥ 22€/mois (proche du 24€ actuel) — Fidélité 19€ × 30% + Tout-en-un 24€ × 70% = **22,50€**
- **Conversion trial → paid** : viser **+3-5 pts** (Fidélité capture les "pas convaincus full")
- **Net new MRR** : doit être >0 (sinon = pure cannibalisation, alerte rouge)

### KPIs secondaires
- Taux d'upgrade Fidélité → Tout-en-un dans les 90j (cible : 15-20%)
- Taux de downgrade Tout-en-un → Fidélité (cible : <5%)
- LTV par tier
- Churn par tier (Fidélité devrait avoir churn plus faible — moins d'usage = moins d'attente)

### Validation pré-launch
- **Van Westendorp** typeform : envoyer aux 50 derniers trials pour valider que 19/24 sont dans la zone optimale
- **MaxDiff** sur features pour valider le packaging (Fidélité-only perçu comme un package complet)

---

## 12. Roadmap d'exécution

| Phase | Livrable | Effort | Dépendance |
|---|---|---|---|
| **0** | Validation pricing : Van Westendorp survey 50 trials récents | 2j | — |
| **1** | Stripe Prices Fidélité (mensuel + annuel) + DB `plan_tier` + backfill | 1j | Phase 0 |
| **2** | Helper `getPlanFeatures()` + feature gating routes API (post-trial only) | 1j | Phase 1 |
| **3** | Feature gating UI (Fidélité voit grisé + badge upgrade) | 1j | Phase 2 |
| **4** | SMS quota dynamique (50/100 selon tier) | 0,5j | Phase 1 |
| **5** | Pricing page refonte (2 cards + comparaison Planity/Booksy) | 1j | Phase 1 |
| **6** | Subscription page : affichage tier + upgrade/downgrade flow | 1j | Phase 2 |
| **7** | TrialEnding email mis à jour : reco basée sur usage | 0,5j | Phase 1 |
| **8** | Comm migration grandfathered + admin tracking | 0,5j | Phase 1 |
| **9** | Tests E2E (trial → checkout, upgrade, downgrade, grandfathered) | 1j | Phases 1-7 |

**Total dev** : ~6,5 jours. Mesure A/B 4-6 semaines post-launch.

---

## 13. Décisions actées

1. ✅ **2 tiers** : Fidélité (19€/190€) + Tout-en-un (24€/240€)
2. ✅ Trial = full access Tout-en-un (SMS reste locked comme aujourd'hui)
3. ✅ Choix du tier = **au checkout** (pas avant)
4. ✅ Vitrine info incluse dans Fidélité (booking module seul locked)
5. ✅ Grandfathered 19€ verrouillés à vie sur **Tout-en-un à 19€** (distinct du nouveau Fidélité à 19€)
6. ✅ TrialEnding recommande tier basé sur usage réel (`activation_score` + planning détecté)
7. ✅ Anchoring via comparaison externe Planity/Booksy (pas de tier 3 decoy)
8. ✅ Annual discount 17% partout

## 14. Questions ouvertes

1. ❓ **Validation Van Westendorp** avant ship ? (recommandé, 2j d'attente, +sécurité)
2. ❓ **TVA HT/TTC** : 19€/24€ sont TTC ou HT ? (impact pricing page wording)
3. ❓ **Toggle settings `marketing_sms_opted_out`** : uniquement Tout-en-un (puisque Fidélité ne reçoit pas marketing SMS) ou partout ?
