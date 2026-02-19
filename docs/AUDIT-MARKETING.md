# AUDIT MARKETING — Qarte SaaS

**Score : 67/100** — Produit solide, marketing embryonnaire

---

## Ce qui va bien

- UX onboarding excellente (2 phases, linéaire, sans friction)
- Email lifecycle sophistiqué (32 templates, anti-churn, segmentation shop_type)
- Prix ultra compétitif (19€ vs 43-74€ concurrents)
- Produit zéro-friction (pas d'app, scan QR = instant)
- Anti-fraude Shield (unique en FR)
- Parrainage client intégré (viral loop)
- PWA merchant installable
- SEO metadata + JSON-LD (Organization + SoftwareApplication)

---

## Corrections faisables en local

### Semaine 1 — P0 Trust & Crédibilité

- [ ] **Supprimer fake ratings** (15min)
  - `/ebook` : retirer "4.9/5 basé sur 97 avis"
  - Hero : retirer badge flottant "4.9/5 Google +120 avis"

- [ ] **Exit-intent popup** (2h)
  - Popup sur landing : "7 jours gratuits — Essayez sans carte bancaire"

### Semaine 2 — P1 Landing & Copy

- [ ] **Hero : ajouter pain points** (1h)
  - Sous le headline : "73% des cartes papier sont perdues", "Pas d'app = 10x plus d'adoption"

- [ ] **Referral : ajouter exemple concret** (30min)
  - "Sophie invite Lisa → Lisa reçoit 5 tampons, Sophie aussi"

- [ ] **Pricing : ajouter comparatif prix** (30min)
  - Footnote : "Stamp Me 43€, Square 45€+ → Qarte 19€"

- [ ] **Essai gratuit page : reformuler copy** (1h)
  - Pain points + stats + CTA clair

- [ ] **Ebook page : retirer social proof fake** (30min)
  - Garder "+120 lecteurs", retirer les étoiles

### Semaine 3 — P1 SEO

- [ ] **Blog : enrichir 3 articles** (2 semaines)
  - 1500 → 3000 mots, internal links, images, FAQ schema

- [ ] **Article + FAQ schema JSON-LD** (2h)
  - Ajouter sur chaque blog post + landing FAQ

- [ ] **Keywords manquants** (1h)
  - Ajouter metadata keywords sur `/essai-gratuit` et `/ebook`

- [ ] **BreadcrumbList blog** (1h)
  - Ajouter sur les articles blog

---

## Nécessite intervention externe

### Contenu à créer (video, témoignages)

- [ ] **Video hero 60s** (4h)
  - Screen recording : clic QR → carte charge → notif push
  - Impact : conversion +15%

- [ ] **Vérifier témoignages** (2h)
  - Contacter Lunzia Studio, Doux Regard, Nour Beauté, La Canopée des Sens
  - Si vrais → ajouter logos/sites. Si faux → remplacer par génériques

- [ ] **3-5 video témoignages** (1 semaine)
  - 30s chacun, vrais merchants payants

### Analytics (GTM, GA4, Facebook Pixel)

- [ ] **Activer GTM tags** (6h)
  - GTM-T5Z84DPV : Page View, CTA Click, Scroll Depth, Form Submit

- [ ] **GA4 conversion goals** (4h)
  - Funnel : landing → signup → phase 2 → config → first scan → paid

- [ ] **Facebook Pixel complet** (3h)
  - Lead event sur `/essai-gratuit`
  - Purchase event server-side (Conversions API sur Stripe webhook)
  - Audiences : visitors, trial, paid (lookalike)

### SEO long terme (mois 2+)

- [ ] **3-4 landing pages locales** (3 jours)
  - `/blog/carte-fidelite-coiffure-paris`, Lyon, Marseille

- [ ] **10-15 articles long-tail** (6 semaines)
  - "Comment fidéliser salon coiffure", "Programme fidélité institut beauté 2026"

- [ ] **Backlinks** (4 semaines)
  - Outreach 50 blogs beauté FR

### Email gaps (code + stratégie)

- [ ] **Email anniversaire merchant** (2h)
  - 30j, 90j, 365j payant — célébration + upsell

- [ ] **Email "activité en baisse"** (2h)
  - Alerte si scans drop >50% vs mois précédent

- [ ] **Email "abonné inactif"** (2h)
  - Séquence spéciale pour payants avec 0 scans 14j/30j

---

*Audit effectué le 19 février 2026*
