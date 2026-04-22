'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { ArrowRight, TrendingDown, Wallet, MessageSquare, CreditCard } from 'lucide-react';

const BOOKSY_SUBSCRIPTION_MONTHLY = 60;
const BOOKSY_SMS_UNIT_COST = 0.10;
const QARTE_MONTHLY = 24;
const QARTE_SMS_INCLUDED = 100;

function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function BooksyCostCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(10000);
  const [marketplacePct, setMarketplacePct] = useState(25);
  const [commissionPct, setCommissionPct] = useState(20);
  const [monthlySms, setMonthlySms] = useState(150);

  const calc = useMemo(() => {
    const commissionYear = monthlyRevenue * 12 * (marketplacePct / 100) * (commissionPct / 100);
    const subscriptionYear = BOOKSY_SUBSCRIPTION_MONTHLY * 12;
    const smsYear = monthlySms * BOOKSY_SMS_UNIT_COST * 12;
    const booksyTotal = commissionYear + subscriptionYear + smsYear;

    const qarteSubYear = QARTE_MONTHLY * 12;
    const smsOver = Math.max(0, monthlySms - QARTE_SMS_INCLUDED);
    const qarteSmsYear = smsOver * 0.075 * 12;
    const qarteTotal = qarteSubYear + qarteSmsYear;

    const savings = booksyTotal - qarteTotal;
    return { commissionYear, subscriptionYear, smsYear, booksyTotal, qarteSubYear, qarteSmsYear, qarteTotal, savings };
  }, [monthlyRevenue, marketplacePct, commissionPct, monthlySms]);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 pt-28 lg:pt-36 pb-12 md:pb-16 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold tracking-wide uppercase mb-6">
            Calculateur gratuit
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
            Combien te coûte vraiment{' '}
            <span className="relative font-[family-name:var(--font-display)] italic text-red-600">
              Booksy
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-red-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>{' '}
            ?
          </h1>
          <p className="text-[1.05rem] md:text-lg lg:text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
            Commissions, SMS, abonnement. Calcule en 30 secondes combien tu pourrais économiser avec Qarte.
          </p>
        </div>
      </section>

      {/* ── CALCULATOR ── */}
      <section className="relative pb-16 md:pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-indigo-100/30 p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Tes chiffres</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Chiffre d&apos;affaires mensuel</label>
                    <span className="text-lg font-bold text-indigo-600">{formatEUR(monthlyRevenue)}</span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={30000}
                    step={500}
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>2 000 €</span>
                    <span>30 000 €</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">% de ton CA via Booksy</label>
                    <span className="text-lg font-bold text-indigo-600">{marketplacePct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={marketplacePct}
                    onChange={(e) => setMarketplacePct(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Part du CA venant de réservations Booksy (vs walk-ins, Insta, bouche-à-oreille).</p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Commission Booksy</label>
                    <span className="text-lg font-bold text-indigo-600">{commissionPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={30}
                    step={1}
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">% prélevé sur les réservations via leur marketplace (environ 20% en moyenne).</p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">SMS envoyés par mois</label>
                    <span className="text-lg font-bold text-indigo-600">{monthlySms}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={10}
                    value={monthlySms}
                    onChange={(e) => setMonthlySms(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Rappels RDV, confirmations, campagnes promo.</p>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-600">Coût Booksy / an</h3>
                </div>
                <p className="text-5xl md:text-6xl font-extrabold tracking-tighter text-gray-900 mb-4">
                  {formatEUR(calc.booksyTotal)}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-red-400" /> Commissions</span>
                    <span className="font-semibold">{formatEUR(calc.commissionYear)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-red-400" /> Abonnement (Pro ~60€/mois)</span>
                    <span className="font-semibold">{formatEUR(calc.subscriptionYear)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-red-400" /> SMS (~0,10€/SMS)</span>
                    <span className="font-semibold">{formatEUR(calc.smsYear)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-indigo-500 rotate-180" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600">Coût Qarte / an</h3>
                </div>
                <p className="text-5xl md:text-6xl font-extrabold tracking-tighter text-gray-900 mb-4">
                  {formatEUR(calc.qarteTotal)}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500" /> Commissions</span>
                    <span className="font-semibold text-emerald-600">0 €</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" /> Abonnement (24€/mois)</span>
                    <span className="font-semibold">{formatEUR(calc.qarteSubYear)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-400" /> SMS (100/mois inclus)</span>
                    <span className="font-semibold">{calc.qarteSmsYear === 0 ? 'Inclus' : formatEUR(calc.qarteSmsYear)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings banner */}
          {calc.savings > 0 && (
            <div className="mt-8 relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-200/40 via-teal-200/30 to-indigo-200/40 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="relative bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl shadow-emerald-100/30 p-8 md:p-12 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Tu pourrais économiser</p>
                <p className="text-6xl md:text-7xl font-extrabold tracking-tighter text-emerald-600 mb-2">
                  {formatEUR(calc.savings)}
                </p>
                <p className="text-sm md:text-base text-gray-600 mb-6">par an en passant à Qarte — et tu gardes la fidélité, la vitrine SEO et le parrainage en plus.</p>
                <Link
                  href="/auth/merchant/signup"
                  onClick={() => trackCtaClick('booksy_cost_calc', 'booksy_cost_savings')}
                  className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
                >
                  Essai gratuit 7 jours
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-xs text-gray-400 mt-3">Sans carte bancaire — résiliation en 1 clic</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── METHOD ── */}
      <section className="relative py-12 md:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Comment on calcule</h2>
          <div className="space-y-3 text-sm md:text-base text-gray-600 leading-relaxed">
            <p><strong className="text-gray-900">Commissions Booksy :</strong> Booksy prélève une commission sur les réservations effectuées via leur marketplace. Le taux varie selon ton plan (environ 20% sur les nouveaux clients Booksy).</p>
            <p><strong className="text-gray-900">Abonnement Booksy :</strong> plan Pro autour de 60€/mois (Starter ~29€, Premium ~100€).</p>
            <p><strong className="text-gray-900">SMS Booksy :</strong> tarif moyen 0,10€/SMS envoyé (rappel, confirmation, marketing) en supplément de l&apos;abonnement.</p>
            <p><strong className="text-gray-900">Qarte :</strong> 24€/mois tout compris. 100 SMS/mois inclus. Au-delà, pack à 0,075€/SMS. Zéro commission, jamais.</p>
            <p className="text-xs text-gray-400 pt-4">Les tarifs Booksy sont des estimations publiques 2026. Vérifie tes factures pour le détail exact. Cet outil est indicatif.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-10 text-center">
            Questions{' '}
            <span className="relative font-[family-name:var(--font-display)] italic text-indigo-600">
              fréquentes
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
          <div className="space-y-3">
            {[
              { q: 'Qarte prend vraiment 0% de commission ?', a: 'Oui. Tu mets ton propre lien de paiement (Revolut, PayPal, Stripe, SumUp…) pour les acomptes. L\'argent va direct sur ton compte, Qarte ne prélève jamais rien.' },
              { q: 'Est-ce que je peux garder Booksy en parallèle ?', a: 'Absolument. Tu peux tester Qarte 7 jours gratuits sans toucher à Booksy. Beaucoup de pros gardent Booksy quelques semaines le temps de la transition.' },
              { q: 'Mes clientes Booksy vont-elles me suivre sur Qarte ?', a: 'Tes clientes réservent en ligne via ta vitrine Qarte (lien unique à partager sur Insta/SMS/Google). Tu peux aussi importer leurs coordonnées manuellement dans ton dashboard.' },
              { q: 'Les 100 SMS inclus, c\'est vraiment assez ?', a: 'Pour un salon 1-3 employés qui envoie des rappels et confirmations, 100 SMS/mois couvre environ 30-50 RDV. Si tu en envoies plus, les packs Qarte commencent à 5,70€ pour 50 SMS (0,075€/SMS).' },
            ].map((item, i) => (
              <details key={i} className="group rounded-2xl border bg-white shadow-md shadow-gray-200/60 border-gray-100 p-6 open:shadow-lg transition-shadow">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">{item.q}</h3>
                  <span className="text-indigo-600 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-16 md:py-24 bg-white">
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Récupère cet argent.</h2>
          <p className="text-[1.05rem] md:text-lg text-gray-800 mb-8">
            Essai gratuit 7 jours, sans carte bancaire. Garde Booksy le temps de la transition si tu veux.
          </p>
          <Link
            href="/auth/merchant/signup"
            onClick={() => trackCtaClick('booksy_cost_calc_final', 'booksy_cost_final')}
            className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
          >
            Démarrer mon essai gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-400 mt-3">Sans carte bancaire · Résiliation en 1 clic</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-xs font-black text-white">Q</span>
            </div>
            <span className="text-sm font-bold text-gray-700">Qarte</span>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Qarte. Tous droits r&eacute;serv&eacute;s.</p>
        </div>
      </footer>
    </>
  );
}
