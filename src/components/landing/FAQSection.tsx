'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Combien de temps faut-il pour configurer Qarte ?',
    answer:
      'Moins de 5 minutes ! Créez votre compte, ajoutez votre logo et vos couleurs, définissez votre récompense, et c\'est prêt. Vous pouvez imprimer votre QR code immédiatement.',
  },
  {
    question: 'Mes clients ont-ils besoin d\'installer une application ?',
    answer:
      'Non, c\'est l\'avantage de Qarte ! Vos clients scannent simplement le QR code avec leur appareil photo, aucune application à télécharger. Tout fonctionne directement dans le navigateur.',
  },
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer:
      'Vous avez 15 jours pour tester toutes les fonctionnalités gratuitement, sans fournir de carte bancaire. Si vous êtes satisfait, vous passez au plan payant. Sinon, votre compte est simplement désactivé.',
  },
  {
    question: 'Puis-je résilier à tout moment ?',
    answer:
      'Absolument ! Il n\'y a aucun engagement. Vous pouvez résilier votre abonnement en un clic depuis votre tableau de bord. Votre abonnement reste actif jusqu\'à la fin de la période payée.',
  },
  {
    question: 'Faut-il une carte bancaire pour l\'essai gratuit ?',
    answer:
      'Non, aucune carte bancaire n\'est demandée pour démarrer l\'essai gratuit. Vous ne serez jamais facturé sans votre accord explicite.',
  },
  {
    question: 'Que se passe-t-il après X passages ?',
    answer:
      'Lorsqu\'un client atteint le nombre de passages requis (que vous définissez), il voit un bouton "Utiliser ma récompense" sur son téléphone. Il vous montre l\'écran, vous confirmez, et ses points sont remis à zéro pour un nouveau cycle.',
  },
  {
    question: 'Puis-je modifier ma récompense après la création ?',
    answer:
      'Oui, vous pouvez modifier votre récompense, le nombre de passages requis, votre message de bienvenue et toutes vos informations à tout moment depuis votre tableau de bord.',
  },
  {
    question: 'Mes données clients sont-elles sécurisées ?',
    answer:
      'Absolument. Nous utilisons le chiffrement SSL, stockons vos données sur des serveurs sécurisés en Europe, et respectons le RGPD. Vous restez propriétaire de toutes vos données.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white">
      <div className="px-4 mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="section-title">Questions fréquentes</h2>
          <p className="section-subtitle">
            Tout ce que vous devez savoir pour démarrer
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-6 text-left transition-colors hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300',
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                )}
              >
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
