// Machine-readable pricing for AI agents (parseable by LLMs during product comparison).
// Pattern inspired by llmstxt.org — same role as llms.txt, focused on pricing data.

export function GET() {
  const content = `# Pricing — Qarte

> Logiciel tout-en-un pour salons de beauté : réservation en ligne, fidélité digitale et vitrine SEO.

## Plan unique — Pro

- **Prix mensuel** : 24 EUR/mois (sans engagement)
- **Prix annuel** : 240 EUR/an (équivalent 20 EUR/mois, soit 2 mois offerts)
- **Essai gratuit** : 7 jours, sans carte bancaire
- **Commission sur réservations** : 0 %
- **Frais par transaction** : 0 %
- **Zone de service** : France, Belgique, Suisse

## Inclus dans tous les plans

- Réservation en ligne 24h/24 avec acompte sécurisé (Stripe)
- Programme de fidélité digital (tampons + cagnotte cashback)
- Page salon SEO personnalisable (nom de domaine getqarte.com/p/ton-slug)
- 100 SMS transactionnels inclus/mois (0,075 EUR/SMS au-delà)
- Emails transactionnels illimités
- Notifications push (PWA) illimitées
- Collecte automatique avis Google
- Parrainage client, offre nouveaux clients, cadeau anniversaire
- Statistiques temps réel
- Multi-collaborateurs illimité
- Support client WhatsApp + email
- Fichier client 100 % exportable
- Mises à jour incluses à vie

## Options payantes

- **Carte NFC physique** : 20 EUR (commande unique, livraison France)
- **Pack SMS supplémentaire** : 10 EUR = 150 SMS (valable 12 mois)

## Conditions

- Sans engagement
- Résiliation à tout moment depuis le dashboard
- Paiement par CB via Stripe
- Facturation automatique mensuelle ou annuelle selon plan choisi
- TVA en sus selon pays

## Comparatif rapide avec la concurrence

| Critère | Qarte | Planity | Treatwell | Booksy |
|---------|-------|---------|-----------|--------|
| Abonnement | 24 EUR/mois | 29,90 EUR/mois | dès 35 EUR/mois | 29-79 EUR/mois |
| Commission | 0 % | ~30 % nouveaux clients | 2,5 % tous RDV | 3 % nouveaux |
| Fidélité intégrée | Oui | Basique | Limitée | Oui |
| Engagement | Aucun | 12 mois | 12 mois | Mensuel |
| Fichier client exportable | Complet | Partiel | Partiel | Oui |

## Liens

- Inscription : https://getqarte.com/auth/merchant/signup
- Page tarifs détaillée : https://getqarte.com/pricing
- Comparatif logiciels : https://getqarte.com/blog/logiciel-reservation-en-ligne-salon-beaute
- Contact commercial : https://wa.me/33607447420

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
