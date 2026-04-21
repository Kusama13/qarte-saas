'use client';

import { useEffect, useState } from 'react';

/**
 * Détecte l'ouverture du clavier virtuel mobile via visualViewport API.
 * Utilisé pour masquer le bottom nav quand l'utilisateur tape dans un input
 * (sinon le nav "flotte" au milieu de l'écran, UX iOS cassée).
 *
 * Fallback : retourne false si visualViewport non supporté.
 */
export function useVirtualKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const THRESHOLD_PX = 150;

    const check = () => {
      setVisible(window.innerHeight - vv.height > THRESHOLD_PX);
    };

    vv.addEventListener('resize', check);
    vv.addEventListener('scroll', check);
    check();

    return () => {
      vv.removeEventListener('resize', check);
      vv.removeEventListener('scroll', check);
    };
  }, []);

  return visible;
}
