# Qarte — Checklist de Verification Periodique

---

## Quotidien (automatique via crons)

Les 3 crons tournent deja — verifier qu'ils ne fail pas :

- [ ] `/api/cron/morning` (09:00 UTC) — emails trial, push 10h, vouchers anniversaire
- [ ] `/api/cron/evening` (17:00 UTC) — push 18h
- [ ] `/api/cron/reactivation` (10:00 UTC) — win-back

**Comment verifier** : Vercel Functions logs ou `/admin` pour voir si les emails partent.

---

## Hebdomadaire (~10 min)

### 1. Parcours scan complet

- [ ] Scanner le QR d'un merchant test
- [ ] Entrer un numero → verifier que le passage s'enregistre
- [ ] En mode cagnotte : verifier la saisie montant + calcul cashback
- [ ] Verifier la page de succes (animation, compteur, redirection)

### 2. Redeem + Annulation

- [ ] Atteindre le seuil de recompense → reclamer
- [ ] Verifier le reset (stamps + amount en cagnotte)
- [ ] Annuler la recompense → verifier la restauration

### 3. Dashboard merchant

- [ ] Ouvrir un client → onglets Points, Historique, Cadeaux, Danger
- [ ] Ajuster des points → verifier l'historique (`point_adjustments`)
- [ ] Verifier les stats (graphiques, compteurs)

### 4. Stripe

- [ ] Verifier dans `/admin` que les statuts sont coherents (trial, active, canceling)
- [ ] Verifier qu'un merchant en trial voit bien le countdown
- [ ] Tester le portail Stripe (`/dashboard/subscription`)

### 5. Emails & Push

- [ ] Verifier dans Resend dashboard que les emails partent (pas de bounce spike)
- [ ] Tester un envoi push notification manuelle

---

## Mensuel (~30 min)

### 6. Inscription complete

- [ ] Creer un nouveau compte merchant (signup phase 1 + 2)
- [ ] Configurer le programme (couleurs, recompense, paliers)
- [ ] Telecharger le QR code
- [ ] Verifier les emails d'onboarding (welcome, QR, rappels)

### 7. Parcours client complet

- [ ] Nouveau client : scan → inscription → carte dans wallet
- [ ] Parrainage : utiliser un code referral → verifier les vouchers (filleul + parrain)
- [ ] Anniversaire : renseigner une date → verifier la sauvegarde
- [ ] Avis Google : verifier le flow ReviewModal

### 8. Modes fidelite

- [ ] **Passage** : scan, jours x2, palier 1, palier 2, redeem, annulation
- [ ] **Cagnotte** : scan + montant, cumul, cashback %, redeem, annulation
- [ ] **Switch** : passer de passage → cagnotte, verifier que les cartes existantes persistent

### 9. Shield anti-fraude

- [ ] Scanner 2x le meme client en < 3 min → verifier la quarantaine
- [ ] Valider/rejeter depuis le dashboard → verifier le resultat

### 10. Securite

- [ ] Verifier que `/scan/[code]` n'apparait nulle part en public (page `/p/[slug]`, landing)
- [ ] Tester un acces dashboard sans auth → redirection login
- [ ] Tester un acces admin sans etre super_admin → 403

### 11. Stripe webhooks

- [ ] Verifier dans Stripe Dashboard > Webhooks que le taux de succes est > 99%
- [ ] Verifier les 5 events : checkout.completed, sub.updated, sub.deleted, invoice.failed, invoice.succeeded

### 12. Supabase

- [ ] Verifier les RLS policies (pas de table ouverte en public)
- [ ] Verifier l'espace disque / connexions dans le dashboard Supabase
- [ ] Verifier que les migrations sont a jour (51 migrations)

---

## Trimestriel

### 13. Pages legales & SEO

- [ ] Verifier CGV, mentions legales, politique de confidentialite
- [ ] Verifier le sitemap (`/sitemap.xml`) — 9 pages
- [ ] Tester les meta tags / JSON-LD (Organization + SoftwareApplication)

### 14. Analytics

- [ ] GTM, GA4, Facebook Pixel, TikTok Pixel, Clarity — verifier que les events remontent
- [ ] Facebook CAPI — verifier les Purchase server-side dans Events Manager

### 15. Performance

- [ ] Lighthouse sur landing, scan, wallet
- [ ] Verifier les Vercel Function durations (pas de timeout)
- [ ] Verifier la latence Supabase (queries lentes)
