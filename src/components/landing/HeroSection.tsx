import Link from 'next/link';
import { Button } from '@/components/ui';
import { Smartphone, ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden md:pt-40 md:pb-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />

      <div className="relative px-4 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              Digitalisez vos{' '}
              <span className="gradient-text">cartes de fidélité</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 md:text-xl">
              La solution <strong>la moins chère du marché</strong> pour fidéliser vos clients.
              QR code unique, suivi en temps réel, zéro application à installer.
            </p>

            <div className="flex flex-col gap-4 mt-8 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/auth/merchant/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Essai gratuit 15 jours
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Voir les tarifs
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500 lg:justify-start">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Configuration en 1 minute
              </span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="phone-mockup transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="phone-mockup-screen">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-center h-16 bg-primary">
                    <span className="text-lg font-bold text-white">Mario Pizza</span>
                  </div>
                  <div className="flex flex-col items-center justify-center flex-1 p-6 bg-gradient-to-b from-primary-50 to-white">
                    <Smartphone className="w-12 h-12 mb-4 text-primary" />
                    <p className="mb-6 text-center text-gray-600">
                      Bienvenue ! Scannez pour gagner des récompenses.
                    </p>
                    <div className="flex gap-2 mb-4">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full border-2 ${
                            i < 6
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">6 / 10 passages</p>
                    <p className="mt-2 text-xs text-center text-primary font-medium">
                      Encore 4 passages pour une pizza gratuite !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
