import { CreditCard, Printer, UserX, Leaf } from 'lucide-react';

const problems = [
  {
    icon: CreditCard,
    title: 'Cartes perdues',
    description: 'Vos clients perdent leurs cartes papier et abandonnent leur fidélité en cours.',
  },
  {
    icon: Printer,
    title: 'Coûts d\'impression',
    description: 'Imprimer des milliers de cartes chaque année représente un budget conséquent.',
  },
  {
    icon: UserX,
    title: 'Aucun suivi client',
    description: 'Impossible de savoir qui sont vos clients fidèles et leurs habitudes.',
  },
  {
    icon: Leaf,
    title: 'Impact environnemental',
    description: 'Les cartes en carton ou plastique finissent à la poubelle après quelques utilisations.',
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 bg-white">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title">
            Les cartes de fidélité papier, c&apos;est <span className="text-red-500">terminé</span>
          </h2>
          <p className="section-subtitle">
            Les méthodes traditionnelles de fidélisation ne fonctionnent plus.
            Il est temps de passer au digital.
          </p>
        </div>

        <div className="grid gap-6 mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="p-6 text-center transition-all duration-300 bg-gray-50 rounded-2xl hover:bg-gray-100"
            >
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-red-100 rounded-xl">
                <problem.icon className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {problem.title}
              </h3>
              <p className="text-sm text-gray-600">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
