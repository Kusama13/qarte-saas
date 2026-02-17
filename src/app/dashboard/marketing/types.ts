import {
  Zap,
  Sparkles,
  Megaphone,
  PartyPopper,
  Crown,
} from 'lucide-react';

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

export const AUTOMATION_UNLOCK_THRESHOLD = 10;

// Re-export from shared module (used by both client and server)
export { FORBIDDEN_WORDS } from '@/lib/content-moderation';

export const PUSH_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'last_minute',
    title: 'Créneau dispo',
    body: 'Un créneau vient de se libérer, réservez vite !',
    offerDescription: 'Bonne nouvelle ! Un créneau vient de se libérer aujourd\'hui. Profitez-en pour prendre soin de vous sans attendre. Premier arrivé, premier servi !',
    icon: Zap,
    color: 'orange',
  },
  {
    id: 'new_service',
    title: 'Nouveau soin',
    body: 'Découvrez notre nouvelle prestation !',
    offerDescription: 'Nous sommes ravis de vous présenter notre nouveau soin ! Venez le découvrir en avant-première et profitez d\'une offre de lancement exclusive pour nos fidèles.',
    icon: Sparkles,
    color: 'violet',
  },
  {
    id: 'promo_beaute',
    title: 'Offre beauté',
    body: '-20% sur une prestation aujourd\'hui !',
    offerDescription: 'Offrez-vous un moment de bien-être à prix doux ! -20% sur la prestation de votre choix, valable uniquement aujourd\'hui. Prenez rendez-vous vite !',
    icon: Megaphone,
    color: 'pink',
  },
  {
    id: 'duo',
    title: 'Offre duo',
    body: 'Venez à deux, -20% sur les 2 prestations !',
    offerDescription: 'Envie d\'un moment entre amies ou en couple ? Profitez de -20% sur les deux prestations ! Partagez ce bon plan et passez un bon moment ensemble.',
    icon: PartyPopper,
    color: 'yellow',
  },
  {
    id: 'calme',
    title: 'Créneau calme',
    body: 'Profitez d\'un moment au calme cette semaine !',
    offerDescription: 'Envie d\'un soin dans une ambiance tranquille ? Nos créneaux en milieu de semaine sont plus calmes, idéals pour se détendre. Réservez votre moment rien qu\'à vous !',
    icon: Crown,
    color: 'amber',
  },
];

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

export function generateOfferDescription(notifTitle: string, notifBody: string): string {
  const text = `${notifTitle} ${notifBody}`.toLowerCase();

  const percentMatch = text.match(/(\d+)\s*%/);
  if (percentMatch) {
    return `Profitez de ${percentMatch[1]}% de réduction sur l'ensemble de nos produits et services. Offre exceptionnelle à ne pas manquer !`;
  }

  const euroMatch = text.match(/(\d+)\s*€/);
  if (euroMatch) {
    return `Économisez ${euroMatch[1]}€ sur votre prochain achat ! Une offre exclusive réservée à nos clients fidèles.`;
  }

  if (text.includes('flash') || text.includes('2h') || text.includes('limité')) {
    return `Vente flash exceptionnelle ! Cette offre est limitée dans le temps, ne tardez pas pour en profiter. Stocks limités !`;
  }

  if (text.includes('gratuit') || text.includes('offert') || text.includes('cadeau')) {
    return `Profitez de cette offre exceptionnelle, c'est cadeau ! Une attention spéciale pour vous remercier de votre fidélité.`;
  }

  if (text.includes('nouveau') || text.includes('nouveauté') || text.includes('découvr')) {
    return `Découvrez notre nouveauté en avant-première ! Soyez parmi les premiers à en profiter avec une offre de lancement exclusive.`;
  }

  if (text.includes('exclusi') || text.includes('fidèle') || text.includes('réservé')) {
    return `En tant que client fidèle, vous bénéficiez d'une offre exclusive ! Cette promotion est réservée uniquement à nos meilleurs clients.`;
  }

  if (text.includes('happy') || text.includes('17h') || text.includes('18h') || text.includes('19h')) {
    return `C'est l'heure des bonnes affaires ! Profitez d'offres spéciales sur une sélection de produits. L'occasion parfaite pour vous faire plaisir !`;
  }

  return `${notifTitle}: ${notifBody}. Rendez-vous vite en boutique pour profiter de cette offre !`;
}

export function formatScheduleDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split('T')[0]) return "Aujourd'hui";
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Demain';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatExpiresAt(expiresAt: string): string {
  const expires = new Date(expiresAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (expires.toDateString() === today.toDateString()) return "ce soir";
  if (expires.toDateString() === tomorrow.toDateString()) return "demain soir";
  return expires.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
