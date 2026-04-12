export function GET() {
  const content = `# Qarte
> Plateforme tout-en-un pour les professionnels de la beaute : vitrine en ligne, reservation en ligne sans commission, programme de fidelite digital (tampons + cagnotte cashback).

## Cible
Salons de coiffure, barbiers, instituts de beaute, ongleries, spas, estheticiennes — France, Belgique, Suisse.

## Fonctionnalites principales
- Vitrine en ligne SEO (prestations, photos, horaires, avis Google)
- Reservation en ligne sans commission (planning, acomptes, SMS rappels)
- Programme de fidelite digital (QR code, tampons, cagnotte cashback)
- Relances automatiques clients inactifs (push + SMS)
- Parrainage, offre nouveaux clients, cadeau anniversaire
- Collecte automatique avis Google
- Interconnexion : le client qui reserve recoit automatiquement sa carte de fidelite

## Tarif
24 EUR/mois ou 240 EUR/an — essai gratuit 7 jours, sans engagement, 0% commission.

## Liens
- Site : https://getqarte.com
- Inscription : https://getqarte.com/auth/merchant/signup
- Comparatif Planity : https://getqarte.com/compare/planity
- Comparatif Booksy : https://getqarte.com/compare/booksy
- Blog : https://getqarte.com/blog
- Contact : https://wa.me/33607447420
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
