'use client';

import { BarChart3, Bell, Check, Gift, Star, ChevronDown, ArrowRight } from 'lucide-react';

/* ═══════════════════════════════════════════
   Step Cards
   ═══════════════════════════════════════════ */

function Step1() {
  return (
    <div className="relative bg-white rounded-xl border border-indigo-100/80 shadow-lg shadow-indigo-100/30 p-4 w-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm shadow-indigo-500/30">
        <span className="text-xs font-bold text-white">1</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5 ml-2">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Vous repérez</span>
      </div>
      <p className="text-lg font-bold text-slate-800 leading-snug">12 client(e)s prêt(e)s à revenir</p>
      <p className="text-base text-slate-400">Plus qu&apos;1 point avant leur cadeau</p>
      <div className="mt-2 inline-flex items-center gap-1.5 text-base font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
        Relancez-les <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}

function Step2() {
  return (
    <div className="relative bg-white rounded-xl border border-violet-100/80 shadow-lg shadow-violet-100/30 p-4 w-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center shadow-sm shadow-violet-500/30">
        <span className="text-xs font-bold text-white">2</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5 ml-2">
        <Bell className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">Un petit rappel</span>
      </div>
      <div className="flex items-center gap-2.5 mb-1.5 bg-violet-50/60 rounded-lg p-2">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-700 leading-none">Beauty Lounge</p>
          <p className="text-sm text-slate-400 mt-0.5">Maintenant</p>
        </div>
      </div>
      <p className="text-base text-slate-600 leading-snug">Votre cadeau vous attend&nbsp;!</p>
    </div>
  );
}

function Step3() {
  return (
    <div className="relative bg-white rounded-xl border border-emerald-100/80 shadow-lg shadow-emerald-100/30 p-4 w-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm shadow-emerald-500/30">
        <span className="text-xs font-bold text-white">3</span>
      </div>
      <div className="flex items-center gap-2 mb-1 ml-2">
        <Check className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Elle revient</span>
      </div>
      <p className="text-lg font-bold text-slate-800">Marie est de retour</p>
      <p className="text-base text-slate-500">+1 point ajouté &middot; 10/10 tampons</p>
    </div>
  );
}

function Step4() {
  return (
    <div className="relative bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200/60 shadow-lg shadow-rose-100/30 p-4 w-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-sm shadow-rose-500/30">
        <span className="text-xs font-bold text-white">4</span>
      </div>
      <div className="flex items-center gap-2 mb-1 ml-2">
        <Gift className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-bold text-rose-400 uppercase tracking-wider">Elle est récompensée</span>
      </div>
      <p className="text-lg font-bold text-slate-800">Soin offert&nbsp;!</p>
      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-rose-500 font-medium">
        <Star className="w-4 h-4 fill-rose-400 text-rose-400" />
        Avis Google laissé automatiquement
      </div>
      <p className="text-base text-slate-400 mt-1">Et ça continue tout seul</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Section
   ═══════════════════════════════════════════ */

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-slate-50/70 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Avec Qarte, vos client(e)s{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">
              ne vous oublient plus.
            </span>
          </h2>
          <p className="text-lg text-slate-400 mt-4 max-w-xl mx-auto">
            Pendant que vous travaillez, Qarte fidélise.
          </p>
        </div>

        {/* ─── Desktop: CSS Grid 3×3 ─── */}
        <div className="hidden lg:block">
          <div
            className="relative mx-auto"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 280px) 1fr minmax(240px, 280px)',
              gridTemplateRows: 'auto minmax(60px, 1fr) auto',
              gap: '0.75rem',
            }}
          >
            {/* Dashed ellipse — cycle path indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="w-[72%] h-[88%] border-2 border-dashed border-indigo-200/50 rounded-full" />
            </div>

            {/* ── Row 1: arrow · Step1 · arrow ── */}
            <div className="z-10 flex items-end justify-end pr-3 pb-3">
              <ArrowRight className="w-5 h-5 text-indigo-300/80 -rotate-45" />
            </div>
            <div className="z-10 flex justify-center">
              <div className="w-[280px]"><Step1 /></div>
            </div>
            <div className="z-10 flex items-end justify-start pl-3 pb-3">
              <ArrowRight className="w-5 h-5 text-indigo-300/80 rotate-45" />
            </div>

            {/* ── Row 2: Step4 · center stat · Step2 ── */}
            <div className="z-10 flex items-center">
              <Step4 />
            </div>
            <div className="z-10 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl font-black text-indigo-600 leading-none">78%</p>
                <p className="text-base font-semibold text-slate-400 mt-1">de vos client(e)s reviennent</p>
              </div>
            </div>
            <div className="z-10 flex items-center">
              <Step2 />
            </div>

            {/* ── Row 3: arrow · Step3 · arrow ── */}
            <div className="z-10 flex items-start justify-end pr-3 pt-3">
              <ArrowRight className="w-5 h-5 text-indigo-300/80 rotate-[225deg]" />
            </div>
            <div className="z-10 flex justify-center">
              <div className="w-[280px]"><Step3 /></div>
            </div>
            <div className="z-10 flex items-start justify-start pl-3 pt-3">
              <ArrowRight className="w-5 h-5 text-indigo-300/80 rotate-[135deg]" />
            </div>
          </div>
        </div>

        {/* ─── Mobile: Vertical flow ─── */}
        <div className="lg:hidden flex flex-col items-center gap-4">
          <div className="w-full max-w-[300px]"><Step1 /></div>
          <ChevronDown className="w-5 h-5 text-slate-300" />
          <div className="w-full max-w-[300px]"><Step2 /></div>
          <ChevronDown className="w-5 h-5 text-slate-300" />
          <div className="w-full max-w-[300px]"><Step3 /></div>
          <ChevronDown className="w-5 h-5 text-slate-300" />
          <div className="w-full max-w-[300px]"><Step4 /></div>
          <p className="text-xs text-slate-400 font-medium mt-2">↺ Le cycle recommence</p>
        </div>
      </div>
    </section>
  );
}
