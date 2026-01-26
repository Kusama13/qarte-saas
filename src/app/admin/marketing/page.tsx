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
  Gift,
  Star,
  Clock,
  Heart,
  Percent,
  Award,
  Users,
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
  style: 'modern' | 'classic' | 'bold';
  headline: string;
  subline: string;
  cta: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
}

interface VitrophanieDesign {
  id: string;
  title: string;
  format: string;
  style: 'sticker' | 'bandeau' | 'badge';
  message: string;
  subMessage?: string;
  colors: { primary: string; secondary: string; bg: string };
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

const flyerDesigns: Record<CommerceType, FlyerDesign[]> = {
  bakery: [
    {
      id: 'bakery-1',
      title: 'Flyer Comptoir',
      format: 'A6',
      style: 'modern',
      headline: '10 passages',
      subline: '= 1 croissant OFFERT',
      cta: 'Scannez & Cumulez !',
      colors: { primary: '#D97706', secondary: '#FCD34D', accent: '#92400E', bg: '#FFFBEB' },
    },
    {
      id: 'bakery-2',
      title: 'Flyer Sac à Pain',
      format: 'A7',
      style: 'classic',
      headline: 'Merci de votre visite !',
      subline: 'Cumulez vos passages, gagnez des récompenses',
      cta: 'Scannez le QR code',
      colors: { primary: '#78350F', secondary: '#F59E0B', accent: '#FDE68A', bg: '#FEF3C7' },
    },
    {
      id: 'bakery-3',
      title: 'Flyer Vitrine',
      format: 'A5',
      style: 'bold',
      headline: 'FIDÉLITÉ',
      subline: 'Votre 11ème baguette est offerte !',
      cta: 'Rejoignez le programme',
      colors: { primary: '#1F2937', secondary: '#D97706', accent: '#FCD34D', bg: '#F9FAFB' },
    },
  ],
  restaurant: [
    {
      id: 'resto-1',
      title: 'Set de Table',
      format: 'A4',
      style: 'modern',
      headline: '10 repas',
      subline: '= Votre prochain OFFERT',
      cta: 'Scannez maintenant !',
      colors: { primary: '#DC2626', secondary: '#FCA5A5', accent: '#7F1D1D', bg: '#FEF2F2' },
    },
    {
      id: 'resto-2',
      title: 'Carte de Visite',
      format: 'Carte',
      style: 'classic',
      headline: 'Rejoignez nos fidèles',
      subline: 'Chaque repas vous rapproche de la récompense',
      cta: 'Cumulez vos points',
      colors: { primary: '#0F172A', secondary: '#475569', accent: '#F59E0B', bg: '#F8FAFC' },
    },
    {
      id: 'resto-3',
      title: 'Flyer Addition',
      format: 'A6',
      style: 'bold',
      headline: 'MERCI !',
      subline: 'Scannez et gagnez votre prochain repas',
      cta: 'Programme fidélité',
      colors: { primary: '#059669', secondary: '#A7F3D0', accent: '#047857', bg: '#ECFDF5' },
    },
  ],
  hairdresser: [
    {
      id: 'hair-1',
      title: 'Flyer Miroir',
      format: 'A6',
      style: 'modern',
      headline: '10 coupes',
      subline: '= 1 soin OFFERT',
      cta: 'Scannez au comptoir',
      colors: { primary: '#7C3AED', secondary: '#C4B5FD', accent: '#5B21B6', bg: '#F5F3FF' },
    },
    {
      id: 'hair-2',
      title: 'Carte RDV',
      format: 'Carte',
      style: 'classic',
      headline: 'Votre prochain RDV',
      subline: 'Fidélité : cumulez vos visites',
      cta: 'Scannez le QR',
      colors: { primary: '#1F2937', secondary: '#9CA3AF', accent: '#F472B6', bg: '#FFFFFF' },
    },
    {
      id: 'hair-3',
      title: 'Flyer Premium',
      format: 'A5',
      style: 'bold',
      headline: 'VIP',
      subline: 'Devenez client privilégié',
      cta: 'Rejoignez le club',
      colors: { primary: '#0F172A', secondary: '#C084FC', accent: '#E879F9', bg: '#FAF5FF' },
    },
  ],
  boutique: [
    {
      id: 'boutique-1',
      title: 'Flyer Caisse',
      format: 'A6',
      style: 'modern',
      headline: '10 achats',
      subline: '= 1 surprise OFFERTE',
      cta: 'Rejoignez le club !',
      colors: { primary: '#DB2777', secondary: '#FBCFE8', accent: '#9D174D', bg: '#FDF2F8' },
    },
    {
      id: 'boutique-2',
      title: 'Flyer Sac',
      format: 'A7',
      style: 'classic',
      headline: 'Merci !',
      subline: 'Cumulez et profitez de remises exclusives',
      cta: 'Scannez pour commencer',
      colors: { primary: '#374151', secondary: '#9CA3AF', accent: '#F59E0B', bg: '#F9FAFB' },
    },
    {
      id: 'boutique-3',
      title: 'Flyer VIP',
      format: 'A5',
      style: 'bold',
      headline: 'EXCLU',
      subline: 'Ventes privées réservées aux fidèles',
      cta: 'Inscrivez-vous',
      colors: { primary: '#0F172A', secondary: '#1E293B', accent: '#EAB308', bg: '#FEFCE8' },
    },
  ],
  cafe: [
    {
      id: 'cafe-1',
      title: 'Dessous de Verre',
      format: 'Rond',
      style: 'modern',
      headline: '10ème café',
      subline: 'OFFERT',
      cta: 'Scannez ici !',
      colors: { primary: '#78350F', secondary: '#FDE68A', accent: '#451A03', bg: '#FEF3C7' },
    },
    {
      id: 'cafe-2',
      title: 'Affichette Comptoir',
      format: 'A5',
      style: 'classic',
      headline: 'Client fidèle ?',
      subline: 'On vous récompense !',
      cta: 'Scannez le QR',
      colors: { primary: '#1C1917', secondary: '#78716C', accent: '#CA8A04', bg: '#FAFAF9' },
    },
    {
      id: 'cafe-3',
      title: 'Flyer Table',
      format: 'A6',
      style: 'bold',
      headline: 'GRATUIT',
      subline: 'Votre café après 10 visites',
      cta: 'Commencez maintenant',
      colors: { primary: '#166534', secondary: '#BBF7D0', accent: '#15803D', bg: '#F0FDF4' },
    },
  ],
  beauty: [
    {
      id: 'beauty-1',
      title: 'Flyer Cabine',
      format: 'A6',
      style: 'modern',
      headline: '10 soins',
      subline: '= 1 soin OFFERT',
      cta: 'Scannez pour cumuler',
      colors: { primary: '#BE185D', secondary: '#FBCFE8', accent: '#9D174D', bg: '#FDF2F8' },
    },
    {
      id: 'beauty-2',
      title: 'Carte Fidélité',
      format: 'Carte',
      style: 'classic',
      headline: 'Bienvenue au club',
      subline: 'Votre beauté récompensée',
      cta: 'Rejoignez-nous',
      colors: { primary: '#831843', secondary: '#F9A8D4', accent: '#F472B6', bg: '#FFF1F2' },
    },
    {
      id: 'beauty-3',
      title: 'Flyer Premium',
      format: 'A5',
      style: 'bold',
      headline: 'EXCLUSIF',
      subline: 'Offres réservées aux fidèles',
      cta: 'Scannez & Profitez',
      colors: { primary: '#0F172A', secondary: '#A855F7', accent: '#C084FC', bg: '#FAF5FF' },
    },
  ],
};

const vitrophanieDesigns: Record<CommerceType, VitrophanieDesign[]> = {
  bakery: [
    {
      id: 'bak-vit-1',
      title: 'Sticker Vitrine',
      format: '30x20cm',
      style: 'sticker',
      message: '10 passages = 1 croissant',
      subMessage: 'Scannez le QR !',
      colors: { primary: '#D97706', secondary: '#FCD34D', bg: '#FFFBEB' },
    },
    {
      id: 'bak-vit-2',
      title: 'Bandeau Porte',
      format: '60x10cm',
      style: 'bandeau',
      message: 'PROGRAMME FIDÉLITÉ DIGITAL',
      colors: { primary: '#78350F', secondary: '#F59E0B', bg: '#1F2937' },
    },
    {
      id: 'bak-vit-3',
      title: 'Badge Caisse',
      format: '15x15cm',
      style: 'badge',
      message: 'Scannez-moi !',
      subMessage: 'Fidélité',
      colors: { primary: '#FFFFFF', secondary: '#D97706', bg: '#D97706' },
    },
  ],
  restaurant: [
    {
      id: 'resto-vit-1',
      title: 'Sticker Entrée',
      format: '40x30cm',
      style: 'sticker',
      message: '10 repas = 1 OFFERT',
      subMessage: 'Programme Fidélité',
      colors: { primary: '#DC2626', secondary: '#FCA5A5', bg: '#FEF2F2' },
    },
    {
      id: 'resto-vit-2',
      title: 'Bandeau Vitrine',
      format: '80x15cm',
      style: 'bandeau',
      message: 'FIDÉLITÉ DIGITALE | CUMULEZ VOS REPAS',
      colors: { primary: '#FFFFFF', secondary: '#DC2626', bg: '#0F172A' },
    },
    {
      id: 'resto-vit-3',
      title: 'Badge Table',
      format: '10x10cm',
      style: 'badge',
      message: 'QR',
      subMessage: 'Fidélité',
      colors: { primary: '#FFFFFF', secondary: '#059669', bg: '#059669' },
    },
  ],
  hairdresser: [
    {
      id: 'hair-vit-1',
      title: 'Sticker Miroir',
      format: '25x15cm',
      style: 'sticker',
      message: '10 coupes = 1 soin offert',
      subMessage: 'Scannez au comptoir',
      colors: { primary: '#7C3AED', secondary: '#C4B5FD', bg: '#F5F3FF' },
    },
    {
      id: 'hair-vit-2',
      title: 'Bandeau Vitrine',
      format: '60x12cm',
      style: 'bandeau',
      message: 'FIDÉLITÉ DIGITALE',
      colors: { primary: '#FFFFFF', secondary: '#7C3AED', bg: '#1F2937' },
    },
    {
      id: 'hair-vit-3',
      title: 'Badge Comptoir',
      format: '12x12cm',
      style: 'badge',
      message: 'SCAN',
      subMessage: 'Fidélité',
      colors: { primary: '#FFFFFF', secondary: '#F472B6', bg: '#7C3AED' },
    },
  ],
  boutique: [
    {
      id: 'bout-vit-1',
      title: 'Sticker Porte',
      format: '30x20cm',
      style: 'sticker',
      message: '10 achats = 1 cadeau',
      subMessage: 'Rejoignez le club',
      colors: { primary: '#DB2777', secondary: '#FBCFE8', bg: '#FDF2F8' },
    },
    {
      id: 'bout-vit-2',
      title: 'Bandeau Vitrine',
      format: '70x12cm',
      style: 'bandeau',
      message: 'PROGRAMME VIP | FIDÉLITÉ DIGITALE',
      colors: { primary: '#FFFFFF', secondary: '#EAB308', bg: '#0F172A' },
    },
    {
      id: 'bout-vit-3',
      title: 'Badge Caisse',
      format: '15x15cm',
      style: 'badge',
      message: 'VIP',
      subMessage: 'Scannez',
      colors: { primary: '#0F172A', secondary: '#EAB308', bg: '#EAB308' },
    },
  ],
  cafe: [
    {
      id: 'cafe-vit-1',
      title: 'Sticker Comptoir',
      format: '25x15cm',
      style: 'sticker',
      message: '10ème café OFFERT',
      subMessage: 'Scannez ici',
      colors: { primary: '#78350F', secondary: '#FDE68A', bg: '#FEF3C7' },
    },
    {
      id: 'cafe-vit-2',
      title: 'Bandeau Machine',
      format: '40x8cm',
      style: 'bandeau',
      message: 'FIDÉLITÉ | SCANNEZ & GAGNEZ',
      colors: { primary: '#FFFFFF', secondary: '#78350F', bg: '#1C1917' },
    },
    {
      id: 'cafe-vit-3',
      title: 'Badge Table',
      format: '8x8cm',
      style: 'badge',
      message: '☕',
      subMessage: '10 = 1',
      colors: { primary: '#FFFFFF', secondary: '#166534', bg: '#166534' },
    },
  ],
  beauty: [
    {
      id: 'beauty-vit-1',
      title: 'Sticker Vitrine',
      format: '35x25cm',
      style: 'sticker',
      message: 'Fidélité Beauté',
      subMessage: '10 soins = 1 offert',
      colors: { primary: '#BE185D', secondary: '#FBCFE8', bg: '#FDF2F8' },
    },
    {
      id: 'beauty-vit-2',
      title: 'Bandeau Élégant',
      format: '60x10cm',
      style: 'bandeau',
      message: 'CLUB PRIVILÈGE | FIDÉLITÉ DIGITALE',
      colors: { primary: '#FFFFFF', secondary: '#A855F7', bg: '#831843' },
    },
    {
      id: 'beauty-vit-3',
      title: 'Badge Premium',
      format: '12x12cm',
      style: 'badge',
      message: '✨',
      subMessage: 'Club VIP',
      colors: { primary: '#831843', secondary: '#F472B6', bg: '#FBCFE8' },
    },
  ],
};

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
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
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
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">
              {badge}
            </span>
          )}
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

// Flyer Preview Component
function FlyerPreview({ design, emoji }: { design: FlyerDesign; emoji: string }) {
  const isRound = design.format === 'Rond';
  const isCard = design.format === 'Carte';

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'relative overflow-hidden shadow-xl transition-transform hover:scale-105 cursor-pointer',
          isRound ? 'w-32 h-32 rounded-full' : isCard ? 'w-40 h-24 rounded-xl' : 'w-40 h-56 rounded-2xl'
        )}
        style={{ backgroundColor: design.colors.bg }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${design.colors.primary} 1px, transparent 0)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
          {/* Emoji */}
          <span className={cn('mb-1', isRound ? 'text-2xl' : 'text-3xl')}>{emoji}</span>

          {/* Headline */}
          <h3
            className={cn(
              'font-black leading-tight',
              design.style === 'bold' ? 'text-lg tracking-tight' : 'text-base',
              isRound && 'text-sm'
            )}
            style={{ color: design.colors.primary }}
          >
            {design.headline}
          </h3>

          {/* Subline */}
          <p
            className={cn('font-semibold mt-0.5', isRound ? 'text-[8px]' : 'text-xs')}
            style={{ color: design.colors.accent }}
          >
            {design.subline}
          </p>

          {/* QR Code placeholder */}
          {!isRound && (
            <div
              className="mt-3 w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: design.colors.primary + '15' }}
            >
              <QrCode className="w-8 h-8" style={{ color: design.colors.primary }} />
            </div>
          )}

          {/* CTA */}
          <div
            className={cn(
              'mt-2 px-3 py-1 rounded-full font-bold',
              isRound ? 'text-[7px]' : 'text-[10px]'
            )}
            style={{
              backgroundColor: design.colors.primary,
              color: design.colors.bg,
            }}
          >
            {design.cta}
          </div>
        </div>

        {/* Decorative corner */}
        {!isRound && (
          <div
            className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full opacity-20"
            style={{ backgroundColor: design.colors.secondary }}
          />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="font-semibold text-gray-900 text-sm">{design.title}</p>
        <p className="text-xs text-gray-500">{design.format}</p>
      </div>
    </div>
  );
}

// Vitrophanie Preview Component
function VitrophaniePreview({ design }: { design: VitrophanieDesign }) {
  if (design.style === 'bandeau') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-64 h-12 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: design.colors.bg }}
        >
          <p
            className="text-[10px] font-black tracking-wider"
            style={{ color: design.colors.primary }}
          >
            {design.message}
          </p>
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
          className="relative w-20 h-20 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center"
          style={{ backgroundColor: design.colors.bg }}
        >
          <span className="text-2xl">{design.message}</span>
          {design.subMessage && (
            <p
              className="text-[8px] font-bold mt-1"
              style={{ color: design.colors.primary }}
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

  // Sticker style
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-48 h-32 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
        style={{ backgroundColor: design.colors.bg }}
      >
        {/* Border effect */}
        <div
          className="absolute inset-2 rounded-xl border-2 border-dashed"
          style={{ borderColor: design.colors.primary + '40' }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
          <h3
            className="font-black text-base leading-tight"
            style={{ color: design.colors.primary }}
          >
            {design.message}
          </h3>
          {design.subMessage && (
            <p
              className="text-xs font-semibold mt-1"
              style={{ color: design.colors.primary + 'CC' }}
            >
              {design.subMessage}
            </p>
          )}

          {/* QR placeholder */}
          <div
            className="mt-2 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: design.colors.primary + '15' }}
          >
            <QrCode className="w-6 h-6" style={{ color: design.colors.primary }} />
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
  const vitrines = vitrophanieDesigns[selectedType] || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Kit Marketing
        </h1>
        <p className="mt-1 text-gray-600">
          Ressources de prospection et communication par type de commerce
        </p>
      </div>

      {/* Type de commerce selector */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sélectionnez le type de commerce
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

      {/* Flyers avec aperçus */}
      <CollapsibleSection title="Flyers" icon={FileText} badge="3 modèles" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
          {flyers.map((flyer) => (
            <FlyerPreview key={flyer.id} design={flyer} emoji={selectedCommerce.emoji} />
          ))}
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            <strong>Conseil :</strong> Imprimez en format A6 pour le comptoir, A7 pour les sacs, A5 pour la vitrine.
            Utilisez un papier mat 170g pour un rendu professionnel.
          </p>
        </div>
      </CollapsibleSection>

      {/* Vitrophanie avec aperçus */}
      <CollapsibleSection title="Vitrophanie" icon={Megaphone} badge="3 modèles">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
          {vitrines.map((vitrine) => (
            <VitrophaniePreview key={vitrine.id} design={vitrine} />
          ))}
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            <strong>Conseil :</strong> Placez les stickers à hauteur des yeux. Le bandeau fonctionne bien en bas de vitrine.
            Les badges sont parfaits près de la caisse ou sur les tables.
          </p>
        </div>
      </CollapsibleSection>

      {/* Emails de prospection */}
      <CollapsibleSection title="Emails de prospection" icon={Mail}>
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
              <li>• Déjà 100+ commerçants utilisateurs</li>
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
