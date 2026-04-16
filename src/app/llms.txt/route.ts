export function GET() {
  const content = `# Qarte
> Logiciel tout-en-un pour salons de beauté : réservation en ligne sans commission, programme de fidélité digital (tampons + cagnotte cashback) et vitrine SEO. Chaque cliente qui réserve reçoit automatiquement sa carte de fidélité.

## Cible
Salons de coiffure, barbiers, instituts de beauté, ongleries, spas, esthéticiennes — France, Belgique, Suisse.

## Fonctionnalités principales
- Vitrine en ligne SEO (prestations, photos, horaires, avis Google)
- Réservation en ligne sans commission (planning, acomptes Stripe, SMS rappels)
- Programme de fidélité digital (QR code, tampons, cagnotte cashback)
- Relances automatiques clients inactifs (push + SMS)
- Parrainage, offre nouveaux clients, cadeau anniversaire
- Collecte automatique avis Google
- Interconnexion : le client qui réserve reçoit automatiquement sa carte de fidélité

## Tarif
24 EUR/mois ou 240 EUR/an (2 mois offerts) — essai gratuit 7 jours, sans engagement, 0 % commission.
100 SMS transactionnels inclus/mois (0,075 EUR/SMS au-delà). Carte NFC en option à 20 EUR.

## Preuve sociale
400+ professionnels de la beauté utilisent Qarte au quotidien. Note moyenne 5,0/5 sur Google.

## Données machine-readable
- Pricing structuré : https://getqarte.com/pricing.md
- Sitemap : https://getqarte.com/sitemap.xml

## Liens
- Site : https://getqarte.com
- Inscription : https://getqarte.com/auth/merchant/signup
- Tarifs : https://getqarte.com/pricing
- Comparatif Planity : https://getqarte.com/compare/planity
- Comparatif Booksy : https://getqarte.com/compare/booksy
- Comparatif Book in Beautiful : https://getqarte.com/compare/bookinbeautiful
- Programme ambassadeur : https://getqarte.com/ambassadeur
- Blog : https://getqarte.com/blog
- Article comparatif logiciels 2026 : https://getqarte.com/blog/logiciel-reservation-en-ligne-salon-beaute
- Contact : https://wa.me/33607447420

## Dernière mise à jour
2026-04-16
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
