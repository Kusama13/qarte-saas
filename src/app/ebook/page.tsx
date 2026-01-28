"use client";

import React, { useState, useEffect } from "react";
import { FacebookPixel, fbEvents } from "@/components/FacebookPixel";
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  Users,
  TrendingUp,
  Star,
  Zap,
  Phone,
  Clock,
} from "lucide-react";

// --- Components ---

const UrgencyBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, min: 0, sec: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const sec = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, min, sec };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="bg-primary-900 text-white py-2 text-center text-sm font-medium flex items-center justify-center gap-3 px-4">
      <span className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-secondary" />
        OFFRE LIMITÉE :
      </span>
      <span>Le guide devient payant dans {pad(timeLeft.hours)}h {pad(timeLeft.min)}m {pad(timeLeft.sec)}s</span>
      <span className="hidden md:inline text-primary-200">|</span>
      <span className="hidden md:inline">Plus de 120 commerçants ont déjà lu</span>
    </div>
  );
};

const EbookTeaser = () => {
  return (
    <div className="relative group">
      <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-8 md:p-12 overflow-hidden relative hover:shadow-xl transition-all duration-300">
        {/* Header content */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">Extrait Exclusif</span>
          <h3 className="text-2xl font-bold text-gray-900 leading-tight">
            Comment Augmenter Votre CA de 35% grâce à la Fidélisation Client
          </h3>
        </div>

        {/* Visible Content */}
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800">1. Le mythe du client satisfait (et pourquoi il ne revient pas)</p>
          <p>
            Contrairement à la croyance populaire, la satisfaction n&apos;est pas un moteur de fidélité.
            Un client &quot;satisfait&quot; est un client volatil qui attend simplement une meilleure offre ailleurs.
            Le secret réside dans l&apos;engagement émotionnel...
          </p>

          <p className="font-semibold text-gray-800">2. La règle des 20% qui génère 80% de vos revenus</p>
          <p>
            Analysez vos données : une infime fraction de votre base client porte votre rentabilité.
            Si vous traitez votre meilleur client de la même manière qu&apos;un nouveau venu, vous perdez de l&apos;argent chaque jour...
          </p>

          {/* Blurred/Locked Content */}
          <div className="relative">
            <div className="space-y-4 opacity-40 select-none blur-[2px]">
              <p className="font-semibold">3. L&apos;architecture de la récompense psychologique</p>
              <p>Comment utiliser les boucles de dopamine pour créer une habitude d&apos;achat sans réduire vos marges par des promotions constantes...</p>
              <p className="font-semibold">4. Le calcul du LTV (Life Time Value) prédictif</p>
              <p>Apprenez à prédire exactement combien un client va vous rapporter sur les 12 prochains mois...</p>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-end pb-4">
              <div className="bg-primary/10 backdrop-blur-md border border-primary/20 p-4 rounded-xl flex items-center gap-3 animate-bounce-slow">
                <Lock className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">Votre ebook est disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Decorations */}
      <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-primary-100 rounded-2xl transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
    </div>
  );
};

const LeadForm = () => {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/demo-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });

      if (response.ok) {
        setStatus("success");
        fbEvents.lead();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in">
        <div className="bg-green-50 border border-green-100 p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-green-900 mb-2">Votre guide est prêt !</h3>
          <p className="text-green-700 mb-6">Cliquez ci-dessous pour télécharger votre guide gratuit.</p>
          <a
            href="/ebooks/guide-fidelisation.pdf"
            download="Guide-Fidelisation-Qarte.pdf"
            onClick={() => {
              setTimeout(() => {
                window.location.href = "https://getqarte.com";
              }, 5000);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Télécharger le guide PDF
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Redirection vers getqarte.com dans 5 secondes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="tel"
            required
            placeholder="Votre numéro de mobile (ex: 06 12 34 56 78)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-100 focus:border-primary transition-all duration-300 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group hover-lift"
        >
          {status === "loading" ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              RECEVOIR LE GUIDE GRATUITEMENT
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          Accès instantané par SMS • Vos données restent privées
        </p>
      </form>
    </div>
  );
};

export default function EbookLandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary-100 selection:text-primary">
      <FacebookPixel />
      <UrgencyBanner />

      {/* Header */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Qarte</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
            <Users className="w-4 h-4 text-primary" />
            <span>+120 commerçants l&apos;ont déjà lu</span>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-32 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left Column: Copy */}
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary text-xs font-bold mb-6">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  GUIDE DE FIDÉLISATION 2026
                </div>

                <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
                  Arrêtez de perdre vos clients au profit de <span className="gradient-text">vos concurrents.</span>
                </h1>

                <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                  Découvrez la méthode exacte pour augmenter votre panier moyen de 35% et transformer 1 client sur 3 en habitué fidèle.
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    "Augmenter votre CA sans dépenser plus en publicité",
                    "Les 3 erreurs fatales qui font fuir vos clients",
                    "Comment automatiser votre bouche-à-oreille"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <LeadForm />

                <div className="mt-8 flex items-center gap-4 text-sm text-gray-400 italic">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <img
                        key={i}
                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                        alt="User"
                        className="w-8 h-8 rounded-full border-2 border-white"
                      />
                    ))}
                  </div>
                  <span>&quot;Ce guide a changé ma vision du commerce.&quot; - Marc, Gérant</span>
                </div>
              </div>

              {/* Right Column: Ebook Preview */}
              <div className="relative animate-fade-in">
                <EbookTeaser />

                {/* Stats badge */}
                <div className="absolute -top-6 -right-6 md:right-0 bg-white shadow-xl rounded-2xl p-4 border border-gray-100 flex items-center gap-4 animate-bounce-slow">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-orange-500 fill-current" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">4.9/5</div>
                    <div className="text-xs text-gray-500">Basé sur 97 avis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proof / Trust Section */}
        <section className="bg-gray-50 py-16 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">Pourquoi +120 commerçants nous font confiance</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-hover bg-white p-8 rounded-2xl shadow-sm">
                <div className="text-primary font-bold text-4xl mb-2">94%</div>
                <p className="text-gray-600">Des lecteurs ont appliqué au moins une stratégie dans les 48h.</p>
              </div>
              <div className="card-hover bg-white p-8 rounded-2xl shadow-sm">
                <div className="text-primary font-bold text-4xl mb-2">+22%</div>
                <p className="text-gray-600">D&apos;augmentation moyenne du revenu par client après lecture.</p>
              </div>
              <div className="card-hover bg-white p-8 rounded-2xl shadow-sm">
                <div className="text-primary font-bold text-4xl mb-2">5 min</div>
                <p className="text-gray-600">C&apos;est le temps de lecture nécessaire pour maîtriser les bases.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-gray-900 font-semibold">Qarte</span>
            </div>

            <p className="text-gray-500 text-sm">
              © 2025 Qarte - Fidélisez mieux, dépensez moins
            </p>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="/mentions-legales" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Mentions légales</a>
              <a href="/politique-confidentialite" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
