import Link from 'next/link';
import {
  Coffee,
  Croissant,
  UtensilsCrossed,
  Scissors,
  Dumbbell,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

const industries = [
  { icon: Coffee, name: 'Cafés' },
  { icon: Croissant, name: 'Boulangeries' },
  { icon: UtensilsCrossed, name: 'Restaurants' },
  { icon: Scissors, name: 'Salons de beauté' },
  { icon: Dumbbell, name: 'Salles de sport' },
  { icon: ShoppingBag, name: 'Commerces' },
];

export function IndustriesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title">Adapté à tous les commerces</h2>
          <p className="section-subtitle">
            Que vous soyez un café de quartier ou un salon de coiffure,
            Qarte s&apos;adapte à votre activité
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-16 sm:grid-cols-3 lg:grid-cols-7">
          {industries.map((industry, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 transition-all duration-300 bg-white rounded-2xl hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-center justify-center w-14 h-14 mb-3 rounded-xl bg-primary-50">
                <industry.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                {industry.name}
              </span>
            </div>
          ))}

          <Link
            href="/auth/merchant/signup"
            className="flex flex-col items-center justify-center p-6 transition-all duration-300 bg-primary rounded-2xl hover:bg-primary-600 group"
          >
            <div className="flex items-center justify-center w-14 h-14 mb-3 bg-white/20 rounded-xl">
              <ArrowRight className="w-7 h-7 text-white transition-transform group-hover:translate-x-1" />
            </div>
            <span className="text-sm font-medium text-white text-center">
              Démarrer
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
