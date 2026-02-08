# Mode Article - Documentation pour restauration

## Description
Le mode article permet aux clients de cumuler des points par article acheté (ex: 10 cafés = 1 offert).
Contrairement au mode visite (1 passage = 1 point), le mode article permet de valider plusieurs articles en un seul scan.

## Fichiers impactés

### 1. Types (`src/types/index.ts`)
```typescript
export type LoyaltyMode = 'visit' | 'article';

// Dans l'interface Merchant:
loyalty_mode: LoyaltyMode;
product_name: string | null;        // Nom du produit (ex: "cafés", "pizzas")
max_quantity_per_scan: number;      // Quantité max par scan (1-10)
```

### 2. Page Scan (`src/app/scan/[code]/page.tsx`)
- Step `article-select`: Sélecteur de quantité avant validation
- Variable `quantity` pour le nombre d'articles
- Affichage "Valider X [produit]" au lieu de "Valider mon passage"
- Boutons +/- pour ajuster la quantité

Code clé du sélecteur de quantité:
```tsx
{step === 'article-select' && loyaltyCard && (
  <div className="animate-fade-in">
    {/* Quantity Selector */}
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-600 mb-3 text-center">
        Nombre de {merchant?.product_name || 'articles'}
      </p>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
          <Minus />
        </button>
        <div className="w-20 h-20 rounded-2xl">{quantity}</div>
        <button onClick={() => setQuantity(Math.min(merchant?.max_quantity_per_scan || 5, quantity + 1))}>
          <Plus />
        </button>
      </div>
    </div>
  </div>
)}
```

### 3. Composant Settings (`src/components/loyalty/MerchantSettingsForm.tsx`)
- Sélection du mode (visite/article)
- Configuration du nom du produit
- Slider pour max_quantity_per_scan
- Résumé dynamique selon le mode

### 4. API Checkin (`src/app/api/checkin/route.ts`)
- Paramètre `points_to_add` pour ajouter plusieurs points
- Logique de validation selon le mode

### 5. Dashboard Program (`src/app/dashboard/program/page.tsx`)
- Affichage conditionnel selon loyalty_mode
- Wording adapté (passages vs articles)

### 6. Customer Card (`src/app/customer/card/[merchantId]/page.tsx`)
- Affichage du nombre de points avec le bon wording

## Base de données (Supabase)

### Table `merchants`
```sql
loyalty_mode TEXT DEFAULT 'visit',
product_name TEXT,
max_quantity_per_scan INTEGER DEFAULT 5
```

### Migration pour réactiver
```sql
-- Si besoin de restaurer le mode article:
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS loyalty_mode TEXT DEFAULT 'visit',
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS max_quantity_per_scan INTEGER DEFAULT 5;
```

## Fichiers sauvegardés dans ce dossier

- `MerchantSettingsForm.backup.tsx` - Formulaire complet avec mode article
- `scan-page.backup.tsx` - Page scan avec sélecteur de quantité
- `ProgramGuide.backup.tsx` - Guide avec choix du mode (visite/article)

## Fichiers modifiés (sans backup complet)

- `src/components/marketing/FlyerTemplate.tsx` - Suppression props loyaltyMode/productName
- `src/components/PendingPointsWidget.tsx` - Suppression mode article dans Qarte Shield
- `src/app/dashboard/qr-download/page.tsx` - Suppression props loyaltyMode
- `src/app/dashboard/page.tsx` - Suppression props loyaltyMode sur PendingPointsWidget
- `src/app/customer/card/[merchantId]/page.tsx` - Simplification pour mode visite uniquement

## Pour restaurer le mode article

1. Remettre le type `LoyaltyMode` dans `src/types/index.ts`
2. Restaurer les champs dans l'interface `Merchant`
3. Restaurer le step `article-select` dans `/scan` (voir `scan-page.backup.tsx`)
4. Restaurer le composant `MerchantSettingsForm` (voir `MerchantSettingsForm.backup.tsx`)
5. Restaurer `ProgramGuide.tsx` (voir `ProgramGuide.backup.tsx`)
6. Remettre les props `loyaltyMode` dans FlyerTemplate, PendingPointsWidget, etc.
7. Adapter les API et dashboard

## Cas d'usage typiques (non beauty/wellness)
- Boulangeries: 10 croissants = 1 offert
- Cafés: 10 cafés = 1 gratuit
- Pizzerias: 10 pizzas = 1 offerte
- Fast-food: 10 burgers = 1 offert
