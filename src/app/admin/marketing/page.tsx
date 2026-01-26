'use client';

import { useState } from 'react';
import {
  Mail,
  FileText,
  Image,
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
  Palette,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

type CommerceType = 'bakery' | 'restaurant' | 'hairdresser' | 'boutique' | 'cafe' | 'beauty';

const commerceTypes: { id: CommerceType; label: string; icon: React.ElementType }[] = [
  { id: 'bakery', label: 'Boulangerie', icon: Store },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { id: 'hairdresser', label: 'Coiffeur', icon: Scissors },
  { id: 'boutique', label: 'Boutique', icon: ShoppingBag },
  { id: 'cafe', label: 'Café / Bar', icon: Coffee },
  { id: 'beauty', label: 'Institut beauté', icon: Sparkles },
];

interface EmailTemplate {
  subject: string;
  body: string;
}

interface FlyerIdea {
  title: string;
  description: string;
  callToAction: string;
}

interface VitrophanieIdea {
  title: string;
  message: string;
  placement: string;
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
    {
      subject: 'Comment augmenter vos réservations hors rush',
      body: `Bonjour,

Le mardi et mercredi sont calmes ? C'est normal.

Avec Qarte, envoyez des offres ciblées à vos clients fidèles :
"Ce mardi, plat + dessert = -20% pour nos fidèles !"

Résultat : vous remplissez vos tables creuses avec des clients qui vous connaissent déjà.

On en parle 10 minutes cette semaine ?

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
    {
      subject: 'La fidélisation digitale adaptée aux salons de coiffure',
      body: `Bonjour,

Les cartes à tampons papier, c'est fini. Vos clients les perdent, les oublient...

Qarte remplace tout ça par un QR code :
• Le client scanne après sa coupe
• Il voit sa progression en temps réel
• Vous lui offrez un soin après X visites

Simple, moderne, efficace.

On prend 5 minutes pour en parler ?

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

const flyerIdeas: Record<CommerceType, FlyerIdea[]> = {
  bakery: [
    {
      title: 'Flyer comptoir A5',
      description: 'Design chaleureux avec photo de viennoiseries. Mettre en avant "10 passages = 1 croissant offert".',
      callToAction: 'Scannez le QR code et commencez à cumuler !',
    },
    {
      title: 'Flyer sac à pain',
      description: 'Petit flyer inséré dans le sac. Simple et direct.',
      callToAction: 'Votre fidélité récompensée ! Scannez et gagnez.',
    },
  ],
  restaurant: [
    {
      title: 'Set de table',
      description: 'Intégrer le QR code dans le design du set de table avec explication du programme.',
      callToAction: '10 repas = 1 repas offert. Scannez maintenant !',
    },
    {
      title: 'Carte de visite QR',
      description: 'Recto : infos du restaurant. Verso : QR fidélité avec "Rejoignez nos fidèles".',
      callToAction: 'Cumulez vos points à chaque visite.',
    },
  ],
  hairdresser: [
    {
      title: 'Flyer miroir',
      description: 'Petit flyer élégant posé sur le miroir ou au comptoir.',
      callToAction: '10 coupes = 1 soin offert. Scannez pour commencer.',
    },
    {
      title: 'Carte rendez-vous',
      description: 'Recto : prochain RDV. Verso : QR fidélité.',
      callToAction: 'Cumulez vos points à chaque visite !',
    },
  ],
  boutique: [
    {
      title: 'Flyer caisse A6',
      description: 'Format carte postale avec visuel tendance et QR code.',
      callToAction: '10 achats = une surprise ! Rejoignez le club.',
    },
    {
      title: 'Flyer sac shopping',
      description: 'Inséré dans le sac après achat.',
      callToAction: 'Merci de votre visite ! Scannez pour cumuler.',
    },
  ],
  cafe: [
    {
      title: 'Dessous de verre',
      description: 'QR code imprimé sur dessous de verre en carton.',
      callToAction: '10 cafés = 1 offert. Scannez ici !',
    },
    {
      title: 'Affichette comptoir',
      description: 'Format A5 vertical à côté de la caisse.',
      callToAction: 'Fidèle au café ? On vous récompense !',
    },
  ],
  beauty: [
    {
      title: 'Flyer cabine',
      description: 'Flyer élégant format A6 posé en cabine pendant les soins.',
      callToAction: 'Votre beauté récompensée. 10 visites = 1 soin offert.',
    },
    {
      title: 'Carte de fidélité visuelle',
      description: 'Design premium avec QR code intégré.',
      callToAction: 'Rejoignez notre programme fidélité digital.',
    },
  ],
};

const vitrophanieIdeas: Record<CommerceType, VitrophanieIdea[]> = {
  bakery: [
    {
      title: 'Sticker vitrine principal',
      message: '10 passages = 1 croissant offert',
      placement: 'Vitrine principale, à hauteur des yeux',
    },
    {
      title: 'QR géant',
      message: 'Scannez-moi !',
      placement: 'Porte d\'entrée',
    },
  ],
  restaurant: [
    {
      title: 'Bandeau vitrine',
      message: 'Programme fidélité | 10 repas = 1 offert',
      placement: 'Bas de vitrine ou haut de porte',
    },
  ],
  hairdresser: [
    {
      title: 'Sticker miroir caisse',
      message: 'Scannez et cumulez vos points fidélité',
      placement: 'Miroir près de la caisse',
    },
  ],
  boutique: [
    {
      title: 'Sticker porte',
      message: 'Fidélité digitale | Scannez & Gagnez',
      placement: 'Porte d\'entrée, côté intérieur',
    },
  ],
  cafe: [
    {
      title: 'Sticker comptoir',
      message: '10ème café offert !',
      placement: 'Face au comptoir, visible des clients',
    },
  ],
  beauty: [
    {
      title: 'Vitrophanie élégante',
      message: 'Fidélité beauté | Scannez pour vos avantages',
      placement: 'Vitrine, design minimaliste',
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
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
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

export default function MarketingPage() {
  const [selectedType, setSelectedType] = useState<CommerceType>('bakery');

  const emails = emailTemplates[selectedType] || [];
  const flyers = flyerIdeas[selectedType] || [];
  const vitrines = vitrophanieIdeas[selectedType] || [];

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
              <type.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emails de prospection */}
      <CollapsibleSection title="Emails de prospection" icon={Mail} defaultOpen={true}>
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

      {/* Idées de Flyers */}
      <CollapsibleSection title="Idées de Flyers" icon={FileText}>
        <div className="grid gap-4 md:grid-cols-2">
          {flyers.map((flyer, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Image className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">{flyer.title}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">{flyer.description}</p>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <p className="text-sm font-medium text-emerald-800">
                  Call-to-action : {flyer.callToAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Idées de Vitrophanie */}
      <CollapsibleSection title="Idées de Vitrophanie" icon={Palette}>
        <div className="grid gap-4 md:grid-cols-2">
          {vitrines.map((vitrine, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">{vitrine.title}</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Type className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Message :</span> {vitrine.message}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Megaphone className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Placement :</span> {vitrine.placement}
                  </p>
                </div>
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
            <h3 className="font-medium mb-2">Meilleurs moments pour appeler</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• Mardi - Jeudi : 10h-11h30</li>
              <li>• Éviter lundi (reprise) et vendredi (week-end)</li>
              <li>• Jamais pendant le rush (12h-14h pour restos)</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2">Arguments clés</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• 14 jours gratuits, sans engagement</li>
              <li>• Pas d&apos;app à télécharger pour les clients</li>
              <li>• Setup en 5 minutes</li>
              <li>• Déjà 100+ commerçants utilisateurs</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2">Objections fréquentes</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• &quot;J&apos;ai déjà des cartes&quot; → Vos clients les perdent</li>
              <li>• &quot;C&apos;est compliqué&quot; → Démo en 5 min, je vous montre</li>
              <li>• &quot;Ça coûte cher&quot; → 14 jours gratuits pour tester</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-2">Suivi</h3>
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
