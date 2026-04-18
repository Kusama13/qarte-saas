// SMS marketing suggestions — starter templates the merchant can pick and edit.
// These are NOT pre-approved. All campaigns still go through admin review.
// No links: merchants contact clients directly (phone, WhatsApp, etc.).
//
// Scope: only cases NOT covered by automations (voucher expiry, welcome, inactive,
// referral invite, events, Google review all have dedicated toggles in Automatisations SMS).

export interface SmsSuggestion {
  id: string;
  label: string;
  body: string;
}

export const SMS_SUGGESTIONS: SmsSuggestion[] = [
  {
    id: 'offre_speciale',
    label: 'Offre spéciale',
    body: '{prenom}, -20% sur toutes prestations ce week-end chez {shop_name}. On t\'attend !',
  },
  {
    id: 'nouveau_service',
    label: 'Nouveau produit ou service',
    body: '{prenom}, on a une nouveauté chez {shop_name} ! Viens la découvrir.',
  },
  {
    id: 'evenement_salon',
    label: 'Événement dans le salon',
    body: '{prenom}, portes ouvertes chez {shop_name} ce samedi ! Passe partager un moment avec nous.',
  },
];
