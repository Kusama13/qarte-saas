// Client-safe SMS constants. No server imports, safe for 'use client' components.

export const SMS_FREE_QUOTA = 100;
export const SMS_UNIT_COST = 0.075;
export const SMS_UNIT_COST_CENTS = SMS_UNIT_COST * 100;
export const SMS_OVERAGE_COST = SMS_UNIT_COST;
