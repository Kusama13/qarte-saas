'use client';

import { useState } from 'react';
import {
  Mail,
  FileText,
  Store,
  Coffee,
  Scissors,
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Megaphone,
  QrCode,
  TrendingUp,
  Star,
  Clock,
  Award,
  Users,
  Percent,
  BadgeCheck,
  Smartphone,
  Bell,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CommerceType = 'bakery' | 'restaurant' | 'hairdresser' | 'boutique' | 'cafe' | 'beauty';

const commerceTypes: { id: CommerceType; label: string; icon: React.ElementType; emoji: string }[] = [
  { id: 'bakery', label: 'Boulangerie', icon: Store, emoji: '🥐' },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, emoji: '🍽️' },
  { id: 'hairdresser', label: 'Coiffeur', icon: Scissors, emoji: '✂️' },
  { id: 'boutique', label: 'Boutique', icon: ShoppingBag, emoji: '🛍️' },
  { id: 'cafe', label: 'Café / Bar', icon: Coffee, emoji: '☕' },
  { id: 'beauty', label: 'Institut beauté', icon: Sparkles, emoji: '💅' },
];

interface EmailTemplate {
  subject: string;
  body: string;
}

interface FlyerDesign {
  id: string;
  title: string;
  format: string;
  style: 'stats' | 'benefits' | 'testimonial';
  headline: string;
  subline: string;
  stats?: { value: string; label: string }[];
  benefits?: string[];
  cta: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
}

interface VitrophanieDesign {
  id: string;
  title: string;
  format: string;
  style: 'network' | 'badge' | 'minimal';
  mainMessage: string;
  subMessage?: string;
  colors: { primary: string; secondary: string; bg: string; text: string };
}

const emailTemplates: Record<CommerceType, EmailTemplate[]> = {
  bakery: [
    {
      subject: 'Fidélisez vos clients avec une carte digitale gratuite',
      body: `Bonjour,

Je suis [Votre Nom] de Qarte, la solution de fidélisation digitale pensée pour les artisans.

Vous le savez, vos clients réguliers sont votre force. Mais combien perdez-vous de clients fidèles qui oublient leur carte à tampons ?

Avec Qarte, offrez-leur une carte de fidélité 100% digitale :
• Pas d'application à télécharger
• Un simple QR code à scanner
• 10 passages = 1 croissant offert (ou ce que vous voulez !)

Je vous propose 14 jours d'essai gratuit, sans engagement.

Seriez-vous disponible pour un appel de 10 minutes cette semaine ?

Cordialement,
[Votre Nom]
Qarte - La fidélité simplifiée`,
    },
    {
      subject: 'Vos clients reviennent-ils assez souvent ?',
      body: `Bonjour,

Question rapide : combien de vos clients achètent leur pain ailleurs certains jours ?

La concurrence est rude, et la fidélisation fait la différence.

Avec Qarte, transformez chaque visite en point de fidélité :
• Le client scanne le QR à la caisse
• Il cumule ses passages automatiquement
• Après X visites, il reçoit sa récompense

Déjà utilisé par plus de 100 commerçants en France.

Intéressé par une démo de 5 minutes ?

[Votre Nom]
06 XX XX XX XX`,
    },
  ],
  restaurant: [
    {
      subject: 'Transformez vos clients occasionnels en habitués',
      body: `Bonjour,

Un client satisfait qui ne revient pas... c'est un client perdu pour la concurrence.

Qarte vous aide à les faire revenir :
• Carte de fidélité digitale (10 repas = 1 offert)
• Notifications push pour vos offres du jour
• Aucune app à installer côté client

Le tout géré depuis votre téléphone en 2 minutes par jour.

Essai gratuit 14 jours. Je peux vous faire une démo ?

Cordialement,
[Votre Nom]`,
    },
  ],
  hairdresser: [
    {
      subject: 'Vos clients reviennent-ils tous les 6 semaines ?',
      body: `Bonjour,

Un client satisfait devrait revenir toutes les 6 semaines. En réalité, beaucoup attendent 8, 10, voire plus...

Avec Qarte :
• Offrez 1 soin gratuit après 10 visites
• Envoyez un rappel "Ça fait longtemps qu'on ne vous a pas vu !"
• Fidélisez naturellement

Le tout sans application, juste un QR code élégant au comptoir.

Intéressé(e) par 14 jours d'essai gratuit ?

[Votre Nom]`,
    },
  ],
  boutique: [
    {
      subject: 'Fidélisez vos clients sans carte plastique',
      body: `Bonjour,

Vos clients adorent votre boutique... mais reviennent-ils assez souvent ?

Avec Qarte :
• 10 achats = un cadeau ou une remise
• Notifications pour vos ventes privées
• Liste de vos meilleurs clients

Le tout géré en 2 clics depuis votre téléphone.

14 jours d'essai gratuit, ça vous dit ?

[Votre Nom]`,
    },
  ],
  cafe: [
    {
      subject: 'Le 10ème café offert, mais en digital',
      body: `Bonjour,

Le café du matin, c'est un rituel. Vos clients réguliers méritent une récompense.

Qarte = la carte de fidélité digitale :
• Le client scanne le QR à chaque café
• Au 10ème, il est notifié : "Votre café est offert !"
• Vous le fidélisez sans effort

Essai gratuit 14 jours. Intéressé(e) ?

[Votre Nom]`,
    },
  ],
  beauty: [
    {
      subject: 'Fidélisez vos clientes avec élégance',
      body: `Bonjour,

Vos clientes apprécient vos soins. Mais reviennent-elles assez régulièrement ?

Qarte vous permet de :
• Offrir un soin gratuit après X visites
• Envoyer des rappels personnalisés
• Créer des offres exclusives PWA

Une solution moderne qui correspond à l'image de votre institut.

Démo gratuite de 10 minutes ?

[Votre Nom]`,
    },
  ],
};

// Flyers B2B - Prospection commerciale par type de commerce
const flyerDesigns: Record<CommerceType, FlyerDesign[]> = {
  bakery: [
    {
      id: 'bakery-1',
      title: 'Flyer Stats',
      format: 'A5',
      style: 'stats',
      headline: 'Augmentez votre CA',
      subline: 'La fidélisation digitale pour les boulangeries',
      stats: [
        { value: '+23%', label: 'de fréquence' },
        { value: '85%', label: 'de rétention' },
        { value: '0€', label: 'de carte papier' },
      ],
      cta: '14 jours gratuits',
      colors: { primary: '#D97706', secondary: '#FCD34D', accent: '#92400E', bg: '#FFFBEB' },
    },
    {
      id: 'bakery-2',
      title: 'Flyer Avantages',
      format: 'A5',
      style: 'benefits',
      headline: 'Fini les cartes perdues',
      subline: 'Vos clients fidèles ne vous oublient plus',
      benefits: [
        'Carte 100% digitale',
        'Notifications push',
        'Stats en temps réel',
        'Setup en 5 minutes',
      ],
      cta: 'Essai gratuit',
      colors: { primary: '#78350F', secondary: '#F59E0B', accent: '#FDE68A', bg: '#FEF3C7' },
    },
    {
      id: 'bakery-3',
      title: 'Flyer Témoignage',
      format: 'A5',
      style: 'testimonial',
      headline: '"Mes clients reviennent plus souvent"',
      subline: 'Comme 100+ boulangeries en France',
      cta: 'Rejoignez-les',
      colors: { primary: '#1F2937', secondary: '#D97706', accent: '#FCD34D', bg: '#F9FAFB' },
    },
  ],
  restaurant: [
    {
      id: 'resto-1',
      title: 'Flyer Stats',
      format: 'A5',
      style: 'stats',
      headline: 'Remplissez vos tables',
      subline: 'La fidélisation qui booste votre CA',
      stats: [
        { value: '+30%', label: 'de retours' },
        { value: '2min', label: 'par jour' },
        { value: '∞', label: 'clients fidèles' },
      ],
      cta: 'Testez gratuitement',
      colors: { primary: '#DC2626', secondary: '#FCA5A5', accent: '#7F1D1D', bg: '#FEF2F2' },
    },
    {
      id: 'resto-2',
      title: 'Flyer Avantages',
      format: 'A5',
      style: 'benefits',
      headline: 'Vos habitués méritent mieux',
      subline: 'Récompensez-les automatiquement',
      benefits: [
        'Offres du jour en push',
        'Heures creuses remplies',
        'Zéro app côté client',
        'Avis Google boostés',
      ],
      cta: '14 jours offerts',
      colors: { primary: '#0F172A', secondary: '#475569', accent: '#F59E0B', bg: '#F8FAFC' },
    },
    {
      id: 'resto-3',
      title: 'Flyer Témoignage',
      format: 'A5',
      style: 'testimonial',
      headline: '"Mon mardi est maintenant plein"',
      subline: 'Grâce aux offres ciblées Qarte',
      cta: 'Découvrez comment',
      colors: { primary: '#059669', secondary: '#A7F3D0', accent: '#047857', bg: '#ECFDF5' },
    },
  ],
  hairdresser: [
    {
      id: 'hair-1',
      title: 'Flyer Stats',
      format: 'A5',
      style: 'stats',
      headline: 'Réduisez les no-shows',
      subline: 'Fidélisez vos clients automatiquement',
      stats: [
        { value: '-40%', label: 'de no-shows' },
        { value: '6 sem', label: 'entre visites' },
        { value: '100%', label: 'digital' },
      ],
      cta: 'Essayez Qarte',
      colors: { primary: '#7C3AED', secondary: '#C4B5FD', accent: '#5B21B6', bg: '#F5F3FF' },
    },
    {
      id: 'hair-2',
      title: 'Flyer Avantages',
      format: 'A5',
      style: 'benefits',
      headline: 'Le digital au service du salon',
      subline: 'Moderne et efficace',
      benefits: [
        'Rappels automatiques',
        'Fidélité sans carte',
        'Gestion smartphone',
        'Image premium',
      ],
      cta: 'Démo gratuite',
      colors: { primary: '#1F2937', secondary: '#9CA3AF', accent: '#F472B6', bg: '#FFFFFF' },
    },
    {
      id: 'hair-3',
      title: 'Flyer Témoignage',
      format: 'A5',
      style: 'testimonial',
      headline: '"Mes clientes adorent"',
      subline: 'Simple, moderne, efficace',
      cta: 'Rejoignez 50+ salons',
      colors: { primary: '#0F172A', secondary: '#C084FC', accent: '#E879F9', bg: '#FAF5FF' },
    },
  ],
  boutique: [
    {
      id: 'boutique-1',
      title: 'Flyer Stats',
      format: 'A5',
      style: 'stats',
      headline: 'Boostez vos ventes',
      subline: 'La fidélité qui fait revenir',
      stats: [
        { value: '+25%', label: 'panier moyen' },
        { value: '3x', label: 'plus de visites' },
        { value: '0', label: 'carte plastique' },
      ],
      cta: '14 jours gratuits',
      colors: { primary: '#DB2777', secondary: '#FBCFE8', accent: '#9D174D', bg: '#FDF2F8' },
    },
    {
      id: 'boutique-2',
      title: 'Flyer Avantages',
      format: 'A5',
      style: 'benefits',
      headline: 'Ventes privées faciles',
      subline: 'Ciblez vos meilleurs clients',
      benefits: [
        'Liste VIP automatique',
        'Push ventes privées',
        'Stats détaillées',
        'Setup immédiat',
      ],
      cta: 'Essai offert',
      colors: { primary: '#374151', secondary: '#9CA3AF', accent: '#F59E0B', bg: '#F9FAFB' },
    },
    {
      id: 'boutique-3',
      title: 'Flyer Témoignage',
      format: 'A5',
      style: 'testimonial',
      headline: '"Mes clientes sont fans"',
      subline: 'Du programme fidélité digital',
      cta: 'Testez aussi',
      colors: { primary: '#0F172A', secondary: '#1E293B', accent: '#EAB308', bg: '#FEFCE8' },
    },
  ],
  cafe: [
    {
      id: 'cafe-1',
      title: 'Flyer Stats',
      format: 'A5',
      style: 'stats',
      headline: 'Fidélisez vos habitués',
      subline: 'Le digital au service du café',
      stats: [
        { value: '+35%', label: 'de réguliers' },
        { value: '10sec', label: 'par scan' },
        { value: '∞', label: 'tampons digitaux' },
      ],
      cta: 'Essayez Qarte',
      colors: { primary: '#78350F', secondary: '#FDE68A', accent: '#451A03', bg: '#FEF3C7' },
    },
    {
      id: 'cafe-2',
      title: 'Flyer Avantages',
      format: 'A5',
      style: 'benefits',
      headline: 'Plus de cartes oubliées',
      subline: 'La fidélité moderne',
      benefits: [
        '10ème café offert auto',
        'Notifs personnalisées',
        'Aucune app requise',
        'QR code unique',
      ],
      cta: '14 jours offerts',
      colors: { primary: '#1C1917', secondary: '#78716C', accent: '#CA8A04', bg: '#FAFAF9' },
    },
    {
      id: 'cafe-3',
      title: 'Flyer Témoignage',
      format: 'A5',
      style: 'testimonial',
      headline: '"Simple et efficace"',
      subline: 'Mes clients adorent',
      cta: 'Rejoignez le réseau',
      colors: { primary: '#166534', secondary: '#BBF7D0', accent: '#15803D', bg: '#F0FDF4' },
    },
  ],
  beauty: [
    {
      id: 'beauty-1',
      title: 'Flyer Stats',
      format: 'A5',
      style: 'stats',
      headline: 'Fidélisez avec élégance',
      subline: 'Le digital au service de la beauté',
      stats: [
        { value: '+28%', label: 'de retours' },
        { value: 'Premium', label: 'image' },
        { value: '5min', label: 'setup' },
      ],
      cta: 'Découvrez Qarte',
      colors: { primary: '#BE185D', secondary: '#FBCFE8', accent: '#9D174D', bg: '#FDF2F8' },
    },
    {
      id: 'beauty-2',
      title: 'Flyer Avantages',
      format: 'A5',
      style: 'benefits',
      headline: 'Soignez votre image',
      subline: 'Avec une fidélité moderne',
      benefits: [
        'Rappels soins',
        'Offres exclusives',
        'Liste clientes VIP',
        'Zéro papier',
      ],
      cta: 'Essai gratuit',
      colors: { primary: '#831843', secondary: '#F9A8D4', accent: '#F472B6', bg: '#FFF1F2' },
    },
    {
      id: 'beauty-3',
      title: 'Flyer Témoignage',
      format: 'A5',
      style: 'testimonial',
      headline: '"Mes clientes sont ravies"',
      subline: 'Du programme fidélité',
      cta: 'Rejoignez-nous',
      colors: { primary: '#0F172A', secondary: '#A855F7', accent: '#C084FC', bg: '#FAF5FF' },
    },
  ],
};

// Vitrophanie B2C - Communication réseau pour les clients finaux
const vitrophanieDesigns: VitrophanieDesign[] = [
  {
    id: 'vit-network-1',
    title: 'Sticker Réseau',
    format: '20x15cm',
    style: 'network',
    mainMessage: 'Réseau Qarte',
    subMessage: 'Demandez notre carte de fidélité !',
    colors: { primary: '#6366F1', secondary: '#A5B4FC', bg: '#FFFFFF', text: '#1E1B4B' },
  },
  {
    id: 'vit-network-2',
    title: 'Sticker Multi-commerces',
    format: '25x20cm',
    style: 'network',
    mainMessage: '1 carte, tous les commerces',
    subMessage: 'Réseau Qarte - Fidélité partagée',
    colors: { primary: '#0F172A', secondary: '#6366F1', bg: '#F8FAFC', text: '#0F172A' },
  },
  {
    id: 'vit-badge-1',
    title: 'Badge Vitrine',
    format: '12x12cm',
    style: 'badge',
    mainMessage: 'Qarte',
    subMessage: 'Membre du réseau',
    colors: { primary: '#FFFFFF', secondary: '#6366F1', bg: '#6366F1', text: '#FFFFFF' },
  },
  {
    id: 'vit-badge-2',
    title: 'Badge Premium',
    format: '15x15cm',
    style: 'badge',
    mainMessage: 'Q',
    subMessage: 'Fidélité acceptée',
    colors: { primary: '#0F172A', secondary: '#EAB308', bg: '#EAB308', text: '#0F172A' },
  },
  {
    id: 'vit-minimal-1',
    title: 'Bandeau Porte',
    format: '60x8cm',
    style: 'minimal',
    mainMessage: 'RÉSEAU QARTE | CARTE DE FIDÉLITÉ ACCEPTÉE',
    colors: { primary: '#FFFFFF', secondary: '#6366F1', bg: '#0F172A', text: '#FFFFFF' },
  },
  {
    id: 'vit-minimal-2',
    title: 'Bandeau Vitrine',
    format: '80x10cm',
    style: 'minimal',
    mainMessage: 'DEMANDEZ VOTRE CARTE QARTE | VALABLE PARTOUT',
    colors: { primary: '#6366F1', secondary: '#A5B4FC', bg: '#FFFFFF', text: '#0F172A' },
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copié !
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copier
        </>
      )}
    </button>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
  description,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  description?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
            <Icon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// Flyer Preview Component - B2B Prospection
function FlyerPreview({ design, emoji }: { design: FlyerDesign; emoji: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-44 h-60 rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 cursor-pointer"
        style={{ backgroundColor: design.colors.bg }}
      >
        {/* Header band */}
        <div
          className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center"
          style={{ backgroundColor: design.colors.primary }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-black italic">Q</span>
              </div>
              <span className="text-white/90 text-[10px] font-bold tracking-wide">QARTE</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="absolute top-16 inset-x-0 bottom-0 p-3 flex flex-col">
          {/* Emoji & Headline */}
          <div className="text-center mb-2">
            <span className="text-2xl">{emoji}</span>
            <h3
              className="font-black text-sm leading-tight mt-1"
              style={{ color: design.colors.primary }}
            >
              {design.headline}
            </h3>
            <p className="text-[9px] text-gray-600 mt-0.5">{design.subline}</p>
          </div>

          {/* Stats */}
          {design.style === 'stats' && design.stats && (
            <div className="flex justify-center gap-2 my-2">
              {design.stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center px-2 py-1.5 rounded-lg"
                  style={{ backgroundColor: design.colors.primary + '10' }}
                >
                  <p
                    className="text-sm font-black"
                    style={{ color: design.colors.primary }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[7px] text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Benefits */}
          {design.style === 'benefits' && design.benefits && (
            <div className="space-y-1 my-2">
              {design.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: design.colors.primary }}
                  />
                  <span className="text-[8px] text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Testimonial */}
          {design.style === 'testimonial' && (
            <div className="my-2 text-center">
              <div className="flex justify-center gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-[8px] text-gray-500 italic">Commerçant satisfait</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto">
            <div
              className="w-full py-1.5 rounded-lg text-center font-bold text-[10px]"
              style={{
                backgroundColor: design.colors.primary,
                color: '#FFFFFF',
              }}
            >
              {design.cta}
            </div>
            <p className="text-[7px] text-gray-400 text-center mt-1">qarte.fr</p>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="font-semibold text-gray-900 text-sm">{design.title}</p>
        <p className="text-xs text-gray-500">{design.format}</p>
      </div>
    </div>
  );
}

// Vitrophanie Preview Component - B2C Réseau
function VitrophaniePreview({ design }: { design: VitrophanieDesign }) {
  if (design.style === 'minimal') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-72 h-14 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer flex items-center justify-center px-4"
          style={{ backgroundColor: design.colors.bg }}
        >
          <p
            className="text-[10px] font-black tracking-wider text-center"
            style={{ color: design.colors.text }}
          >
            {design.mainMessage}
          </p>
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">{design.title}</p>
          <p className="text-xs text-gray-500">{design.format}</p>
        </div>
      </div>
    );
  }

  if (design.style === 'badge') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-24 h-24 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center"
          style={{ backgroundColor: design.colors.bg }}
        >
          {/* Logo */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
            style={{ backgroundColor: design.colors.primary === '#FFFFFF' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }}
          >
            <span
              className="text-lg font-black italic"
              style={{ color: design.colors.text }}
            >
              {design.mainMessage}
            </span>
          </div>
          {design.subMessage && (
            <p
              className="text-[8px] font-bold"
              style={{ color: design.colors.text }}
            >
              {design.subMessage}
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">{design.title}</p>
          <p className="text-xs text-gray-500">{design.format}</p>
        </div>
      </div>
    );
  }

  // Network style - Main sticker
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-52 h-36 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
        style={{ backgroundColor: design.colors.bg }}
      >
        {/* Border */}
        <div
          className="absolute inset-2 rounded-xl border-2"
          style={{ borderColor: design.colors.primary }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
          {/* Logo */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
            style={{ backgroundColor: design.colors.primary }}
          >
            <span className="text-white text-xl font-black italic">Q</span>
          </div>

          <h3
            className="font-black text-sm leading-tight"
            style={{ color: design.colors.text }}
          >
            {design.mainMessage}
          </h3>
          {design.subMessage && (
            <p
              className="text-[10px] font-medium mt-1"
              style={{ color: design.colors.primary }}
            >
              {design.subMessage}
            </p>
          )}

          {/* Icons row */}
          <div className="flex items-center gap-2 mt-2 opacity-60">
            <Store className="w-3 h-3" style={{ color: design.colors.text }} />
            <Coffee className="w-3 h-3" style={{ color: design.colors.text }} />
            <Scissors className="w-3 h-3" style={{ color: design.colors.text }} />
            <UtensilsCrossed className="w-3 h-3" style={{ color: design.colors.text }} />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-900 text-sm">{design.title}</p>
        <p className="text-xs text-gray-500">{design.format}</p>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const [selectedType, setSelectedType] = useState<CommerceType>('bakery');

  const selectedCommerce = commerceTypes.find((c) => c.id === selectedType)!;
  const emails = emailTemplates[selectedType] || [];
  const flyers = flyerDesigns[selectedType] || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Kit Marketing
        </h1>
        <p className="mt-1 text-gray-600">
          Ressources de prospection et communication
        </p>
      </div>

      {/* Type de commerce selector */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Type de commerce ciblé (pour flyers et emails)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {commerceTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                selectedType === type.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              )}
            >
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flyers B2B avec aperçus */}
      <CollapsibleSection
        title="Flyers Prospection"
        icon={FileText}
        badge="B2B"
        description="À distribuer aux commerçants pour présenter Qarte"
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
          {flyers.map((flyer) => (
            <FlyerPreview key={flyer.id} design={flyer} emoji={selectedCommerce.emoji} />
          ))}
        </div>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Usage :</strong> Ces flyers servent à prospecter les commerçants.
            Présentez les stats, les avantages et les témoignages pour convaincre.
            Format A5 recommandé pour une bonne lisibilité.
          </p>
        </div>
      </CollapsibleSection>

      {/* Vitrophanie B2C avec aperçus */}
      <CollapsibleSection
        title="Vitrophanie Réseau"
        icon={Megaphone}
        badge="B2C"
        description="Pour les vitrines des commerçants membres du réseau"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
          {vitrophanieDesigns.map((vitrine) => (
            <VitrophaniePreview key={vitrine.id} design={vitrine} />
          ))}
        </div>
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm text-indigo-800">
            <strong>Message clé :</strong> Ces visuels communiquent aux clients finaux que le commerce
            fait partie du réseau Qarte et que la carte de fidélité est commune à tous les commerces partenaires.
            À placer en vitrine ou près de la caisse.
          </p>
        </div>
      </CollapsibleSection>

      {/* Emails de prospection */}
      <CollapsibleSection
        title="Emails de prospection"
        icon={Mail}
        badge="B2B"
        description="Templates pour contacter les commerçants"
      >
        <div className="space-y-6">
          {emails.map((email, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Objet :</p>
                  <p className="font-semibold text-gray-900">{email.subject}</p>
                </div>
                <CopyButton text={`Objet: ${email.subject}\n\n${email.body}`} />
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {email.body}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Tips généraux */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Conseils de prospection</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Meilleurs moments pour appeler
            </h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• Mardi - Jeudi : 10h-11h30</li>
              <li>• Éviter lundi (reprise) et vendredi (week-end)</li>
              <li>• Jamais pendant le rush (12h-14h pour restos)</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Arguments clés
            </h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• 14 jours gratuits, sans engagement</li>
              <li>• Pas d&apos;app à télécharger pour les clients</li>
              <li>• Setup en 5 minutes</li>
              <li>• Réseau multi-commerces = plus de valeur</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Objections fréquentes
            </h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• &quot;J&apos;ai déjà des cartes&quot; → Vos clients les perdent</li>
              <li>• &quot;C&apos;est compliqué&quot; → Démo en 5 min, je vous montre</li>
              <li>• &quot;Ça coûte cher&quot; → 14 jours gratuits pour tester</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Suivi
            </h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• Relancer sous 3 jours si pas de réponse</li>
              <li>• Proposer une démo courte (5-10 min)</li>
              <li>• Envoyer un SMS après l&apos;email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
