# Qarte — Plan Marketing & Acquisition
## Objectif : 0 → 100 → 250 → 500 → 1000 merchants
## Fevrier 2026

---

# PARTIE 1 : AUDIT CMO — Ce qui bloque la croissance

**Score marketing actuel : 59/100** — bon produit, marketing faible.

**Forces** : Pricing agressif (19€ vs 43-74€ concurrents), UX excellente (auto-login, confetti, Shield anti-fraude), 29 emails automatises, PWA sans app, niche beaute claire.

**Faiblesses** : Temoignages fictifs, pas de video, social proof non verifiable, pas de blog SEO, pas de comparaison concurrents, funnel pas mesure (GTM inactif).

## Problemes critiques

| # | Probleme | Impact | Action |
|---|----------|--------|--------|
| 1 | **Temoignages fictifs** (photos Unsplash, noms generiques) | Tue la confiance si decouvert | Remplacer par vrais clients ou retirer |
| 2 | **Pas de video** (landing, demo, onboarding) | -30% conversion vs landing avec video | Enregistrer video 60s explainer |
| 3 | ~~**Social proof non verifiable** (150+ instituts, 4.9/5)~~ | ~~Sonne creux sans lien externe~~ | **✅ RETIRE** — faux chiffres supprimes du hero (11 fev) |
| 4 | **Pas de comparaison concurrents** | Prospect ne sait pas pourquoi Qarte | Creer tableau comparatif |
| 5 | ~~**Pas de blog/SEO**~~ | ~~0 trafic organique~~ | ✅ Blog cree avec 3 articles SEO (coiffure, onglerie, institut) |
| 6 | **GTM pas active** | Funnel pas mesurable | Activer GTM + GA4 complet |

## Problemes secondaires

| # | Probleme | Action |
|---|----------|--------|
| 7 | Pas de heatmap (Hotjar/Clarity) | Installer pour comprendre le comportement |
| 8 | ~~Pas de structured data SEO (JSON-LD)~~ | ✅ Organization + SoftwareApplication schema ajoutes (layout.tsx) |
| 9 | ~~Pas de FAQ pricing ("c'est trop cher")~~ | ✅ FAQ "19€/mois trop cher ?" + "RGPD" ajoutees |
| 10 | ~~Pas de garantie satisfait-ou-rembourse~~ | ✅ Badge "Satisfait ou rembourse 30j" ajoute |
| 11 | ~~Countdown ebook reset quotidien~~ | ✅ UrgencyBanner retire (ebook/page.tsx) |
| 12 | Pas d'exit-intent popup | Ajouter offre derniere chance |

---

# PARTIE 2 : PLAN D'ACQUISITION PAR PALIER

## Phase 1 : 0 → 100 merchants (3-6 mois)
**Strategie : Hustle fondateur + paid ads cibles**

### Canaux

| Canal | Part | Budget/mois | Detail |
|-------|------|-------------|--------|
| **Demarchage terrain** | 50% | Temps fondateur | 5-10 signups/semaine, 3-5 villes, script "1 mois offert" |
| **Facebook/Instagram Ads** | 30% | 500-800€ | Audience beaute 25-55 ans, video avant/apres, landing `/essai-gratuit` |
| **Google Ads** | 20% | 300-500€ | "carte fidelite coiffeur", "programme fidelite salon beaute" |

### Actions produit
- [ ] Remplacer temoignages fictifs par vrais (ou retirer)
- [x] ~~Adapter social proof aux vrais chiffres~~ — retire du hero (11 fev)
- [ ] Enregistrer 1 video temoignage client (30s)
- [ ] Activer GTM + GA4 + Hotjar
- [x] ~~Creer page `/qarte-vs-carte-papier` (SEO)~~ — fait
- [x] ~~Ajouter FAQ pricing + RGPD~~ — fait
- [ ] Installer Trustpilot ou Google Reviews widget

### KPIs
| Metrique | Cible |
|----------|-------|
| Signups trial/mois | 40-60 |
| Trial → Paid | 20-25% |
| MRR a 100 merchants | ~1,900€ |
| CAC moyen | < 50€ |
| Churn mensuel | < 5% |

---

## Phase 2 : 100 → 250 merchants (6-12 mois)
**Strategie : Repliquer + referral + contenu**

### Canaux

| Canal | Part | Budget/mois | Detail |
|-------|------|-------------|--------|
| **Parrainage merchant amplifie** | 20% | 0€ (-10€ chacun) | ✅ Encart parrainage ajoute dans 9 emails (FirstScan, FirstReward, WeeklyDigest, SubConfirmed, SubReactivated, Day5, SocialKit, Tier2Upsell, QRCode). Reward : -10€ chacun. |
| **Facebook Ads optimises** | 40% | 1,000-1,500€ | Lookalike audience sur 100 premiers, retargeting abandons, vrais temoignages video |
| **Blog SEO** | 25% | 200€ (redacteur) | 4 articles/mois, SEO local (/carte-fidelite-paris, /carte-fidelite-lyon) |
| **Partenariats distributeurs** | 15% | 0€ | Grossistes coiffure (L'Oreal Pro, Wella), newsletters partenaires |

### Actions produit
- [ ] **Birthday Club** — table stakes, tous les concurrents l'ont
- [x] ~~**Referral client→client**~~ — ✅ Programme parrainage complet (APIs, scan ?ref=, carte client, dashboard /referrals)
- [ ] **Segmentation push** — cibler "inactifs 30j", "VIP 10+ visites"
- [ ] **Apple/Google Wallet pass** — gros differenciateur sans app
- [ ] Video demo interactive sur `/demo`
- [ ] 3 vrais temoignages video sur la landing

### KPIs
| Metrique | Cible |
|----------|-------|
| Signups trial/mois | 60-80 |
| Trial → Paid | 25-30% |
| MRR a 250 merchants | ~4,750€ |
| % via referral | 20% |
| Churn mensuel | < 4% |
| CAC moyen | < 40€ |

---

## Phase 3 : 250 → 500 merchants (12-18 mois)
**Strategie : SEO organique + events + tiered pricing**

### Canaux

| Canal | Part | Budget/mois | Detail |
|-------|------|-------------|--------|
| **SEO organique** | 30%+ | 500€ (contenu) | Blog 30+ articles, 10 pages villes, backlinks blogs beaute |
| **Evenements beaute** | 15% | 2,000-5,000€/event | Salon MCB Paris, Cosmoprof, demo live + offre exclusive |
| **Partenariats POS/booking** | 20% | 0€ (co-marketing) | Planity, Treatwell, Booksy — "Ajoutez la fidelite a vos RDV" |
| **Influenceurs beaute B2B** | 10% | 200-500€/influenceur | Micro-influenceurs 5-50k, format "Je teste Qarte 30 jours" |
| **Paid ads** | 25% | 2,000-3,000€ | Audiences matures, ROAS optimise |

### Actions produit
- [ ] **Tiered pricing** : Starter gratuit (30 clients) + Pro 19€ + Business 39€
- [ ] **Multi-location** (2+ salons = meme carte)
- [ ] **Analytics avance** (retention, CLV, heatmap horaire)
- [ ] **Google Reviews automatise** (scan → prompt avis)
- [ ] **Scratch & Win** gamification
- [ ] Export CSV/PDF

### KPIs
| Metrique | Cible |
|----------|-------|
| Signups trial/mois | 80-120 |
| % organique | 30%+ |
| MRR a 500 merchants | ~9,500€ |
| ARPU | ~22€ (mix free+pro+business) |
| Churn mensuel | < 3% |

---

## Phase 4 : 500 → 1000 merchants (18-30 mois)
**Strategie : Effet reseau + produit viral + expansion**

### Canaux

| Canal | Detail |
|-------|--------|
| **Effet reseau viral** | Marketplace locale "Programmes fidelite pres de chez vous". Chaque merchant genere 50-200 scanners qui decouvrent d'autres commerces. |
| **Expansion geographique** | BE/CH/LU (deja supporte). Adapter landing + ads par pays. |
| **Programme ambassadeur** | Top merchants temoignent dans ads/events/webinaires. 1 mois gratuit par filleul. |
| **Inside sales** | 1 commercial dedie. Focus chains 2-5 salons (plan Business). 20 signups/mois. |
| **WhatsApp Business API** | Notifications fidelite (98% taux ouverture). Upsell merchants. |

### Actions produit
- [ ] **Marketplace locale** (decouverte cross-merchant)
- [ ] **AI campaign suggestions** ("Envoyez un push vendredi 17h")
- [ ] **WhatsApp integration** (notifications fidelite)
- [ ] **API publique + webhooks** (integrations tierces)
- [ ] **Booking leger** (prise de RDV integree)

### KPIs
| Metrique | Cible |
|----------|-------|
| Signups trial/mois | 120-180 |
| MRR a 1000 merchants | ~22,000€ |
| ARR | ~264,000€ |
| % organique + referral | 50%+ |
| Churn mensuel | < 2.5% |
| LTV/CAC ratio | > 5:1 |

---

# PARTIE 3 : FEATURES "WAOUH" SANS APP NATIVE

## Tier 1 — Game changers (faire maintenant)

| # | Feature | Pourquoi c'est waouh | Effort | Impact |
|---|---------|---------------------|--------|--------|
| 1 | **Apple/Google Wallet Pass** | Carte sur ecran de verrouillage. Push natives. Zero friction. Aucun concurrent FR ne le fait bien. | 2-3j | ★★★★★ |
| 2 | **Scratch & Win** | Ticket a gratter digital apres X visites. Recompense aleatoire. +35% engagement. Effet dopamine. | 4-6h | ★★★★★ |
| 3 | **Birthday Club auto** | Date de naissance au scan → push/email auto le jour J. 481% taux transaction vs email standard. | 6h | ★★★★ |
| 4 | **Referral client→client** | "Parrainez une amie → 5 points bonus chacune". Clients referres depensent 200% plus. Boucle virale. | 4-6h | ★★★★ |
| 5 | **Google Reviews auto** | Prompt "Laissez un avis" apres 3+ visites. Points bonus. Double valeur : fidelite + reputation. | 1-2j | ★★★★ |

## Tier 2 — Differenciateurs (3-6 mois)

| # | Feature | Pourquoi c'est waouh | Effort | Impact |
|---|---------|---------------------|--------|--------|
| 6 | **Badges, streaks, challenges** | "3 visites cette semaine = badge Habituee". Mecanique Duolingo. Leaderboard optionnel. | 2-3j | ★★★★ |
| 7 | **AI Campaign Suggestions** | "Vos clientes viennent le samedi → push vendredi 17h". Timing optimal automatique. | 2-3j | ★★★★ |
| 8 | **Segmentation push** | Cibler "inactives 30j", "VIP 10+", "nouvelles". Push personnalise par segment. | 1j | ★★★ |
| 9 | **Instagram Story templates** | Templates animes prets a poster. 1 tap → partage. QR code integre. | 1-2j | ★★★ |
| 10 | **Offline mode PWA** | Carte visible sans internet. Queue check-ins offline, sync au retour. | 2j | ★★★ |

## Tier 3 — Premium / upsell (6-12 mois)

| # | Feature | Pourquoi c'est waouh | Effort | Impact |
|---|---------|---------------------|--------|--------|
| 11 | **WhatsApp notifications** | 98% taux ouverture. Points et offres recus sur WhatsApp. | 3-5j | ★★★★ |
| 12 | **Receipt scanning (OCR)** | Photo ticket de caisse → points auto. Pas besoin de QR. | 3-5j | ★★★ |
| 13 | **Marketplace locale** | "Programmes pres de chez vous". Decouverte cross-merchant. Effet reseau. | 1-2 sem | ★★★★ |
| 14 | **Multi-location** | 1 carte valable dans tous les salons d'une chaine. Dashboard consolide. | 2-3j | ★★★ |
| 15 | **Booking leger** | Prise de RDV depuis la carte. Push rappel J-1. | 3-5j | ★★★ |

## Limites PWA (pas faisable sans app native)
- ❌ **Geofencing** — push quand le client passe devant le salon
- ❌ **NFC tap natif** — uniquement via Apple/Google Wallet pass
- ⚠️ **Background sync continu** — limite en PWA

---

# PARTIE 4 : ANALYSE CONCURRENTIELLE

## Positionnement prix

| Concurrent | Prix/mois | Cible | Force | Faiblesse |
|-----------|-----------|-------|-------|-----------|
| **Qarte** | **19€** | Beaute FR | Prix, UX, anti-fraude | Pas de birthday, pas de wallet |
| Stamp Me | 43-74€ | Beaute global | Features completes | Cher, necessite app |
| Square Loyalty | 45€ + fees | General | Integration POS native | Pricing par client, complexe |
| LoyalZoo | 47€ | PME general | Multi-POS (Clover, Lightspeed) | Pas de niche beaute |
| FiveStars | Premium | Beaute/food | Marketing avance | Tres cher |
| Zerosix | N/C | Resto/retail FR | POS integration | Pas niche beaute |
| Fidme | Gratuit (consumer) | Consommateurs | 6M users, agregateur | B2C seulement |

## Gap analysis

| Feature | Qarte | Stamp Me | Square | FiveStars | LoyalZoo |
|---------|-------|----------|--------|-----------|----------|
| QR Check-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-login retour | ✅ | ❌ | ❌ | ❌ | ❌ |
| Anti-fraude (Shield) | ✅ | ❌ | ✅ | ✅ | ❌ |
| 2 paliers recompenses | ✅ | ❌ | ✅ | ✅ | ❌ |
| Push notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Push programmees | ✅ | ❌ | ✅ | ✅ | ❌ |
| Birthday auto | ❌ | ✅ | ✅ | ✅ | ✅ |
| Referral client | ✅ | ✅ | ✅ | ✅ | ✅ |
| Segmentation push | ❌ | ✅ | ✅ | ✅ | ✅ |
| Apple/Google Wallet | ❌ | ✅ | ✅ | ✅ | ✅ |
| Analytics avance | ❌ | ✅ | ✅ | ✅ | ✅ |
| Multi-location | ❌ | ✅ | ✅ | ✅ | ✅ |
| POS integration | ❌ | ✅ | ✅ (natif) | ✅ | ✅ |
| Pas d'app requise | ✅ | ❌ | ❌ | ❌ | ❌ |

**Avantage unique Qarte** : **Pas d'app a telecharger** + **prix 2-4x moins cher** + **anti-fraude Shield** + **auto-login**

---

# PARTIE 5 : BUDGET & PROJECTIONS

## Budget mensuel par phase

| Phase | Ads | Contenu | Events | Tools | Total/mois |
|-------|-----|---------|--------|-------|------------|
| 0→100 | 800-1,300€ | 0€ | 0€ | 50€ | **~1,350€** |
| 100→250 | 1,500-2,000€ | 200€ | 0€ | 100€ | **~2,300€** |
| 250→500 | 2,000-3,000€ | 500€ | 500€ | 200€ | **~4,200€** |
| 500→1000 | 3,000-5,000€ | 1,000€ | 1,000€ | 500€ | **~7,500€** |

## Projections financieres

| Palier | MRR | ARR | CAC | LTV (12m) | LTV/CAC |
|--------|-----|-----|-----|-----------|---------|
| 100 | 1,900€ | 22,800€ | 50€ | 228€ | 4.6x |
| 250 | 4,750€ | 57,000€ | 40€ | 228€ | 5.7x |
| 500 | 9,500€ | 114,000€ | 35€ | 264€ | 7.5x |
| 1000 | 22,000€ | 264,000€ | 30€ | 264€ | 8.8x |

## Timeline realiste

| Palier | Delai estime | Strategie dominante |
|--------|-------------|---------------------|
| 0 → 100 | 3-6 mois | Hustle terrain + paid ads |
| 100 → 250 | 6-12 mois | Referral + ads lookalike + blog SEO |
| 250 → 500 | 12-18 mois | SEO organique + events + tiered pricing |
| 500 → 1000 | 18-30 mois | Effet reseau + expansion geo + inside sales |

---

# PARTIE 6 : ACTIONS IMMEDIATES

## Cette semaine — Marketing
1. [ ] Remplacer temoignages fictifs par vrais clients OU retirer
2. [x] ~~Adapter social proof aux chiffres reels~~ — faux chiffres retires du hero (11 fev)
3. [ ] Activer GTM + GA4 complet
4. [x] ~~Ajouter FAQ "C'est trop cher" + "RGPD"~~ — fait (FAQSection.tsx)

## Cette semaine — Produit
6. [x] ~~Celebration premier scan (F3)~~ — doublon avec OnboardingChecklist, retiré
7. [x] ~~Page `/qarte-vs-carte-papier`~~ — fait (page.tsx + layout.tsx + sitemap)
8. [x] ~~Structured data JSON-LD~~ — fait (layout.tsx)
9. [x] ~~Badge "Satisfait ou rembourse 30 jours" sur pricing~~ — fait (PricingSection.tsx)

## Cette semaine — Acquisition
10. [ ] Lister 50 salons a demarcher en local
11. [ ] Preparer script demarchage + offre "1 mois offert"
12. [ ] Configurer Facebook Ads (audience + creative)

---

*Audit CMO realise le 10 fevrier 2026.*
*Sources : analyse codebase Qarte, recherche concurrentielle (Stamp Me, Square, FiveStars, LoyalZoo, Zerosix, Fidme), benchmarks B2B SaaS 2025-2026.*
