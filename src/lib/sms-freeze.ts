/**
 * Gels temporaires d'automatisations SMS — lus cote serveur uniquement.
 *
 * REVIEW_SMS_ENABLED (gel du 2026-07-22) : 15 merchants sur 74 avaient colle une URL
 * Google brute comme `review_link` (jusqu'a 669 caracteres). Le SMS de demande d'avis
 * partait alors en 2 a 6 segments FACTURES au lieu d'1, preleves sur le quota inclus
 * du merchant (100/mois). On coupe l'automatisation en attendant un redirecteur court.
 *
 * Le gel agit a 3 niveaux, pour qu'un simple flag en base ne suffise pas a rouvrir :
 *  - le cron `sms-hourly` n'envoie plus rien (meme si post_visit_review_enabled=true) ;
 *  - l'API `/api/sms/automations` refuse de reactiver le toggle ;
 *  - le dashboard affiche le toggle verrouille avec l'explication.
 *
 * Pour reactiver : poser REVIEW_SMS_ENABLED="true" sur Vercel (aucun redeploiement
 * de code necessaire), apres avoir corrige la longueur des liens.
 */
export const REVIEW_SMS_ENABLED = process.env.REVIEW_SMS_ENABLED === 'true';
