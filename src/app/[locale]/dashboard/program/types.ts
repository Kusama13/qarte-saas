// 6 palettes mobile (3x2) + 4 desktop-only (2x5)
export const COLOR_PALETTES = [
  { primary: '#1e293b', secondary: '#475569', name: 'Élégant', icon: '✂️' },
  { primary: '#db2777', secondary: '#f472b6', name: 'Glamour', icon: '💅' },
  { primary: '#7c3aed', secondary: '#a78bfa', name: 'Moderne', icon: '💜', desktopOnly: true },
  { primary: '#059669', secondary: '#10b981', name: 'Zen', icon: '🧘' },
  { primary: '#92704f', secondary: '#c8a97e', name: 'Sable', icon: '🏖️' },
  { primary: '#b45309', secondary: '#f59e0b', name: 'Doré', icon: '👑' },
  { primary: '#0891b2', secondary: '#22d3ee', name: 'Frais', icon: '💎', desktopOnly: true },
  { primary: '#0f766e', secondary: '#2dd4bf', name: 'Menthe', icon: '🍃', desktopOnly: true },
  { primary: '#6d28d9', secondary: '#c084fc', name: 'Orchidée', icon: '🪻' },
  { primary: '#be185d', secondary: '#fb7185', name: 'Corail', icon: '🌺', desktopOnly: true },
];

// Suggestions récompenses palier 2 (plus premium que palier 1)
export const TIER2_REWARD_SUGGESTIONS: Record<string, string[]> = {
  coiffeur: [
    '1 couleur complète offerte',
    '1 soin + coupe offerts',
    '1 balayage offert',
    '-30% sur une prestation au choix',
  ],
  barbier: [
    '1 forfait complet offert',
    '1 soin barbe + coupe offerts',
    '1 coloration barbe offerte',
    '-30% sur une prestation',
  ],
  institut_beaute: [
    '1 soin complet offert',
    '1 forfait visage + corps',
    '1 soin anti-âge offert',
    '-30% sur une prestation au choix',
  ],
  onglerie: [
    '1 pose + nail art offerts',
    '1 manucure + pédicure offertes',
    '1 forfait spa mains + pieds',
    '-30% sur le prochain rdv',
  ],
  spa: [
    '1 massage 1h offert',
    '1 forfait détente complet',
    '1 rituel duo offert',
    '-30% sur un soin premium',
  ],
  estheticienne: [
    '1 soin complet offert',
    '1 forfait visage premium',
    '1 soin anti-âge offert',
    '-30% sur une prestation au choix',
  ],
  tatouage: [
    '1 retouche complète offerte',
    '1 piercing offert',
    '-20% sur le prochain tatouage',
    '1 consultation design offerte',
  ],
  autre: [
    '1 prestation premium offerte',
    '1 forfait complet offert',
    'Un cadeau VIP',
    '-30% sur le prochain passage',
  ],
};

export const REFERRAL_SUGGESTIONS = {
  referred: [
    '-10% sur la 1ère visite',
    '-20% sur la 1ère visite',
    'Un soin découverte offert',
  ],
  referrer: [
    '-10% sur la prochaine visite',
    '-20% sur la prochaine visite',
    'Un soin offert',
  ],
};

export const BIRTHDAY_SUGGESTIONS = [
  '-10% sur ton prochain passage',
  '-15% sur ton prochain passage',
  '-20% sur ton prochain passage',
  '-30% sur ton prochain passage',
];

export const DUO_OFFER_SUGGESTIONS = [
  '-20% pour les deux',
  '2e prestation a -50%',
  'Soin offert pour l\'accompagnant',
];

export interface ProgramFormData {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  reviewLink: string;
  loyaltyMode: 'visit' | 'cagnotte';
  stampsRequired: number;
  rewardDescription: string;
  // Cagnotte mode
  cagnottePercent: number;
  cagnotteTier2Percent: number;
  // 2nd tier reward
  tier2Enabled: boolean;
  tier2StampsRequired: number;
  tier2RewardDescription: string;
  // Duo offer
  duoOfferEnabled: boolean;
  duoOfferDescription: string;
  // Double stamp days
  doubleDaysEnabled: boolean;
  doubleDaysOfWeek: number[];
  // Birthday gift
  birthdayGiftEnabled: boolean;
  birthdayGiftDescription: string;
  // Referral
  referralEnabled: boolean;
  referralRewardReferred: string;
  referralRewardReferrer: string;
}
