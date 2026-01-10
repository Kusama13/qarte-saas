import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, Users, CreditCard } from 'lucide-react';

export function CTABanner() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary-600">
      <div className="px-4 mx-auto max-w-4xl text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Users className="w-6 h-6 text-white/80" />
          <span className="text-white/80 font-medium">
            Rejoignez 500+ commerçants
          </span>
        </div>

        <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Prêt à digitaliser votre fidélisation ?
        </h2>

        <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
          Créez votre programme de fidélité en quelques clics.
          Essai gratuit, sans carte bancaire.
        </p>

        <div className="flex flex-col items-center gap-4 mt-10 sm:flex-row sm:justify-center">
          <Link href="/auth/merchant/signup">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100"
            >
              Démarrer l&apos;essai gratuit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Sans carte bancaire
          </span>
          <span>•</span>
          <span>Configuration en 1 minute</span>
        </div>
      </div>
    </section>
  );
}
