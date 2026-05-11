import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copie un texte dans le presse-papier avec feedback "copied" auto-reset.
 * Cleanup le timer au démontage pour éviter setState sur composant démonté
 * (warning React + leak de l'id timer).
 */
export function useCopyToClipboard(resetMs = 2000): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), resetMs);
    } catch {
      // Clipboard refuse (vieux Safari, contexte non sécurisé) — silencieux.
    }
  }, [resetMs]);

  return { copied, copy };
}
