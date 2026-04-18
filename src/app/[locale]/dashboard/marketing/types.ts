import {
  Zap,
  Sparkles,
  Megaphone,
  PartyPopper,
  Crown,
} from 'lucide-react';
import { toBCP47 } from '@/lib/utils';

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  offerDescription: string;
  icon: React.ElementType;
  color: string;
}

export interface Subscriber {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  loyalty_card_id: string | null;
  current_stamps: number;
  stamps_required: number;
  last_visit: string | null;
  total_visits: number;
  card_created_at: string | null;
}

export interface PushHistoryItem {
  id: string;
  title: string;
  body: string;
  filter_type: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export interface ScheduledPush {
  id: string;
  title: string;
  body: string;
  scheduled_time: string;
  scheduled_date: string;
  status: string;
}

export interface SendResult {
  success: boolean;
  sent?: number;
  failed?: number;
  message?: string;
}

export interface BirthdaySaveResult {
  success: boolean;
  message: string;
}

// Re-export from shared module (used by both client and server)
export { FORBIDDEN_WORDS } from '@/lib/content-moderation';

type TranslateFunction = (key: string) => string;

const TEMPLATE_DEFS = [
  { id: 'last_minute', titleKey: 'lastMinuteTitle', bodyKey: 'lastMinuteBody', offerDescriptionKey: 'lastMinuteOffer', icon: Zap, color: 'orange' },
  { id: 'new_service', titleKey: 'newServiceTitle', bodyKey: 'newServiceBody', offerDescriptionKey: 'newServiceOffer', icon: Sparkles, color: 'violet' },
  { id: 'promo_beaute', titleKey: 'promoTitle', bodyKey: 'promoBody', offerDescriptionKey: 'promoOffer', icon: Megaphone, color: 'pink' },
  { id: 'duo', titleKey: 'duoTitle', bodyKey: 'duoBody', offerDescriptionKey: 'duoOffer', icon: PartyPopper, color: 'yellow' },
  { id: 'dernieres_dispos', titleKey: 'lastAvailTitle', bodyKey: 'lastAvailBody', offerDescriptionKey: 'lastAvailOffer', icon: Crown, color: 'amber' },
] as const;

export function getPushTemplates(t: TranslateFunction): NotificationTemplate[] {
  return TEMPLATE_DEFS.map((def) => ({
    id: def.id,
    title: t(def.titleKey),
    body: t(def.bodyKey),
    offerDescription: t(def.offerDescriptionKey),
    icon: def.icon,
    color: def.color,
  }));
}


export const TEMPLATE_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  violet: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100',
  amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
  pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
  red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
  purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
};

// Re-export from shared module
export { containsForbiddenWords } from '@/lib/content-moderation';

export function generateOfferDescription(
  notifTitle: string,
  notifBody: string,
  t?: (key: string, params?: Record<string, string | number>) => string,
): string {
  const text = `${notifTitle} ${notifBody}`.toLowerCase();

  const tGen = t
    ? (key: string, params?: Record<string, string | number>) => t(`generate.${key}`, params)
    : null;

  const percentMatch = text.match(/(\d+)\s*%/);
  if (percentMatch) {
    return tGen
      ? tGen('percentOffer', { percent: percentMatch[1] })
      : `Profitez de ${percentMatch[1]}% de réduction sur l'ensemble de nos produits et services. Offre exceptionnelle à ne pas manquer !`;
  }

  const euroMatch = text.match(/(\d+)\s*€/);
  if (euroMatch) {
    return tGen
      ? tGen('euroOffer', { amount: euroMatch[1] })
      : `Économisez ${euroMatch[1]}€ sur votre prochain achat ! Une offre exclusive réservée à nos clients fidèles.`;
  }

  if (text.includes('flash') || text.includes('2h') || text.includes('limité') || text.includes('limited')) {
    return tGen ? tGen('flashOffer') : `Vente flash exceptionnelle ! Cette offre est limitée dans le temps, ne tardez pas pour en profiter. Stocks limités !`;
  }

  if (text.includes('gratuit') || text.includes('offert') || text.includes('cadeau') || text.includes('free') || text.includes('gift')) {
    return tGen ? tGen('freeOffer') : `Profitez de cette offre exceptionnelle, c'est cadeau ! Une attention spéciale pour vous remercier de votre fidélité.`;
  }

  if (text.includes('nouveau') || text.includes('nouveauté') || text.includes('découvr') || text.includes('new') || text.includes('discover')) {
    return tGen ? tGen('newOffer') : `Découvrez notre nouveauté en avant-première ! Soyez parmi les premiers à en profiter avec une offre de lancement exclusive.`;
  }

  if (text.includes('exclusi') || text.includes('fidèle') || text.includes('réservé') || text.includes('loyal') || text.includes('reserved')) {
    return tGen ? tGen('exclusiveOffer') : `En tant que client fidèle, vous bénéficiez d'une offre exclusive ! Cette promotion est réservée uniquement à nos meilleurs clients.`;
  }

  if (text.includes('happy') || text.includes('17h') || text.includes('18h') || text.includes('19h')) {
    return tGen ? tGen('happyHourOffer') : `C'est l'heure des bonnes affaires ! Profitez d'offres spéciales sur une sélection de produits. L'occasion parfaite pour vous faire plaisir !`;
  }

  return tGen
    ? tGen('defaultOffer', { title: notifTitle, body: notifBody })
    : `${notifTitle}: ${notifBody}. Rendez-vous vite en boutique pour profiter de cette offre !`;
}

export function formatScheduleDate(dateStr: string, locale: string = 'fr'): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split('T')[0]) return locale === 'en' ? 'Today' : "Aujourd'hui";
  if (dateStr === tomorrow.toISOString().split('T')[0]) return locale === 'en' ? 'Tomorrow' : 'Demain';
  return date.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' });
}

export function formatExpiresAt(expiresAt: string, locale: string = 'fr'): string {
  const expires = new Date(expiresAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (expires.toDateString() === today.toDateString()) return locale === 'en' ? 'tonight' : 'ce soir';
  if (expires.toDateString() === tomorrow.toDateString()) return locale === 'en' ? 'tomorrow night' : 'demain soir';
  return expires.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' });
}
