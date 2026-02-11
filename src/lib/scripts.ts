// Scripts verbaux par type de commerce — réutilisés par emails + dashboard
export const SCRIPTS_BY_SHOP_TYPE: Record<string, string> = {
  coiffeur: "C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes.",
  barbier: "C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes.",
  onglerie: "Pendant que le vernis sèche, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes.",
  institut_beaute: "Pendant qu'on pose le masque, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes.",
  spa: "Avant de repartir, scannez le QR code pour votre carte de fidélité — ça prend 5 secondes.",
  estheticienne: "Pendant la pause, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes.",
  massage: "Avant de repartir, scannez le QR code pour votre carte de fidélité — ça prend 5 secondes.",
  epilation: "Pendant qu'on prépare la cire, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes.",
};

export const DEFAULT_SCRIPT = "Avant de partir, scannez le QR code pour la carte de fidélité — 5 secondes et c'est fait !";

export function getScriptForShopType(shopType: string): string {
  const normalized = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  return SCRIPTS_BY_SHOP_TYPE[normalized] || DEFAULT_SCRIPT;
}
