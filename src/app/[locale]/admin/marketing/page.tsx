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
  Clock,
  Award,
  Users,
  Star,
  Wand2,
  ExternalLink,
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

interface FlyerPrompt {
  id: string;
  title: string;
  prompt: string;
  tips: string[];
}

interface VitrophaniePrompt {
  id: string;
  title: string;
  prompt: string;
  tips: string[];
}

// AI Image Generators recommendations
const aiGenerators = [
  {
    name: 'Midjourney',
    description: 'Meilleure qualité, style professionnel',
    url: 'https://midjourney.com',
    badge: 'Recommandé',
    color: 'emerald',
  },
  {
    name: 'DALL-E 3',
    description: 'Via ChatGPT Plus, bon pour le texte',
    url: 'https://chat.openai.com',
    badge: null,
    color: 'blue',
  },
  {
    name: 'Ideogram',
    description: 'Excellent pour le texte dans les images',
    url: 'https://ideogram.ai',
    badge: 'Texte',
    color: 'violet',
  },
  {
    name: 'Leonardo.ai',
    description: 'Gratuit, licence commerciale',
    url: 'https://leonardo.ai',
    badge: 'Gratuit',
    color: 'amber',
  },
  {
    name: 'Adobe Firefly',
    description: 'Commercial safe, intégré à Creative Cloud',
    url: 'https://firefly.adobe.com',
    badge: null,
    color: 'red',
  },
  {
    name: 'Canva AI',
    description: 'Simple, templates inclus',
    url: 'https://canva.com',
    badge: 'Facile',
    color: 'cyan',
  },
];

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

Je vous propose 7 jours d'essai gratuit, sans engagement.

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

Essai gratuit 7 jours. Je peux vous faire une démo ?

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

Intéressé(e) par 7 jours d'essai gratuit ?

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

7 jours d'essai gratuit, ça vous dit ?

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

Essai gratuit 7 jours. Intéressé(e) ?

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

// Flyers B2B - Un prompt optimisé par type de commerce
const flyerPrompts: Record<CommerceType, FlyerPrompt> = {
  bakery: {
    id: 'bakery-flyer',
    title: 'Flyer Boulangerie',
    prompt: `Create a professional A5 flyer for "Qarte" digital loyalty card solution targeting bakeries.

HEADLINE: "Fini les cartes à tampons perdues"
SUBLINE: "La fidélisation digitale pour les boulangeries"

KEY STATS to display prominently:
• +23% de fréquence client
• 85% de rétention
• 0€ de carte papier

VISUAL ELEMENTS:
- Warm bakery colors (golden, brown, cream)
- QR code mockup on a smartphone screen
- Croissants/baguettes in background (subtle, blurred)
- Clean, modern design
- "Qarte" logo with purple/indigo branding

BENEFITS LIST:
✓ Carte 100% digitale
✓ Aucune app à télécharger
✓ Setup en 5 minutes
✓ Notifications push

CTA BUTTON: "7 jours gratuits" or "Essai gratuit"
FOOTER: "getqarte.com | La fidélité simplifiée"

Style: Professional, trustworthy, modern SaaS marketing. Clean typography. High contrast. Print-ready A5 format.`,
    tips: [
      'Ajoutez --ar 2:3 pour le ratio A5 portrait',
      'Utilisez --style raw pour moins de stylisation artistique',
      'Demandez "print-ready, CMYK colors" pour l\'impression',
    ],
  },
  restaurant: {
    id: 'restaurant-flyer',
    title: 'Flyer Restaurant',
    prompt: `Create a professional A5 flyer for "Qarte" digital loyalty solution targeting restaurants.

HEADLINE: "Remplissez vos tables creuses"
SUBLINE: "La fidélisation qui booste votre CA"

KEY STATS to display:
• +30% de clients réguliers
• 2 min/jour de gestion
• -40% de no-shows

VISUAL ELEMENTS:
- Restaurant ambiance (warm lighting, elegant)
- Smartphone showing loyalty card interface
- Subtle food elements (not too prominent)
- Modern, clean design
- "Qarte" branding (purple/indigo)

BENEFITS:
✓ Offres du jour en notification push
✓ Heures creuses remplies
✓ Zéro app côté client
✓ Avis Google boostés

CTA: "Testez gratuitement 7 jours"
FOOTER: "getqarte.com"

Style: Upscale restaurant marketing, professional, clean lines, appetizing but not food-focused. B2B tone, convincing stats layout.`,
    tips: [
      'Précisez "no text" si vous voulez ajouter le texte après dans Canva',
      'Utilisez des couleurs chaudes pour l\'ambiance restaurant',
      'Évitez trop de détails food pour rester B2B',
    ],
  },
  hairdresser: {
    id: 'hairdresser-flyer',
    title: 'Flyer Coiffeur',
    prompt: `Create a professional A5 flyer for "Qarte" digital loyalty system targeting hair salons.

HEADLINE: "Réduisez vos no-shows de 40%"
SUBLINE: "La fidélisation digitale pour les salons de coiffure"

KEY STATS:
• -40% de rendez-vous manqués
• 6 semaines entre visites (vs 10 sans fidélité)
• 100% digital, 0 carte plastique

VISUAL ELEMENTS:
- Modern salon aesthetic (clean, minimalist)
- Smartphone with QR code scan
- Subtle scissors/salon elements
- Premium, elegant feel
- Purple/violet tones matching "Qarte" brand

BENEFITS:
✓ Rappels automatiques
✓ Fidélité sans carte physique
✓ Gestion depuis smartphone
✓ Image premium

CTA: "Démo gratuite de 5 min"
FOOTER: "getqarte.com | Rejoignez 50+ salons"

Style: Clean, premium, modern salon marketing. Elegant typography. Professional B2B pitch targeting salon owners.`,
    tips: [
      'Tons violets/roses pour l\'univers coiffure',
      'Style épuré et premium',
      'Évitez les images de personnes pour plus de flexibilité',
    ],
  },
  boutique: {
    id: 'boutique-flyer',
    title: 'Flyer Boutique',
    prompt: `Create a professional A5 flyer for "Qarte" digital loyalty card targeting retail boutiques.

HEADLINE: "Transformez vos visiteurs en clients fidèles"
SUBLINE: "La fidélisation digitale pour les boutiques"

KEY STATS:
• +25% de panier moyen
• 3x plus de visites répétées
• 0 carte plastique à gérer

VISUAL ELEMENTS:
- Chic boutique aesthetic
- Shopping bags (subtle)
- Smartphone with loyalty app
- Modern, fashionable design
- "Qarte" purple branding

BENEFITS:
✓ Liste VIP automatique
✓ Push ventes privées
✓ Stats détaillées
✓ Setup immédiat

CTA: "Essai gratuit 7 jours"
FOOTER: "getqarte.com | La fidélité simplifiée"

Style: Fashion-forward, chic, boutique marketing. Clean and sophisticated. Appeals to boutique owners who care about brand image.`,
    tips: [
      'Couleurs neutres + touches dorées pour le luxe',
      'Style magazine mode',
      'Mise en avant du côté "VIP" et exclusif',
    ],
  },
  cafe: {
    id: 'cafe-flyer',
    title: 'Flyer Café',
    prompt: `Create a professional A5 flyer for "Qarte" digital loyalty program targeting cafés and coffee shops.

HEADLINE: "Le 10ème café offert, automatiquement"
SUBLINE: "La fidélisation digitale pour les cafés"

KEY STATS:
• +35% de clients réguliers
• 10 secondes par scan
• Tampons digitaux illimités

VISUAL ELEMENTS:
- Coffee shop warmth (brown, cream tones)
- Smartphone scanning QR code
- Coffee cup silhouette (subtle)
- Cozy but professional feel
- "Qarte" branding

BENEFITS:
✓ Plus de cartes oubliées
✓ Notifications personnalisées
✓ Aucune app requise
✓ QR code unique

CTA: "7 jours offerts"
FOOTER: "getqarte.com"

Style: Warm, inviting, coffee shop aesthetic but professional B2B marketing. Stats-driven, convincing.`,
    tips: [
      'Tons café (marron, crème, beige)',
      'Ambiance chaleureuse mais pro',
      'QR code bien visible',
    ],
  },
  beauty: {
    id: 'beauty-flyer',
    title: 'Flyer Institut Beauté',
    prompt: `Create a professional A5 flyer for "Qarte" digital loyalty solution targeting beauty salons and spas.

HEADLINE: "Fidélisez vos clientes avec élégance"
SUBLINE: "La solution digitale premium pour instituts de beauté"

KEY STATS:
• +28% de retours clients
• Image premium garantie
• Setup en 5 minutes

VISUAL ELEMENTS:
- Elegant spa/beauty aesthetic
- Soft pink, rose gold, white palette
- Smartphone with sleek interface
- Luxurious, feminine feel
- "Qarte" subtle branding

BENEFITS:
✓ Rappels soins automatiques
✓ Offres exclusives
✓ Liste clientes VIP
✓ Zéro papier

CTA: "Essai gratuit"
FOOTER: "getqarte.com | La beauté de la fidélité"

Style: Luxurious, feminine, spa marketing. Clean, soft colors. Premium feel that matches high-end beauty institutes.`,
    tips: [
      'Rose gold + blanc pour le luxe féminin',
      'Style épuré et élégant',
      'Évitez les photos de visages (droit à l\'image)',
    ],
  },
};

// Vitrophanie B2C - Un prompt unique pour tous les commerces
const vitrophaniePrompt: VitrophaniePrompt = {
  id: 'vitrophanie-network',
  title: 'Vitrophanie Réseau Qarte',
  prompt: `Create a professional window sticker design for "Qarte" loyalty network.

FORMAT: Multiple sizes needed:
1. Square badge (15x15cm) - for shop windows
2. Horizontal banner (60x10cm) - for doors
3. Main sticker (25x20cm) - primary window display

MAIN MESSAGE: "Réseau Qarte"
SECONDARY: "1 carte, tous les commerces" or "Demandez notre carte de fidélité !"

VISUAL ELEMENTS:
- "Q" logo prominent (stylized, italic, bold)
- Purple/indigo primary color (#6366F1)
- Clean white background option
- Dark navy option (#0F172A)
- Gold accent option for premium look
- Small commerce icons (store, coffee, scissors, fork) in a row

TEXT OPTIONS:
• "MEMBRE DU RÉSEAU QARTE"
• "FIDÉLITÉ ACCEPTÉE ICI"
• "CARTE DIGITALE ACCEPTÉE"
• "1 CARTE POUR TOUS LES COMMERCES"

BADGE STYLE:
- Round seal/stamp aesthetic
- "Certified member" feel
- Trust badge design

BANNER STYLE:
- Horizontal strip
- Bold text, high contrast
- Readable from distance

Style: Professional storefront signage. High contrast for visibility. Must work on glass (transparent/white options). Trust-building, network membership feel.`,
  tips: [
    'Générez plusieurs variations (badge, bandeau, sticker)',
    'Demandez "transparent background" pour usage sur vitrine',
    'Couleurs: violet Qarte (#6366F1) + blanc ou noir',
    'Texte lisible de loin = gros et gras',
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
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#5167fc] bg-[#5167fc]/10 rounded-lg hover:bg-[#5167fc]/20 transition-colors"
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
    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#5167fc]/10">
            <Icon className="w-5 h-5 text-[#5167fc]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#5167fc]/10 text-[#5167fc] rounded-full">
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

// Prompt Card Component
function PromptCard({ prompt, tips, title }: { prompt: string; tips: string[]; title: string }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-white" />
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <CopyButton text={prompt} />
      </div>
      <div className="p-4 bg-gray-900">
        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
          {prompt}
        </pre>
      </div>
      {tips.length > 0 && (
        <div className="p-4 bg-amber-50 border-t border-amber-100">
          <p className="text-xs font-semibold text-amber-800 mb-2">💡 Conseils :</p>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="text-xs text-amber-700">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MarketingPage() {
  const [selectedType, setSelectedType] = useState<CommerceType>('bakery');

  const selectedCommerce = commerceTypes.find((c) => c.id === selectedType)!;
  const emails = emailTemplates[selectedType] || [];
  const flyerPrompt = flyerPrompts[selectedType];

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

      {/* AI Generators */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Générateurs d&apos;images IA</h2>
            <p className="text-sm text-gray-600">Utilisez ces outils avec les prompts ci-dessous</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {aiGenerators.map((gen) => (
            <a
              key={gen.name}
              href={gen.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 text-sm">{gen.name}</span>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-violet-500" />
              </div>
              <p className="text-[10px] text-gray-500 text-center leading-tight">{gen.description}</p>
              {gen.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-full",
                  gen.color === 'emerald' && "bg-[#5167fc]/10 text-[#5167fc]",
                  gen.color === 'blue' && "bg-blue-100 text-blue-700",
                  gen.color === 'violet' && "bg-violet-100 text-violet-700",
                  gen.color === 'amber' && "bg-amber-100 text-amber-700",
                  gen.color === 'red' && "bg-red-100 text-red-700",
                  gen.color === 'cyan' && "bg-cyan-100 text-cyan-700",
                )}>
                  {gen.badge}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Type de commerce selector */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Type de commerce ciblé (pour flyers et emails)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {commerceTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                selectedType === type.id
                  ? 'border-[#5167fc] bg-[#5167fc]/5 text-[#5167fc]'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              )}
            >
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flyers B2B - Prompts IA */}
      <CollapsibleSection
        title="Flyers Prospection"
        icon={FileText}
        badge="B2B"
        description="Prompts pour générer des flyers avec l'IA"
        defaultOpen={true}
      >
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{selectedCommerce.emoji}</span>
            <h3 className="font-semibold text-gray-900">Prompt pour {selectedCommerce.label}</h3>
          </div>

          <PromptCard
            title={flyerPrompt.title}
            prompt={flyerPrompt.prompt}
            tips={flyerPrompt.tips}
          />

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Usage :</strong> Copiez ce prompt et collez-le dans Midjourney, DALL-E ou autre.
              Ajustez les stats et messages selon vos besoins. Format A5 recommandé pour impression.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Vitrophanie B2C - Prompt IA */}
      <CollapsibleSection
        title="Vitrophanie Réseau"
        icon={Megaphone}
        badge="B2C"
        description="Prompt pour générer les stickers vitrine"
      >
        <div className="space-y-4 pt-4">
          <PromptCard
            title={vitrophaniePrompt.title}
            prompt={vitrophaniePrompt.prompt}
            tips={vitrophaniePrompt.tips}
          />

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-800">
              <strong>Message clé :</strong> Ces visuels communiquent aux clients finaux que le commerce
              fait partie du réseau Qarte. La carte de fidélité est commune à tous les commerces partenaires.
              Générez plusieurs formats : badge carré, bandeau horizontal, sticker principal.
            </p>
          </div>
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
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
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
      <div className="bg-gradient-to-br from-[#5167fc] to-[#7c3aed] rounded-lg p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Conseils de prospection</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white/10 rounded-lg p-4">
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
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Arguments clés
            </h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• 7 jours gratuits, sans engagement</li>
              <li>• Pas d&apos;app à télécharger pour les clients</li>
              <li>• Setup en 5 minutes</li>
              <li>• Réseau multi-commerces = plus de valeur</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Objections fréquentes
            </h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• &quot;J&apos;ai déjà des cartes&quot; → Vos clients les perdent</li>
              <li>• &quot;C&apos;est compliqué&quot; → Démo en 5 min, je vous montre</li>
              <li>• &quot;Ça coûte cher&quot; → 7 jours gratuits pour tester</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
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
