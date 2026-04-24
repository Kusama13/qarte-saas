# Design System — Qarte Dashboard

Extrait du code existant (`src/app/[locale]/dashboard/**` + `src/components/dashboard/**`). Source de vérité pour toute nouvelle page merchant.

## Atmosphere

Chaleureux, coloré par feature (pas par sévérité), densité modérée. Cards blanches sur fond gris très clair, accents violet deep pour les actions primaires, arc-en-ciel pastel pour différencier les surfaces (planning = cyan, fidélité = rose/emerald, public = violet, dépôts = ambre). Rien de gris corporate — les couleurs saturées définissent la marque.

## Color

### Tokens Tailwind (source)

Défini dans `tailwind.config.ts` :

```
primary.DEFAULT  #654EDA   purple marque (rare en direct)
primary.50..900            palette générée (de #F5F3FF à #4C1D95)
secondary.DEFAULT #9D8FE8  lavande (accent support)
secondary.50..900          palette rose dérivée
```

### Couleurs effectivement utilisées

**Primary actions / navigation active**
- `#4b0082` (deep purple hex hardcodé) — dominant sur nav active, header banners, progress bars
- `bg-[#4b0082] text-white` = pattern standard état actif

**Accents par feature** (chaque zone a son accent)

| Feature | Accent base | Background léger | Usage |
|---|---|---|---|
| Fidélité / récompenses | `rose-500`, `pink-500` | `rose-50`, `pink-50` | cœurs, birthdays, client journey |
| Planning / agenda | `cyan-500`, `sky-500` | `cyan-50` | créneaux, horaires, réservations |
| Vitrine publique | `violet-500`, `violet-600` | `violet-50` | photos, showcase, page pro |
| Acquisition / parrainage | `indigo-500`, `blue-500` | `indigo-50`, `blue-50` | referrals, invitations |
| Succès / revenu | `emerald-500`, `emerald-600` | `emerald-50` | trends positifs, CA en hausse, accept |
| Avertissement / dépôt en attente | `amber-500`, `amber-600` | `amber-50` | pending, deadline, warnings doux |
| Erreur / no-show | `red-500`, `rose-500` | `red-50`, `rose-50` | rejets, échecs, trends négatifs |

**Neutrals** (texte + surfaces)
- `text-slate-900` titres
- `text-gray-700` body principal
- `text-gray-500` body secondaire
- `text-gray-400` meta / helpers
- `bg-white` cards
- `bg-gray-50` background page + hover subtil
- `border-gray-100` border standard cards
- `border-gray-200` border inputs / buttons

### Règles couleur

- **Feature color first** : une page planning = accents cyan/sky, pas violet. Une page fidélité = rose/emerald. L'accent primaire `#4b0082` reste pour les actions globales (nav, CTA principaux).
- **Jamais** de gradient arbitraire. Les gradients existants sont délibérés : `from-[#4b0082] via-violet-700 to-violet-800` pour les hero cards, `from-indigo-50 via-white to-violet-50` pour les empty states.
- Le pastel (-50 / -100) porte l'info ambient (badge, fond card). La couleur pleine (-500/-600) porte le CTA ou l'icône.

## Typography

**Fonts** : chargées via `next/font/google` dans `src/app/layout.tsx`
- `--font-sans` → **Figtree** (tout le dashboard)
- `--font-display` → **Bodoni Moda** (réservé landing / blog hero, pas utilisé dans le dashboard)

**Hiérarchie dashboard**

| Usage | Classes |
|---|---|
| Page title (H1) | `text-xl md:text-2xl font-bold tracking-tight text-slate-900` |
| Section title (H2) | `text-base md:text-lg font-bold text-gray-900` |
| Card title (H3) | `text-sm font-semibold text-gray-900` |
| Card value (gros chiffre) | `text-2xl md:text-3xl font-bold text-gray-900` (ou couleur feature) |
| Body | `text-sm text-gray-700` |
| Body secondaire | `text-xs text-gray-500` |
| Meta / label uppercase | `text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-gray-400` |

**Règles** :
- `font-medium` pour body, `font-semibold` pour accents, `font-bold` pour titres et chiffres clés
- Jamais `italic` ni soulignement décoratif
- Tutoiement systématique côté merchant

## Spacing & Layout

### Radius (dominance)

```
rounded-xl      (393 usages)  cards standard, boutons, list items
rounded-lg      (243 usages)  petits éléments, badges, input
rounded-full    (221 usages)  avatars, pills, badges count, progress
rounded-2xl     (155 usages)  grandes cards, modales, sections hero
rounded-3xl     (9 usages)    hero cards exceptionnelles uniquement
```

Règle : default = `rounded-xl`. Grandes surfaces ou modales = `rounded-2xl`. `rounded-3xl` = exception (HeroToday).

### Padding

- `p-4` card standard
- `p-3` compact list item ou badge
- `p-6` section large / modale
- `px-3 py-2` bouton ou list item

### Gap / spacing

- `gap-2` serré (icône + texte, pills inline)
- `gap-3` medium (cards grid, row items)
- `space-y-4 md:space-y-6` vertical section spacing dashboard

### Shadow

- `shadow-sm` default cards (dominant)
- `shadow-md` hover emphasis
- `shadow-lg` / `shadow-xl` / `shadow-2xl` modales uniquement
- Colored shadows occasionnelles : `shadow-indigo-200/50` pour CTA primaires

### Breakpoints

Mobile-first avec `lg:` (1024px) comme pivot principal.
- `< lg` → bottom nav fixe + top bar sticky + contenu full-width `px-4`
- `≥ lg` → sidebar fixed `w-72` + contenu `lg:ml-72 lg:px-8 lg:pt-8`
- Grid cards : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (pattern récurrent)

## Components (réutiliser impérativement)

### `StatsCard` — [src/components/dashboard/StatsCard.tsx](src/components/dashboard/StatsCard.tsx)
Card KPI avec icône colorée + valeur + label optionnel trend. **Utiliser pour tous les chiffres clés.**

### `HeroToday` — [src/components/dashboard/HeroToday.tsx](src/components/dashboard/HeroToday.tsx)
Gradient card `from-[#4b0082] via-violet-700 to-violet-800`, texte blanc. Hero de la page d'accueil. Ne pas reproduire ailleurs sauf pour un "moment fort" de la page.

### `CollapsibleCard` — [src/app/[locale]/admin/merchants/[id]/page.tsx](src/app/[locale]/admin/merchants/[id]/page.tsx)
Card repliable avec icon + title + badge + chevron animé. **Utiliser pour toutes les sections secondaires** dans les pages de détail admin ou dashboard.

### `FeatureBadge` — même fichier
Pill `rounded-full` avec icon + label, vert si actif, gris si inactif. **Utiliser pour toute liste de toggles / statuts**.

### `WeekTiles` — [src/components/dashboard/WeekTiles.tsx](src/components/dashboard/WeekTiles.tsx)
Grille 2 colonnes des 7 derniers jours avec mini-badge trend. Pattern pour toute série temporelle compacte.

### `StatusBanner` — [src/components/dashboard/StatusBanner.tsx](src/components/dashboard/StatusBanner.tsx)
Bandeau horizontal pour état global (trial, grace period, payment issue). Severity : calm (primary-50), warning (amber-50), urgent (red-50).

### Patterns récurrents

**Card standard**
```tsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
  {children}
</div>
```

**Icon + value tile**
```tsx
<div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
  <div className="w-9 h-9 rounded-lg bg-{feature}-50 flex items-center justify-center">
    <Icon className="w-4 h-4 text-{feature}-600" />
  </div>
  <div>
    <p className="text-xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
</div>
```

**Section title**
```tsx
<h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
  <Icon className="w-4 h-4 text-{feature}-600" />
  {title}
  {badge}
</h3>
```

## Icons

**Library** : `lucide-react` uniquement. Jamais d'autres lib d'icônes.

**Tailles**
- `w-3 h-3` mini (inside badges)
- `w-4 h-4` standard (nav, list, card headers) — **default**
- `w-5 h-5` action buttons
- `w-6 h-6` large (tab nav, hero)

**Règles**
- Aligner inline avec `flex items-center gap-1.5` ou `gap-2`
- Dans un wrapper coloré : `w-8 h-8 rounded-lg bg-{feature}-50` + icon `w-4 h-4 text-{feature}-600`
- `strokeWidth` default (2). Actif/emphasis = 2.4.

## Motion

- Transitions par défaut : `transition-colors duration-150` ou `transition-transform duration-200`
- Hover subtils : `hover:bg-gray-50` sur list items, `hover:shadow-md` sur cards cliquables
- Tap feedback mobile : `active:scale-95 touch-manipulation`
- framer-motion réservé pour : MoreSheet (drag + spring), lightbox images, modals complexes. Pas pour fade-in simple.
- Respecter `prefers-reduced-motion` (désactiver framer animations).

## States

- **Loading** : `<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />` centré, ou skeletons `bg-gray-100 animate-pulse`
- **Empty state** : gradient `from-indigo-50 via-white to-violet-50 rounded-3xl`, icon centré, 1 ligne de copy + CTA optionnel
- **Success toast** : `bg-emerald-50/90 border-emerald-200` + `CheckCircle2` icon
- **Error toast** : `bg-rose-50/90 border-rose-200` + `AlertCircle` icon
- **Modal backdrop** : `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm`
- **Modal body** : `max-w-sm w-full p-6 bg-white rounded-2xl shadow-2xl`
- **Progress bar** : `h-1.5 bg-gray-100 rounded-full` + fill `bg-{feature}-500`

## Voice & Tone

- **Tutoiement merchant** partout dans le dashboard. Titres du style « Ta semaine », « Tes clientes », « Tes statistiques ».
- **Vouvoiement cliente** sur la PWA client et SMS sortants aux clientes.
- Éviter : « utilisateur », « entity », « resource », « KPI », « insights », « leads ». Préférer : « cliente », « rendez-vous », « récompense », « chiffres ».
- Pas d'emojis sauf exception ponctuelle (celebration moments, anniversaires). Les icônes lucide suffisent.
- Phrases courtes. Chaque mot doit porter de la valeur.

## Do not

- Pas de rounded-sm / rounded-md (inconsistant avec le reste)
- Pas de shadow dramatic (`shadow-xl`, `shadow-2xl`) hors modales
- Pas de couleur hors palette (grays + feature accents + primary)
- Pas de sidebar pattern custom, réutiliser la layout `dashboard/layout.tsx`
- Pas de nouvelles lib d'icônes, pas de SVG inline custom
- Pas de font custom ajoutée
