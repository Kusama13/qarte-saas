"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Smartphone,
  BarChart3,
  Zap,
  MessageCircle,
  Plus,
  Star,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Users
} from 'lucide-react';

// --- Utilities ---
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Qarte</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
        <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
      </div>
      <button className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all">
        Essai gratuit
      </button>
    </div>
  </nav>
);

const WhatsAppButton = () => (
  <motion.a
    href="https://wa.me/33607447420"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ scale: 1.1 }}
    className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 text-white cursor-pointer"
  >
    <MessageCircle size={28} fill="currentColor" />
    <span className="absolute -top-1 -right-1 flex h-4 w-4">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
    </span>
  </motion.a>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-8 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all group"
  >
    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed">{description}</p>
  </motion.div>
);

const PricingCard = () => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
    <div className="relative bg-zinc-900 border border-white/10 p-10 rounded-2xl flex flex-col items-center text-center">
      <span className="px-4 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6">
        Plan Unique & Illimité
      </span>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-5xl font-bold text-white">19€</span>
        <span className="text-zinc-500">/mois</span>
      </div>
      <p className="text-zinc-400 mb-8">Sans engagement. Annulez à tout moment.</p>

      <ul className="space-y-4 w-full mb-10">
        {[
          "Cartes de fidélité illimitées",
          "Tableau de bord analytics complet",
          "Notifications push clients",
          "Support client prioritaire",
          "Scan QR Code illimité"
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-zinc-300">
            <CheckCircle2 size={18} className="text-indigo-500 shrink-0" />
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>

      <button className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold hover:shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
        Commencer maintenant <ArrowRight size={18} />
      </button>
    </div>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-medium text-zinc-200 group-hover:text-white transition-colors">{question}</span>
        <Plus className={cn("text-zinc-500 transition-transform duration-300", isOpen ? "rotate-45" : "rotate-0")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-zinc-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Page ---

export default function LandingPageV3() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-indigo-500/30">
      <Navbar />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              Nouveau : Intégration Apple Wallet & Google Pay
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 leading-[1.1]">
              La fidélité client, <br />
              <span className="text-indigo-500">enfin simple.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
              Transformez vos clients occasionnels en habitués passionnés avec une carte de fidélité digitale installée en 2 secondes sur leur smartphone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform">
                Lancer mon programme
              </button>
              <button className="px-8 py-4 rounded-full bg-zinc-900 border border-white/10 text-white font-bold text-lg hover:bg-zinc-800 transition-colors">
                Voir la démo
              </button>
            </div>
          </motion.div>

          {/* Hero Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative max-w-4xl mx-auto"
          >
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-2 backdrop-blur-sm shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent z-10" />
              <div className="aspect-[16/9] bg-zinc-950 rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Abstract UI representation */}
                  <div className="w-full h-full p-12 grid grid-cols-3 gap-6 opacity-40">
                    <div className="h-full bg-indigo-500/10 rounded-lg border border-indigo-500/20" />
                    <div className="h-full bg-violet-500/10 rounded-lg border border-violet-500/20 mt-12" />
                    <div className="h-full bg-indigo-500/10 rounded-lg border border-indigo-500/20" />
                  </div>
                  {/* Floating Loyalty Card Mockup */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-64 h-96 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-2xl p-6 flex flex-col justify-between border border-white/20"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 bg-white/20 rounded-lg" />
                      <div className="text-right">
                        <p className="text-[10px] text-indigo-200 uppercase tracking-widest">Points</p>
                        <p className="text-2xl font-bold italic">850</p>
                      </div>
                    </div>
                    <div>
                      <div className="w-full h-12 bg-white rounded flex items-center justify-center mb-4">
                         <div className="w-3/4 h-6 bg-zinc-200 rounded" />
                      </div>
                      <p className="text-sm font-medium">Marc Lefebvre</p>
                      <p className="text-[10px] opacity-70">Membre Gold depuis 2023</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Rétention Client", val: "+35%" },
              { label: "Commerçants", val: "1.2k+" },
              { label: "Cartes créées", val: "50k+" },
              { label: "ROI Moyen", val: "x4" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.val}</div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Tout ce dont vous avez besoin</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Une plateforme complète conçue pour booster la fréquence de visite de vos clients sans friction technique.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Smartphone}
              title="Cartes Digitales"
              description="Pas d'application à télécharger. Vos clients ajoutent leur carte en un clic dans leur portefeuille Apple ou Google."
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics Avancés"
              description="Suivez vos performances en temps réel : nombre de scans, clients les plus fidèles et impact sur votre CA."
            />
            <FeatureCard
              icon={Zap}
              title="Campagnes Automatisées"
              description="Envoyez des notifications automatiques pour les anniversaires ou pour relancer les clients inactifs."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Sécurité Totale"
              description="Données hébergées en Europe, conformité RGPD stricte et système de validation anti-fraude."
            />
            <FeatureCard
              icon={Users}
              title="Segmentation Client"
              description="Créez des groupes de clients (Bronze, Silver, Gold) et personnalisez vos offres selon leur profil."
            />
            <FeatureCard
              icon={CreditCard}
              title="Sans Engagement"
              description="Profitez de toute la puissance de Qarte pour un prix fixe et transparent. Pas de frais cachés."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="max-w-md">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Un prix simple pour une croissance accélérée.</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Nous croyons que la fidélisation doit être accessible à tous les commerces. C'est pourquoi nous proposons un tarif unique sans compromis sur les fonctionnalités.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-indigo-400" />
                  </div>
                  Installation en 5 minutes
                </div>
                <div className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-indigo-400" />
                  </div>
                  Export des données à tout moment
                </div>
              </div>
            </div>
            <div className="w-full max-w-md">
              <PricingCard />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Julie D.", role: "Propriétaire de Café", text: "Mes clients adorent ne plus avoir à chercher leur carte papier au fond de leur sac. Mon taux de retour a grimpé de 20% en 3 mois." },
              { name: "Thomas M.", role: "Boutique Prêt-à-porter", text: "L'interface est d'une simplicité déconcertante. J'ai configuré mon programme de fidélité en une soirée seulement." },
              { name: "Sarah K.", role: "Salon d'Esthétique", text: "Les notifications pour les anniversaires sont un vrai plus. Les clientes se sentent valorisées et reviennent plus souvent." }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-2xl bg-zinc-900 border border-white/5">
                <div className="flex gap-1 mb-6 text-amber-400">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-zinc-300 italic mb-8">&quot;{t.text}&quot;</p>
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-sm text-zinc-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-16 text-center">Questions fréquentes</h2>
          <div className="divide-y divide-white/5">
            <FAQItem
              question="Mes clients doivent-ils télécharger une application ?"
              answer="Non, c'est toute la force de Qarte. La carte s'intègre directement dans Apple Wallet ou Google Pay, des applications déjà présentes sur 99% des smartphones."
            />
            <FAQItem
              question="Est-ce compatible avec mon système de caisse ?"
              answer="Qarte fonctionne de manière indépendante via un simple QR code que vous scannez avec n'importe quel smartphone ou tablette, ce qui nous rend compatible avec 100% des commerces."
            />
            <FAQItem
              question="Comment se passe l'intégration des clients existants ?"
              answer="Vous pouvez importer votre base client via un fichier CSV ou générer un lien d'inscription à envoyer par email pour qu'ils créent leur carte digitale en 2 clics."
            />
            <FAQItem
              question="Puis-je personnaliser le design de la carte ?"
              answer="Absolument. Vous pouvez choisir vos couleurs, ajouter votre logo et définir les récompenses (points, tampons, remises)."
            />
          </div>
        </div>
      </section>

      {/* WhatsApp Contact Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 rounded-3xl bg-[#25D366]/10 border border-[#25D366]/30">
            <div className="w-16 h-16 mx-auto bg-[#25D366] rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle size={32} className="text-white" fill="white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Une question ?</h3>
            <p className="text-zinc-400 mb-6">
              Parlez directement au fondateur : <span className="text-white font-semibold">+33 6 07 44 74 20</span>
            </p>
            <a
              href="https://wa.me/33607447420"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#20BD5A] transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Discuter sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto p-12 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">Prêt à transformer votre relation client ?</h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Rejoignez plus de 1 200 commerçants qui utilisent Qarte pour fidéliser leurs clients intelligemment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button className="px-10 py-4 rounded-full bg-white text-indigo-600 font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all">
              Démarrer l'essai gratuit
            </button>
            <button className="px-10 py-4 rounded-full bg-indigo-500/20 border border-white/20 text-white font-bold text-lg hover:bg-indigo-500/30 transition-all">
              Contacter un expert
            </button>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-zinc-500 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Qarte</span>
          </div>
          <p>© {new Date().getFullYear()} Qarte SAS. Tous droits réservés. <br className="sm:hidden" /> Mentions légales • CGV • RGPD</p>
        </div>
      </footer>
    </div>
  );
}
