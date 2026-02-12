'use client';

import { motion } from 'framer-motion';
import { Clock, Cake, CalendarHeart, Sparkles } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

/* ═══════════════════════════════════════════
   iOS Push notification
   ═══════════════════════════════════════════ */

interface NotificationProps {
  iconBg: string;
  iconLetter: string;
  name: string;
  time: string;
  title: string;
  message: string;
}

function PushNotification({ iconBg, iconLetter, name, time, title, message }: NotificationProps) {
  return (
    <div className="relative bg-white rounded-[14px] px-2.5 py-2 shadow-md shadow-black/10 border border-white/80">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 ${iconBg} rounded-[7px] flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-[10px] font-black">{iconLetter}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-semibold text-slate-500/90 uppercase tracking-wide">{name}</span>
            <span className="text-[10px] text-slate-400/80 flex-shrink-0">{time}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-900 leading-snug mt-[1px]">{title}</p>
          <p className="text-[10px] text-slate-600/80 leading-snug">{message}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   iPhone mockup
   ═══════════════════════════════════════════ */

function PhoneMockup({ isInView }: { isInView: boolean }) {
  return (
    <div className="relative">
      <div className="relative w-full max-w-[272px] sm:w-[290px] sm:max-w-none mx-auto">
        {/* Side buttons */}
        <div className="absolute -left-[2px] top-[100px] w-[3px] h-[28px] bg-slate-400 rounded-l-sm" />
        <div className="absolute -left-[2px] top-[148px] w-[3px] h-[52px] bg-slate-400 rounded-l-sm" />
        <div className="absolute -left-[2px] top-[210px] w-[3px] h-[52px] bg-slate-400 rounded-l-sm" />
        <div className="absolute -right-[2px] top-[160px] w-[3px] h-[68px] bg-slate-400 rounded-r-sm" />

        {/* Phone body */}
        <div className="relative bg-[#1a1a1e] rounded-[44px] sm:rounded-[48px] p-[4px] shadow-[0_0_0_1px_rgba(120,120,128,0.3),0_20px_60px_-10px_rgba(0,0,0,0.4)]">
          {/* Screen */}
          <div className="relative rounded-[40px] sm:rounded-[44px] overflow-hidden" style={{ aspectRatio: '9/19.2' }}>
            {/* Wallpaper */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2d0a1e] via-[#3a1028] to-[#1a0612]">
              <div className="absolute top-[15%] left-[20%] w-[60%] h-[30%] bg-rose-600/30 rounded-full blur-[60px]" />
              <div className="absolute top-[25%] right-[10%] w-[40%] h-[20%] bg-pink-500/25 rounded-full blur-[50px]" />
              <div className="absolute bottom-[30%] left-[10%] w-[50%] h-[25%] bg-rose-700/20 rounded-full blur-[50px]" />
              <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[20%] bg-pink-600/15 rounded-full blur-[40px]" />
            </div>

            {/* Lock icon */}
            <div className="relative z-10 flex justify-center mt-10 sm:mt-12">
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <rect x="0.5" y="6" width="11" height="9.5" rx="2" fill="white" fillOpacity="0.5" />
                <path d="M3 6V4.5C3 2.84 4.34 1.5 6 1.5C7.66 1.5 9 2.84 9 4.5V6" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Date & Time */}
            <div className="relative z-10 text-center mt-2">
              <p className="text-white/50 text-[13px] font-medium tracking-wide">Mardi 11 février</p>
              <p className="text-white text-[56px] sm:text-[64px] font-extralight leading-none mt-0.5 tracking-tight" style={{ fontFeatureSettings: '"tnum"' }}>
                14:32
              </p>
            </div>

            {/* Notifications */}
            <div className="relative z-10 px-3 sm:px-3.5 mt-4 sm:mt-5 space-y-1.5">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <PushNotification
                  iconBg="bg-gradient-to-br from-indigo-500 to-blue-600"
                  iconLetter="G"
                  name="Glam'Ongles"
                  time="maintenant"
                  title="Vos ongles vous manquent 💅"
                  message="Ça fait 3 semaines Marie !"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.7, ease: [0.23, 1, 0.32, 1] }}
              >
                <PushNotification
                  iconBg="bg-gradient-to-br from-rose-500 to-pink-600"
                  iconLetter="L"
                  name="Le Salon de Léa"
                  time="10:00"
                  title="Joyeux anniversaire ! 🎂"
                  message="-20% sur votre brushing Sophie"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 1.0, ease: [0.23, 1, 0.32, 1] }}
              >
                <PushNotification
                  iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
                  iconLetter="N"
                  name="Nails & Beauty"
                  time="hier"
                  title="Saint-Valentin 💕"
                  message="-15% sur la pose, à deux !"
                />
              </motion.div>
            </div>

            {/* Bottom: home indicator + quick actions */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="flex items-center justify-between px-6 sm:px-8 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 1H4C2.34 1 1 2.34 1 4v2h2V4c0-.55.45-1 1-1h1V1zM11 1h1c1.66 0 3 1.34 3 3v2h-2V4c0-.55-.45-1-1-1h-1V1zM3 10H1v2c0 1.66 1.34 3 3 3h1v-2H4c-.55 0-1-.45-1-1v-2zM15 10h-2v2c0 .55-.45 1-1 1h-1v2h1c1.66 0 3-1.34 3-3v-2z" fill="white" fillOpacity="0.8" />
                    <rect x="5.5" y="5" width="5" height="7" rx="1" fill="white" fillOpacity="0.8" />
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <rect x="3" y="0.5" width="8" height="11" rx="1.5" stroke="white" strokeOpacity="0.8" />
                    <path d="M5 12v2c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2" stroke="white" strokeOpacity="0.8" />
                    <circle cx="7" cy="5" r="2" fill="white" fillOpacity="0.8" />
                  </svg>
                </div>
              </div>
              <div className="flex justify-center pb-2">
                <div className="w-[120px] sm:w-[130px] h-[5px] bg-white/30 rounded-full" />
              </div>
            </div>

            {/* Screen reflection */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Ambient glow behind phone */}
      <div className="absolute top-[10%] -left-16 w-48 h-48 bg-indigo-400/10 rounded-full blur-[80px] -z-10" />
      <div className="absolute bottom-[10%] -right-16 w-48 h-48 bg-violet-400/10 rounded-full blur-[80px] -z-10" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Feature row
   ═══════════════════════════════════════════ */

interface FeatureRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function FeatureRow({ icon, iconBg, title, description }: FeatureRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-[15px]">{title}</p>
        <p className="text-gray-500 text-sm mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Section
   ═══════════════════════════════════════════ */

export function AIReengagementSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Left column: Copy */}
          <div className="flex-1 text-center lg:text-left max-w-xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-600 tracking-wide">Autopilot IA</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-5"
            >
              Vos clients reviennent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                tous seuls
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg text-gray-500 mb-10 max-w-md leading-relaxed"
            >
              Elle oublie de revenir ? Qarte lui rappelle au bon moment. Vous ne touchez à rien.
            </motion.p>

            {/* Feature rows */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-5 mb-10"
            >
              <FeatureRow
                icon={<Clock className="w-5 h-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
                title="Relance inactivité"
                description="Un client ne vient plus ? L'IA le détecte et envoie une notification au bon moment."
              />
              <FeatureRow
                icon={<Cake className="w-5 h-5 text-rose-600" />}
                iconBg="bg-rose-100"
                title="Anniversaires"
                description="Offre surprise envoyée automatiquement le jour J. Sans jamais oublier."
              />
              <FeatureRow
                icon={<CalendarHeart className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-100"
                title="Événements spéciaux"
                description="Saint-Valentin, Noël, fête des mères... Campagnes programmées automatiquement."
              />
            </motion.div>

          </div>

          {/* Right column: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex-shrink-0"
          >
            <PhoneMockup isInView={isInView} />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
