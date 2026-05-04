// Client-safe SMS constants. No server imports, safe for 'use client' components.

export const SMS_FREE_QUOTA = 100;
export const SMS_UNIT_COST = 0.075;
export const SMS_UNIT_COST_CENTS = SMS_UNIT_COST * 100;
export const SMS_OVERAGE_COST = SMS_UNIT_COST;

// Seuils d'alerte crédit provider (OVH / SMS Partner) — partagés cron + UI admin
// pour que la pastille rouge UI corresponde exactement au déclenchement de l'email.
export const SMS_CREDIT_LOW_THRESHOLD = 50;
export const SMS_CREDIT_WARN_THRESHOLD = 200;
export const SMS_CREDIT_RESET_THRESHOLD = SMS_CREDIT_LOW_THRESHOLD * 1.5;
