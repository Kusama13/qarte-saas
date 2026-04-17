// SMS marketing suggestions — starter templates the merchant can pick and edit.
// These are NOT pre-approved. All campaigns still go through admin review.
// No links: merchants contact clients directly (phone, WhatsApp, etc.).

export interface SmsSuggestion {
  id: string;
  label: string;
  body: string;
}

export const SMS_SUGGESTIONS: SmsSuggestion[] = [
  {
    id: 'promo_flash',
    label: 'Promo flash',
    body: '{prenom}, -20% sur toutes prestations ce week-end chez {shop_name}. On t\'attend !',
  },
  {
    id: 'nouveau_service',
    label: 'Nouveau service',
    body: '{prenom}, on a une nouveauté chez {shop_name} ! Viens découvrir.',
  },
  {
    id: 'vip',
    label: 'Offre VIP',
    body: "{prenom}, parce que tu es fidèle, {shop_name} t'offre -15% sur ta prochaine visite. À très vite !",
  },
  {
    id: 'reactivation',
    label: 'Réactivation',
    body: "{prenom}, ça fait longtemps ! {shop_name} t'offre -10% sur ton prochain RDV. On t'attend.",
  },
  {
    id: 'evenement',
    label: 'Évènement',
    body: '{prenom}, offre spéciale chez {shop_name} ! Pense à prendre ton RDV rapidement.',
  },
  {
    id: 'remerciement',
    label: 'Remerciement',
    body: '{prenom}, merci pour ta fidélité ! {shop_name} pense à toi.',
  },
  {
    id: 'parrainage',
    label: 'Parrainage',
    body: '{prenom}, parraine une amie et gagne un cadeau chez {shop_name} !',
  },
  {
    id: 'recompense',
    label: 'Récompense dispo',
    body: "{prenom}, ta récompense t'attend chez {shop_name} ! Passe la chercher.",
  },
];
