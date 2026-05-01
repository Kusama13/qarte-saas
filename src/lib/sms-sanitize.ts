/**
 * Replace caracteres absents de l'alphabet GSM-7 default par des equivalents
 * surs. Le symbole euro est le plus frequent : sans transcodage, certains
 * carriers le renvoient en '?'. Les accents latins (a, e, c) passent via
 * GSM-7 extension table ou bascule UCS-2 (cout = 2 SMS au lieu d'1) — on
 * ne les touche pas. Applique dans les 2 providers (ovh-sms + sms-partner)
 * pour couvrir TOUS les call sites (wrappers, bypass admin/test, etc.).
 */
export function sanitizeSmsForGsm7(message: string): string {
  return message.replace(/€/g, 'EUR').replace(/£/g, 'GBP').replace(/\$/g, 'USD');
}
