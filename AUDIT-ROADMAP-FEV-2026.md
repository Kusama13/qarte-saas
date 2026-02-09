# QARTE — Audit Complet & Roadmap Strategique
## Fevrier 2026

---

# PARTIE 1 : AUDIT — CONVERSION TRIAL → PAYANT

## 1.1 Etat actuel du funnel

```
Signup (email+password)
  → Onboarding (logo, couleur, programme)      ← DROP: programme jamais configure
    → Premier scan (QR code en caisse)          ← DROP: QR code jamais imprime/affiche
      → Engagement (scans reguliers)            ← DROP: inactivite apres J+7
        → Conversion (paiement a J+14)          ← DROP: pas de CB, oubli, pas convaincu
          → Retention (renouvellement mensuel)   ← DROP: churn silencieux
```

**Benchmarks SaaS (source: industry data 2025-2026):**
- Opt-in free trial (sans CB) : **18-25%** conversion
- Opt-out free trial (avec CB) : **45-55%** conversion
- Qarte utilise le modele opt-in (sans CB) → cible realiste : **20-25%**

## 1.2 Points de friction identifies

### Friction #1 : Programme jamais configure
- **Symptome** : Merchant s'inscrit mais ne configure pas sa recompense
- **Impact** : Sans programme, le QR code ne sert a rien
- **Emails existants** : ProgramReminder J+1, J+2, J+3 (bon)
- **Manque** : Setup en 1 clic avec presets par metier

### Friction #2 : QR code jamais imprime
- **Symptome** : Programme configure mais 0 scan
- **Impact** : Pas de premiere valeur = pas de conversion
- **Emails existants** : InactiveMerchantDay7, Day14, Day30 (bon)
- **Manque** : Envoi automatique du QR code par email/WhatsApp apres setup

### Friction #3 : Pas de "aha moment" avant J+14
- **Symptome** : Merchant n'a pas eu assez de scans pour voir la valeur
- **Impact** : Pas convaincu de payer
- **Manque** : Objectif gamifie ("10 scans cette semaine"), celebration des milestones

### Friction #4 : Checkout frictionnel
- **Symptome** : Merchant veut payer mais l'UX de conversion est faible
- **Impact** : Abandon au moment du paiement
- **Etat actuel** : Page subscription avec countdown + CTA
- **Manque** : Relance J-1 plus agressive, WhatsApp perso

## 1.3 Recommandations conversion (classees par impact)

### QUICK WINS (impact eleve, effort faible)

**1. Presets de recompense par metier (1-2h)**
- A l'etape "configurer le programme", proposer 3 presets :
  - Coiffeur : "1 brushing offert apres 10 visites"
  - Onglerie : "1 pose offerte apres 10 visites"
  - Institut : "1 soin offert apres 8 visites"
- Rend le setup quasi-instantane (1 clic vs formulaire)
- **Fichier** : `src/app/dashboard/setup/page.tsx`

**2. Email QR code automatique post-setup (1h)**
- Des que le programme est configure, envoyer un email avec :
  - Le QR code en piece jointe (ou lien direct telechargement)
  - 3 instructions : imprimer, placer pres de la caisse, proposer aux clients
- **Fichier** : nouveau template `QRCodeReadyEmail.tsx` + trigger dans setup flow

**3. Day5CheckinEmail enrichi avec objectif (30min)**
- Ajouter un objectif clair : "Objectif : 10 scans d'ici vendredi"
- Email existant mais manque de call-to-action chiffre
- **Fichier** : `src/emails/Day5CheckinEmail.tsx`

**4. Notification WhatsApp J-1 avant fin trial (1h)**
- En plus de l'email TrialEnding J-1, envoyer un WhatsApp :
  "Bonjour {shopName}, votre essai Qarte se termine demain. Vos {X} clients perdront l'acces a leur carte. → [Lien checkout]"
- Impact : WhatsApp a 98%+ d'ouverture vs 20-30% email
- **Implementation** : WhatsApp Business API ou message template via admin dashboard

**5. Celebration premier scan (30min)**
- Quand le merchant recoit son 1er scan, afficher une animation de celebration dans le dashboard
- Envoyer une notification push "Votre premier client vient de scanner !"
- **Impact** : Renforce le "aha moment" emotionnellement

### MEDIUM EFFORT (impact eleve, effort moyen)

**6. Onboarding checklist gamifiee dans le dashboard (3-4h)**
```
☐ Configurer mon programme         ← click → setup
☐ Imprimer mon QR code             ← click → qr-download
☑ Recevoir mon premier scan        ← auto-complete
☐ Envoyer ma premiere notification  ← click → push
☐ Partager sur les reseaux sociaux  ← click → social-kit
```
- Barre de progression (0-100%)
- Badge "Programme lance !" quand 100%
- **Impact** : Guide le merchant etape par etape, reduit l'abandon
- **Fichier** : nouveau composant dans `src/app/dashboard/page.tsx`

**7. Trial extension conditionnelle (+7 jours) (2h)**
- Si le merchant a configure son programme MAIS a < 5 scans a J+12 :
  - Email : "On vous offre 7 jours de plus pour tester"
  - Automatique dans le cron
- **Impact** : Donne plus de temps aux merchants engages mais lents
- **Fichier** : `src/app/api/cron/morning/route.ts` + nouveau email template

**8. Page "Resultats" pre-conversion (3h)**
- A J+10-12, afficher une page/modal recap :
  - "{X} clients inscrits"
  - "{Y} scans cette semaine"
  - "Si vous continuez a ce rythme : {Z} clients fideles dans 3 mois"
  - Projection de CA additionnel
- CTA : "Continuez avec le Plan Pro"
- **Impact** : Visualiser le ROI avant de payer

### HIGH EFFORT (impact tres eleve, effort important)

**9. Free tier limite (8-10h)**
- Tier gratuit : 20 clients max, 1 recompense, pas de push
- Au-dela → upsell vers Plan Pro (19€)
- **Impact** : Elimine la friction #1 du paywall (benchmark: Fresha, Square)
- **Risque** : Cannibalisation des trial → A/B tester

**10. Checkout optimise avec social proof (4h)**
- Refaire la page subscription avec :
  - Compteur en temps reel : "127 commercants actifs ce mois"
  - Temoignages video (embed Loom/YouTube)
  - Garantie "satisfait ou rembourse 30 jours"
  - Trust badges (Stripe secure, RGPD, 4.9/5)
- **Impact** : Rassure au moment de sortir la CB

---

# PARTIE 2 : ROADMAP FEATURES — Du plus facile au plus complexe

## Niveau 1 : QUICK WINS (1-4h chacun)

### F1. Presets de recompense par metier
- **Description** : 3 suggestions pre-remplies basees sur le `shop_type`
- **Effort** : 1-2h
- **Impact** : Reduit le temps de setup de 3min a 30s
- **Fichier** : `src/app/dashboard/setup/page.tsx`

### F2. Email automatique avec QR code apres setup
- **Description** : Email envoye automatiquement avec QR code + instructions d'impression
- **Effort** : 1-2h (nouveau template + trigger)
- **Impact** : Elimine l'oubli d'imprimer le QR code

### F3. Dashboard — Celebration premier scan
- **Description** : Confetti/animation + notification quand le 1er scan arrive
- **Effort** : 1h
- **Impact** : Moment emotionnel qui ancre la valeur

### F4. Stats enrichies sur la carte client
- **Description** : Ajouter "Points avant la recompense", "Dernier passage il y a X jours"
- **Effort** : 2h
- **Impact** : Le client comprend mieux sa progression

### F5. Bouton "Partager mon programme" dans le dashboard
- **Description** : Generer un lien de partage avec preview social (OG tags)
- **Effort** : 2-3h
- **Impact** : Viral loop organique via les merchants

### F6. Templates de push notifications enrichis
- **Description** : Ajouter 10+ templates pre-ecrits par categorie (anniversaire, weekend, fete, meteo...)
- **Effort** : 2h (data + UI)
- **Impact** : Les merchants envoient plus de push → plus d'engagement

## Niveau 2 : FEATURES MOYENNES (4-8h chacune)

### F7. Onboarding checklist gamifiee
- **Description** : Barre de progression 5 etapes dans le dashboard (voir section conversion)
- **Effort** : 4h
- **Impact** : Guide le merchant, reduit le churn d'onboarding

### F8. Birthday Club — Anniversaire clients
- **Description** : Champ date de naissance sur la carte client
- Push auto le jour J : "Joyeux anniversaire ! Votre cadeau vous attend"
- Merchant configure le cadeau (points bonus ou offre speciale)
- **Effort** : 6h (champ BDD, cron, UI merchant, email/push)
- **Impact** : Feature la plus demandee dans la beauty tech (source: Stamp Me, Zenoti)
- **Inspiration** : Stamp Me "Birthday Club", Treatwell birthday campaigns

### F9. Programme de parrainage client
- **Description** : Le client partage un lien → le filleul scanne → les 2 gagnent des points bonus
- Lien unique par client (UUID)
- Dashboard merchant : voir les parrainages
- **Effort** : 6-8h (table referrals, logique bonus, UI client + merchant)
- **Impact** : Viral loop client → acquisition gratuite pour le merchant

### F10. Scratch & Win — Gamification
- **Description** : Apres X scans, le client debloque un "ticket a gratter" digital
- Recompenses aleatoires (bonus points, reduction, cadeau)
- Animation de grattage sur mobile
- **Effort** : 6h (animation, logique random, config merchant)
- **Impact** : Boost engagement +35% (source: Stamp Me case studies)
- **Inspiration** : Stamp Me "Scratch & Win"

### F11. Mode "Articles" avance
- **Description** : Points par euro depense (pas juste par visite)
- Integration montant de la transaction
- **Effort** : 4-5h (modification scan flow, calcul points, UI)
- **Impact** : Mieux adapte aux restaurants, commerces avec panier variable

### F12. Export CSV enrichi + rapports PDF
- **Description** : Export clients avec toutes les donnees (visites, points, derniere visite)
- Rapport PDF mensuel auto-genere
- **Effort** : 5h
- **Impact** : Pro feature demandee par les merchants multi-salons

### F13. Offres geolocalised (push contextuelle)
- **Description** : Push notification quand le client est dans un rayon de 500m du commerce
- Utilise la Geolocation API (permission-based)
- **Effort** : 6-8h (geo tracking, geofencing logic, permission UI)
- **Impact** : Taux de visite spontanee x3

## Niveau 3 : FEATURES AVANCEES (1-3 jours chacune)

### F14. Multi-location support
- **Description** : Un merchant = plusieurs points de vente
- Carte de fidelite valable partout
- Dashboard consolide + vue par location
- **Effort** : 2-3 jours (restructuration BDD, admin UI, scan routing)
- **Impact** : Ouvre le marche des chaines (3+ salons)
- **Prerequis** : Migration schema merchants

### F15. Tableau de bord analytics avance
- **Description** :
  - Courbes de retention (cohort analysis)
  - Heatmap jours/heures des visites
  - Taux de redemption par palier
  - Customer lifetime value estime
  - Comparaison mois-sur-mois
- **Effort** : 2 jours (queries, graphiques, nouvelle page)
- **Impact** : Differenciant vs concurrents basiques

### F16. Integration Google Reviews automatisee
- **Description** : Apres le scan, prompt automatique "Laissez un avis Google ?"
- Lien direct vers la page Google du commerce
- Points bonus pour l'avis (+2 points)
- Dashboard : suivi des avis generes via Qarte
- **Effort** : 1-2 jours (Google Place API, tracking, UI)
- **Impact** : Value prop #2 de Qarte deja sur le landing, mais pas encore automatisee

### F17. Apple Wallet / Google Wallet pass
- **Description** : Generer un pass de fidelite installable dans Wallet natif
- Mise a jour automatique du nombre de points
- Push native via le pass
- **Effort** : 2-3 jours (pkpass generation, Google Pay API, webhook updates)
- **Impact** : Premium feature, meilleure visibilite que PWA
- **Inspiration** : Stamp Me, Belly

### F18. API publique + Webhooks
- **Description** : API REST documentee pour integrations tierces
- Webhooks : new_customer, new_visit, reward_redeemed
- Cas d'usage : CRM, Zapier, caisse enregistreuse
- **Effort** : 3 jours (API design, auth, docs, webhook system)
- **Impact** : Ouvre l'ecosysteme, attire les developers/agences

### F19. Booking leger (prise de RDV simplifiee)
- **Description** : Calendrier basique integre a Qarte
- Client prend RDV depuis sa carte de fidelite
- Merchant voit les creneaux dans le dashboard
- Push rappel J-1
- **Effort** : 3-5 jours (calendar UI, disponibilites, notifications)
- **Impact** : Feature la plus demandee dans la beauty tech (Treatwell, Fresha, Planity)
- **Note** : Peut commencer par integration Calendly/Cal.com plutot que build from scratch

### F20. Tiered pricing (Starter/Pro/Enterprise)
- **Description** :
  - **Starter** (gratuit) : 30 clients, 1 recompense, pas de push
  - **Pro** (19€/mois) : illimite, toutes features
  - **Business** (39€/mois) : multi-location, analytics avance, API, support prio
- **Effort** : 2-3 jours (Stripe products, feature gating, UI)
- **Impact** : Capture le marche freemium + upsell les gros merchants

---

# PARTIE 3 : MICRO-SAAS CROSS — Idees dans la Beauty Tech

## Idee 1 : **ReviewBoost** — Collecteur d'avis Google pour commerces
- **Concept** : SaaS standalone pour generer des avis Google 5 etoiles
- QR code en caisse → formulaire "Comment etait votre experience ?"
  - Si positif → redirection Google Reviews
  - Si negatif → formulaire interne (evite l'avis negatif public)
- Dashboard : suivi des avis, taux de conversion, score Google
- **Pricing** : 9€/mois
- **Synergie Qarte** : Peut etre un module addon ou un produit autonome
- **Effort** : 1-2 semaines (landing + formulaire + tracking + dashboard)
- **TAM** : Tous les commerces physiques (pas juste beauty)

## Idee 2 : **BeautyMenu** — Menu digital pour instituts
- **Concept** : QR code → carte des prestations avec prix, photos, descriptions
- Equivalent de "menu QR" pour restaurants mais pour beauty/wellness
- Booking integre (Cal.com embed)
- Partage social des prestations
- **Pricing** : 12€/mois
- **Synergie Qarte** : Cross-sell avec programme fidelite
- **Effort** : 2 semaines
- **TAM** : 100k+ salons/instituts en France

## Idee 3 : **BeautyKit** — Generateur de contenu social pour salons
- **Concept** : SaaS qui genere automatiquement des posts Instagram/TikTok
- Templates de stories/posts pre-designes
- Upload photo avant/apres → post pret a publier
- Calendrier editorial beauty (saint-valentin, ete, fetes...)
- IA pour generer les captions
- **Pricing** : 15€/mois
- **Synergie Qarte** : Le Social Kit email existe deja, l'etendre en produit
- **Effort** : 3-4 semaines
- **TAM** : Enorme, tous les pros beauty actifs sur Instagram

## Idee 4 : **WaitlistApp** — Gestion de file d'attente sans RDV
- **Concept** : Pour les salons sans rendez-vous (barbershops, nail bars walk-in)
- Client scanne QR → rejoint la file d'attente digitale
- Notification push quand c'est son tour
- Temps d'attente estime en temps reel
- **Pricing** : 14€/mois
- **Synergie Qarte** : Combo waitlist + fidelite = bundle 29€
- **Effort** : 2-3 semaines
- **TAM** : Barbershops, walk-in salons

## Idee 5 : **BeautyPay** — Micro-paiement pour pourboires digitaux
- **Concept** : QR code en caisse → le client laisse un pourboire digital
- Integre Stripe Connect pour redistribuer aux employes
- Analytics pourboires par employe/semaine
- **Pricing** : 2% commission par transaction
- **Synergie Qarte** : Scan fidelite + pourboire en un geste
- **Effort** : 2-3 semaines
- **TAM** : Tout commerce avec employes (coiffeurs, serveurs, estheticiennes)

## Idee 6 : **StaffBoard** — Planning employes pour petits salons
- **Concept** : Planning drag & drop pour 2-10 employes
- Vue semaine/mois, conges, heures sup
- Notification push/SMS rappel de shift
- Export paie
- **Pricing** : 9€/mois (jusqu'a 5 employes), 19€/mois (10+)
- **Synergie Qarte** : Bundle "gestion complete salon"
- **Effort** : 3-4 semaines
- **TAM** : Petits salons qui utilisent encore WhatsApp/papier pour le planning

---

# PARTIE 4 : MATRICE DE PRIORISATION

## Features — Impact vs Effort

| # | Feature | Effort | Impact Conv. | Impact Retention | Priorite |
|---|---------|--------|-------------|-----------------|----------|
| F1 | Presets recompense | 1-2h | ★★★★★ | ★★ | **P0** |
| F2 | Email QR code auto | 1-2h | ★★★★ | ★★★ | **P0** |
| F3 | Celebration 1er scan | 1h | ★★★ | ★★★ | **P0** |
| F5 | Bouton partage | 2-3h | ★★★ | ★★ | **P1** |
| F6 | Templates push | 2h | ★★ | ★★★★ | **P1** |
| F4 | Stats carte client | 2h | ★★ | ★★★ | **P1** |
| F7 | Checklist gamifiee | 4h | ★★★★★ | ★★★ | **P1** |
| F8 | Birthday Club | 6h | ★★★ | ★★★★★ | **P1** |
| F10 | Scratch & Win | 6h | ★★ | ★★★★★ | **P2** |
| F9 | Parrainage | 6-8h | ★★★★ | ★★★ | **P2** |
| F11 | Mode articles | 4-5h | ★★ | ★★★ | **P2** |
| F12 | Export CSV/PDF | 5h | ★ | ★★★ | **P2** |
| F16 | Google Reviews auto | 1-2j | ★★★★ | ★★★★ | **P2** |
| F13 | Push geolocalisee | 6-8h | ★★ | ★★★★ | **P3** |
| F15 | Analytics avance | 2j | ★★ | ★★★★ | **P3** |
| F17 | Apple/Google Wallet | 2-3j | ★★★ | ★★★★ | **P3** |
| F14 | Multi-location | 2-3j | ★★★★ | ★★★ | **P3** |
| F20 | Tiered pricing | 2-3j | ★★★★★ | ★★★ | **P3** |
| F18 | API publique | 3j | ★★★ | ★★ | **P4** |
| F19 | Booking leger | 3-5j | ★★★★ | ★★★★ | **P4** |

## Micro-SaaS — Classement

| # | Idee | Effort Dev | Synergie Qarte | TAM | Priorite |
|---|------|-----------|----------------|-----|----------|
| 1 | ReviewBoost | 1-2 sem | ★★★★ | ★★★★★ | **#1** |
| 2 | BeautyMenu | 2 sem | ★★★★ | ★★★★ | **#2** |
| 4 | WaitlistApp | 2-3 sem | ★★★★ | ★★★ | **#3** |
| 5 | BeautyPay | 2-3 sem | ★★★ | ★★★★ | **#4** |
| 3 | BeautyKit | 3-4 sem | ★★★ | ★★★★★ | **#5** |
| 6 | StaffBoard | 3-4 sem | ★★ | ★★★ | **#6** |

---

# PARTIE 5 : PLAN D'ACTION — 30 PROCHAINS JOURS

## Semaine 1 (10-16 fev)
- [ ] **F1** : Presets recompense par metier (1-2h)
- [ ] **F2** : Email QR code auto post-setup (1-2h)
- [ ] **F3** : Celebration premier scan (1h)
- [ ] Creer les coupons Stripe : `QARTEBOOST` (2 mois -10€) et `QARTELAST` (3 mois -10€)
- [ ] Implementer le plan admin merchants (barre actions, badges alerte, WhatsApp)

## Semaine 2 (17-23 fev)
- [ ] **F7** : Onboarding checklist gamifiee (4h)
- [ ] **F5** : Bouton partage programme (2-3h)
- [ ] **F6** : Templates push enrichis (2h)
- [ ] **F4** : Stats enrichies carte client (2h)

## Semaine 3 (24 fev - 2 mars)
- [ ] **F8** : Birthday Club (6h)
- [ ] **F9** : Programme parrainage (6-8h)
- [ ] Analyse des metriques de conversion trial → paid (implementer tracking)

## Semaine 4 (3-9 mars)
- [ ] **F10** : Scratch & Win gamification (6h)
- [ ] **F16** : Google Reviews automatise (1-2j)
- [ ] Demarrer prototype **ReviewBoost** (micro-SaaS #1)

---

# RAPPELS IMPORTANTS

## Coupons Stripe a creer
- `QARTE50` : -10€ premier mois (deja cree)
- `QARTEBOOST` : -10€/mois pendant 2 mois → **A CREER SUR STRIPE**
- `QARTELAST` : -10€/mois pendant 3 mois → **A CREER SUR STRIPE**

## KPIs a suivre
1. **Taux de completion setup** (signup → programme configure)
2. **Time to first scan** (signup → premier scan client)
3. **Trial-to-paid conversion rate** (essais → abonnes)
4. **30-day merchant retention** (abonnes qui restent apres 1 mois)
5. **Monthly churn rate** (% de merchants qui annulent)
6. **MRR growth** (revenus recurrents mensuels)

---

*Document genere le 09/02/2026 — Audit realise par analyse complete du codebase, emails, APIs, dashboard, landing page, et recherche competitive (Treatwell, Fresha, Square, Planity, Stamp Me, Zenoti, GlossGenius).*
