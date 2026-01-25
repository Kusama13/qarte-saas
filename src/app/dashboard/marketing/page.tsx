'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Clock,
  Gift,
  Calendar,
  Mail,
  Sparkles,
  Coffee,
  Scissors,
  Croissant,
  UtensilsCrossed,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingPushPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-100/50 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-orange-100/30 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-block mb-6 relative"
          >
            <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 animate-pulse" />
            <div className="relative bg-white p-5 rounded-3xl shadow-xl shadow-amber-200/50 border border-amber-100">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  times: [0, 0.1, 0.2, 0.3, 0.4, 1]
                }}
              >
                <Bell className="w-12 h-12 text-amber-500 fill-amber-50" />
              </motion.div>
            </div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-14 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg"
            >
              Bientôt
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
          >
            Notifications <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Push</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Gardez le contact avec vos clients au moment opportun.
            Envoyez des messages directs sur leurs smartphones et augmentez votre taux de rétention.
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            {
              title: "Rappelez-vous à vos clients",
              desc: "Relancez automatiquement les clients qui n'ont pas visité depuis un moment.",
              icon: Clock,
              color: "amber"
            },
            {
              title: "Annoncez vos promotions",
              desc: "Diffusez vos offres spéciales et nouveaux produits en un clic.",
              icon: Megaphone,
              color: "orange"
            },
            {
              title: "Récompenses expirantes",
              desc: "Alertez vos clients avant que leurs points n'expirent.",
              icon: Gift,
              color: "amber"
            },
            {
              title: "Événements spéciaux",
              desc: "Promouvez vos soirées thématiques et lancements saisonniers.",
              icon: Calendar,
              color: "orange"
            }
          ].map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-amber-500/5 transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                benefit.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-orange-50 text-orange-600'
              }`}>
                <benefit.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Use Cases & Phone Mockup */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Exemples concrets
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                Adapté à votre métier
              </h2>
            </div>

            <div className="grid gap-3">
              {[
                { label: "Café", text: "☕ Votre 10ème café vous attend ! Passez nous voir aujourd'hui.", icon: Coffee },
                { label: "Salon de coiffure", text: "💇 Cela fait 6 semaines... Besoin d'une coupe rafraîchissante ?", icon: Scissors },
                { label: "Boulangerie", text: "🥐 -20% sur les viennoiseries ce matin jusqu'à 10h !", icon: Croissant },
                { label: "Restaurant", text: "🍽️ Votre récompense fidélité expire dans 3 jours.", icon: UtensilsCrossed },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                    <item.icon className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">{item.label}</span>
                    <p className="text-sm text-slate-700 font-medium italic">&quot;{item.text}&quot;</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-center order-1 lg:order-2">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[260px] h-[520px] bg-slate-900 rounded-[2.5rem] p-2.5 shadow-2xl border-[6px] border-slate-800 relative z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl z-20" />
                <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] overflow-hidden relative pt-10 px-3">

                  {/* Mock Notifications */}
                  <div className="space-y-2.5">
                    <motion.div
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white/95 backdrop-blur shadow-lg rounded-xl p-3 flex gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">Q</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[9px] font-bold text-slate-900">QARTE</span>
                          <span className="text-[9px] text-slate-400">Maintenant</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">Votre 10ème café vous attend ! ☕</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="bg-white/95 backdrop-blur shadow-lg rounded-xl p-3 flex gap-2.5 opacity-90 scale-[0.97] origin-top"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">Q</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[9px] font-bold text-slate-900">QARTE</span>
                          <span className="text-[9px] text-slate-400">Il y a 2h</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">-20% sur tout jusqu&apos;à ce soir ! 🔥</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="bg-white/95 backdrop-blur shadow-lg rounded-xl p-3 flex gap-2.5 opacity-80 scale-[0.94] origin-top"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">Q</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[9px] font-bold text-slate-900">QARTE</span>
                          <span className="text-[9px] text-slate-400">Hier</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">Récompense expire dans 3 jours ⏰</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* UI Bottom Bar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full" />
                </div>
              </div>

              {/* Phone Decorative Shadows */}
              <div className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-full -z-10" />
            </div>
          </div>
        </div>

        {/* CTA Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Mail className="w-24 h-24 text-white" />
            </div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-3">Soyez informé du lancement</h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
                Laissez-nous votre email et nous vous préviendrons dès que les notifications push seront disponibles.
              </p>

              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      required
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap group text-sm"
                    >
                      Me notifier
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-2"
                  >
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <p className="text-emerald-400 font-bold text-lg mb-1">C&apos;est noté !</p>
                    <p className="text-slate-400 text-sm">Nous vous contacterons à {email}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest font-medium">
                Aucun engagement • Inclus dans votre abonnement
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
