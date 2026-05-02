# Avantages pro — spec page dashboard (à reprendre plus tard)

Page mise en pause le 2026-05-02. Code de la 1re version supprimé pour ne pas polluer l'arborescence — re-création prévue quand on aura validé les premières marques partenaires.

## Concept

Page `/dashboard/avantages` qui présente aux marchandes Qarte les promotions négociées avec les marques pro beauté (réductions permanentes type -5% à -25% sur les commandes de stock). Différenciateur Qarte vs Planity/Booksy : on est aussi un buyer's club pour le merchant.

Réservé aux abonnés actifs (Fidélité ou Tout-en-un). Lancement annoncé le 1er juin 2026.

## Voice & ton (Qarte brand)

- Tutoiement merchant
- Phrases courtes, zéro jargon
- Pas d'emoji
- Ton aspirationnel + crédible : "on négocie déjà", pas "on fera"

## Structure UI proposée

1. **Hero gradient violet** (`from-[#4b0082] via-violet-700 to-violet-800`)
   - Pill "Réservé aux abonnés Qarte" + icône Sparkles
   - H1 : "Tes marques préférées te font des prix."
   - Sub : "Qarte négocie avec les marques pro beauté que tu utilises déjà. Tu commandes ton stock chez elles, tu paies moins cher. Sans rien changer à tes habitudes."
   - CTA fantôme blanc : "Me prévenir au lancement" → toggle opt-in

2. **Card "Première vague" (emerald, J-30 countdown)**
   - Badge "Lancement" + pill J-N en emerald-500
   - "Premières offres dans quelques semaines."
   - Sub : "On finalise les négociations avec les premières marques. Lancement le 1er juin 2026."

3. **Wall of brands** — grid 2 cols mobile / 4 cols desktop
   - 8 cards `rounded-xl border border-gray-100 shadow-sm p-4`
   - Monogramme typo (initiales) sur fond pastel rotatif (rose / cyan / emerald / violet / amber / pink)
   - Pas de logos officiels (évite trademark + harmonie visuelle)
   - Pour chaque card : nom marque, catégorie en meta, origine pays, pill "Offre à venir" amber avec spinner

   **Sélection 8 marques** (mix lash/nails/skin/spa/coiffure, toutes indé/spécialisées, **pas** L'Oréal/Estée Lauder etc.) :
   - Elyamaje (Extensions cils, France) — accent rose
   - Mavala (Vernis pro, Suisse) — accent cyan
   - Mesoestetic (Cosméceutique, Espagne) — accent emerald
   - Yon-Ka (Soins botaniques, France) — accent violet
   - Cinq Mondes (Spa premium, France) — accent amber
   - Codage Paris (Soins sur-mesure, France) — accent pink
   - Comfort Zone (Institut, Italie) — accent rose
   - Davines (Coiffure éthique, Italie) — accent cyan

4. **Section "Comment ça marche"** (`bg-gray-50 rounded-2xl`, 3 steps inline)
   - Step 1 : "On négocie" — Chaque marque accepte un prix Qarte exclusif pour toi.
   - Step 2 : "Tu reçois ton code" — Dispo ici dès qu'une offre est validée. Notification push si activée.
   - Step 3 : "Tu commandes" — Directement sur le site de la marque, prix réduit appliqué.
   - Numéros 1/2/3 dans cercles violet `#4b0082` text-white

5. **Card "Suggérer une marque"**
   - "Une marque qu'on devrait contacter ? Dis-nous laquelle. Si plusieurs pros la demandent, elle remonte en haut de notre liste."
   - Form : nom marque + raison (textarea optional)
   - Submit → mailto fallback vers sales@getqarte.com (en attendant un endpoint dédié)

6. **Footer disclaimer** centré, gris discret
   - "Avantages réservés aux abonnés Qarte (Fidélité ou Tout-en-un actif). Prix négociés directement avec les marques, sans commission Qarte."

## Tech notes

- Route : `src/app/[locale]/dashboard/avantages/page.tsx` (client component)
- Nav entry : ajouter dans `_nav/nav-config.ts` avec icône `Tag` lucide, color `text-emerald-500`, bg `bg-emerald-50`, primary: false (donc dans MoreSheet mobile + sidebar desktop)
- i18n : namespace `avantagesPage` dans messages/fr.json (+ en.json)
- nav i18n : ajouter `dashNav.avantages` "Avantages pro"
- Opt-in : pour la 1re version stocker dans localStorage (`qarte-avantages-optin-{merchantId}`). Migration future vers colonne `merchants.avantages_alert_optin BOOLEAN` quand on aura un cron de notification.
- Suggest form : mailto pour la v1. Endpoint `/api/avantages/suggest` à coder quand le volume justifie (~10+ suggestions/mois).
- Aucune migration DB pour la v1.

## Quand re-créer

- Quand au moins 2-3 marques ont confirmé un partenariat (sinon promesse trop vide)
- Idéalement <30 jours avant la date de lancement annoncée pour créer du momentum
- Vérifier la liste des 8 marques : elles sont peut-être devenues filiales de grands groupes depuis (audit légal des conflits d'intérêts)

## Rappel commit historique

Première implémentation faite et supprimée le 2026-05-02 (commit à retrouver via `git log --all -- src/app/[locale]/dashboard/avantages/`). Code complet récupérable via `git show HEAD~N:src/app/[locale]/dashboard/avantages/page.tsx`.
