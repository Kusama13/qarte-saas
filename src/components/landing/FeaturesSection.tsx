import {
  Palette,
  QrCode,
  BarChart3,
  Users,
  FileDown,
  Headphones,
  Wallet,
} from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Page fidélité personnalisée',
    description: 'Votre logo, vos couleurs, votre marque. Une expérience cohérente pour vos clients.',
    available: true,
  },
  {
    icon: QrCode,
    title: 'QR code unique',
    description: 'Un seul code à imprimer et afficher. Prêt à l\'emploi en PDF haute qualité.',
    available: true,
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord en temps réel',
    description: 'Suivez vos visites, clients et récompenses avec des statistiques claires.',
    available: true,
  },
  {
    icon: Users,
    title: 'Gestion des clients',
    description: 'Retrouvez tous vos clients fidèles, leurs passages et leurs points.',
    available: true,
  },
  {
    icon: FileDown,
    title: 'Export CSV',
    description: 'Exportez votre base clients pour l\'exploiter dans vos outils marketing.',
    available: true,
  },
  {
    icon: Headphones,
    title: 'Support 7j/7',
    description: 'Une question ? Notre équipe vous répond rapidement par email.',
    available: true,
  },
  {
    icon: Wallet,
    title: 'Apple & Google Wallet',
    description: 'Vos clients pourront ajouter leur carte directement dans leur wallet.',
    available: false,
    comingSoon: true,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title">
            Tout ce qu&apos;il vous faut pour fidéliser
          </h2>
          <p className="section-subtitle">
            Des fonctionnalités pensées pour les commerçants, simples et efficaces
          </p>
        </div>

        <div className="grid gap-6 mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`card-hover relative ${
                feature.comingSoon ? 'opacity-75' : ''
              }`}
            >
              {feature.comingSoon && (
                <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium text-primary bg-primary-50 rounded-full">
                  Bientôt
                </span>
              )}
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary-50">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
