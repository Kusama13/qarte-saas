'use client';

import Image from 'next/image';
import LandingNav from '@/components/landing/LandingNav';
import { FooterDark } from '@/components/landing';

const STRIPE_NFC_URL = 'https://buy.stripe.com/4gM7sN6DYccX75dduH7g401';

export default function CarteNFCPage() {
  return (
    <>
      <LandingNav minimal />

      <main className="pt-[100px] px-4">
        {/* Hero — carte + titre */}
        <section className="max-w-lg mx-auto text-center py-16">
          <div className="relative mx-auto mb-10 w-fit">
            <Image
              src="/images/Carte NFC QARTE .png"
              alt="Carte NFC Qarte"
              width={340}
              height={218}
              className="rounded-2xl shadow-2xl shadow-violet-200/50"
              priority
            />
            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full border-2 border-violet-300/50 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Carte NFC Qarte
          </h1>
          <p className="text-gray-500 max-w-sm mx-auto mb-2">
            Remplace le QR code. Posez-la sur le comptoir ou gardez-la autour du cou — votre cliente tap et accède à sa carte fidélité.
          </p>
        </section>

        {/* 3 étapes */}
        <section className="max-w-3xl mx-auto pb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Comment ça marche
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center text-4xl">
                <svg className="w-10 h-10 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold mb-2">1</div>
              <h3 className="font-semibold text-gray-900 mb-1">Gardez la carte visible</h3>
              <p className="text-sm text-gray-500">Sur le comptoir ou autour du cou — toujours à portée de main.</p>
            </div>

            {/* Étape 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold mb-2">2</div>
              <h3 className="font-semibold text-gray-900 mb-1">La cliente tap son tel</h3>
              <p className="text-sm text-gray-500">La page fidélité s&apos;ouvre directement dans son navigateur, sans scanner de QR code.</p>
            </div>

            {/* Étape 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold mb-2">3</div>
              <h3 className="font-semibold text-gray-900 mb-1">Elle valide son passage</h3>
              <p className="text-sm text-gray-500">Elle entre son numéro (ou est reconnue) et son point fidélité est enregistré.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-lg mx-auto text-center pb-20">
          <div className="flex items-baseline justify-center gap-2 mb-5">
            <span className="text-4xl font-extrabold text-gray-900">20 &euro;</span>
            <span className="text-gray-400">livraison comprise</span>
          </div>

          <a
            href={STRIPE_NFC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-xs mx-auto text-center px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Commander ma carte NFC
          </a>

          <p className="text-xs text-gray-400 mt-3">Livraison sous 1 à 2 semaines</p>
        </section>
      </main>

      <footer>
        <FooterDark />
      </footer>
    </>
  );
}
