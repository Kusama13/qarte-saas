import { normalizeUrl } from './utils';

/**
 * Validation des URLs d'avis / fiche Google My Business.
 * Reconnait les formats officiels que Google produit pour la collecte d'avis.
 *
 * Hosts acceptes :
 * - g.page (https://g.page/r/<id>/review et https://g.page/<slug>)
 * - search.google.com (panneau "Donner mon avis")
 * - maps.app.goo.gl (lien partage Maps court)
 * - goo.gl/maps (ancien short link Maps)
 * - maps.google.com / www.google.com/maps (fiche etablissement)
 * - business.google.com (Google Business Profile)
 */

const ALLOWED_HOSTS = new Set([
  'g.page',
  'search.google.com',
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
  'business.google.com',
]);

export function isGoogleReviewUrl(rawUrl: string): boolean {
  const withScheme = normalizeUrl(rawUrl);
  if (!withScheme) return false;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return false;
  // goo.gl est tres large : on exige le segment /maps pour limiter aux Maps.
  if (host === 'goo.gl' && !parsed.pathname.toLowerCase().startsWith('/maps')) {
    return false;
  }
  // www.google.com / google.com : doit pointer sur /maps ou /search avec query maps.
  if (host === 'www.google.com' || host === 'google.com') {
    const path = parsed.pathname.toLowerCase();
    if (!path.startsWith('/maps') && !path.startsWith('/search')) return false;
  }
  return true;
}
