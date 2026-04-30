// Constants client-safe pour l'auth cookie cliente.
// Le module customer-auth.ts importe `crypto` (Node only) — on isole les
// constantes ici pour permettre les imports cote client sans bundler crypto.

export const COOKIE_NAME = 'qarte_cust';

export function hasCustomerCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${COOKIE_NAME}=`);
}
