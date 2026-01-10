import { Store, QrCode, BarChart3, Smartphone, ScanLine, Gift } from 'lucide-react';

const merchantSteps = [
  {
    icon: Store,
    step: '1',
    title: 'Créez votre compte',
    description: 'Inscrivez-vous en 1 minute avec les informations de votre commerce.',
  },
  {
    icon: QrCode,
    step: '2',
    title: 'Personnalisez votre QR code',
    description: 'Ajoutez votre logo, choisissez vos couleurs et définissez votre récompense.',
  },
  {
    icon: BarChart3,
    step: '3',
    title: 'Suivez vos clients',
    description: 'Consultez vos statistiques et gérez vos clients fidèles en temps réel.',
  },
];

const customerSteps = [
  {
    icon: ScanLine,
    step: '1',
    title: 'Scannez le QR code',
    description: 'Flashez le code avec votre smartphone, aucune application requise.',
  },
  {
    icon: Gift,
    step: '2',
    title: 'Gagnez des récompenses',
    description: 'Cumulez vos passages et recevez votre récompense automatiquement.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title">Comment ça marche ?</h2>
          <p className="section-subtitle">
            Simple pour vous, simple pour vos clients
          </p>
        </div>

        <div className="grid gap-12 mt-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Pour les commerçants</h3>
            </div>

            <div className="space-y-6">
              {merchantSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-xl bg-primary">
                      {step.step}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Pour les clients</h3>
            </div>

            <div className="space-y-6">
              {customerSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-xl bg-secondary">
                      {step.step}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
