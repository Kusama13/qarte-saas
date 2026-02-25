'use client';

import { motion } from 'framer-motion';
import {
  QrCode,
  Bell,
  Heart,
  Gift,
  Share2,
  Check,
  Star,
  ChevronRight,
  Sparkles,
  Cake,
  CalendarHeart,
  MousePointer2,
  ArrowRight,
} from 'lucide-react';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── FeatureBlock ── */

function FeatureBlock({
  title,
  titleBold,
  description,
  visual,
  reverse = false,
  delay = 0,
}: {
  title: string;
  titleBold: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
  delay?: number;
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 md:gap-10 lg:gap-20`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
          {title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
          {description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: delay + 0.12, ease: EASE }}
        className="flex-1 flex justify-center"
      >
        {visual}
      </motion.div>
    </div>
  );
}

function Separator() {
  return <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto" />;
}

/* ── Visuals ── */

/* ── Visual: QR Code Scan ── */
function QRCodeVisual() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      <div className="absolute inset-0 -m-4 bg-indigo-100/50 rounded-3xl blur-[60px] pointer-events-none" />

      <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="w-36 h-36 bg-white rounded-2xl border-2 border-indigo-100 p-4 shadow-sm mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="5" y="5" width="25" height="25" rx="3" fill="#4f46e5" />
            <rect x="70" y="5" width="25" height="25" rx="3" fill="#4f46e5" />
            <rect x="5" y="70" width="25" height="25" rx="3" fill="#4f46e5" />
            <rect x="10" y="10" width="15" height="15" rx="2" fill="white" />
            <rect x="75" y="10" width="15" height="15" rx="2" fill="white" />
            <rect x="10" y="75" width="15" height="15" rx="2" fill="white" />
            <rect x="14" y="14" width="7" height="7" rx="1" fill="#4f46e5" />
            <rect x="79" y="14" width="7" height="7" rx="1" fill="#4f46e5" />
            <rect x="14" y="79" width="7" height="7" rx="1" fill="#4f46e5" />
            <rect x="38" y="5" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="52" y="5" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="38" y="38" width="8" height="8" rx="1.5" fill="#6366f1" />
            <rect x="52" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="70" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="38" y="70" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="70" y="70" width="8" height="8" rx="1.5" fill="#6366f1" />
            <rect x="85" y="85" width="8" height="8" rx="1.5" fill="#4f46e5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">Scannez pour tamponner</p>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-emerald-100 animate-float-subtle">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">+1 point</span>
      </div>
    </div>
  );
}

/* ── Visual: Loyalty Card ── */
function LoyaltyCardVisual() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto pt-6">
      <div className="absolute inset-0 -m-4 bg-violet-100/50 rounded-3xl blur-[60px] pointer-events-none" />

      <div className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-3xl p-6 shadow-xl shadow-indigo-200/40">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/70 text-xs font-medium">Programme fidélité</p>
            <p className="text-white font-bold text-lg">Mon Salon</p>
          </div>
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                i < 6
                  ? 'bg-white/25 backdrop-blur-sm'
                  : 'border-2 border-dashed border-white/20'
              }`}
            >
              {i < 6 && <Heart className="w-4 h-4 text-white fill-white" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
          <Gift className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold">Brushing offert</span>
          <ChevronRight className="w-3 h-3 text-white/60 ml-auto" />
        </div>
      </div>

      <div className="absolute -top-2 right-0 flex items-center gap-1.5 bg-white rounded-2xl px-4 py-2 shadow-lg shadow-gray-200/40 border border-violet-100 animate-float-subtle">
        <Heart className="w-3.5 h-3.5 text-violet-500 fill-violet-500" />
        <span className="text-sm font-bold text-gray-800">6/10 tampons</span>
      </div>
    </div>
  );
}

/* ── Visual: Brand Customization (DA) ── */
function BrandVisual() {
  const colors = [
    { bg: 'bg-gradient-to-br from-indigo-400 to-violet-500', ring: 'ring-indigo-300' },
    { bg: 'bg-gradient-to-br from-pink-300 to-rose-400', ring: 'ring-pink-200' },
    { bg: 'bg-gradient-to-br from-rose-600 to-pink-700', ring: 'ring-rose-400' },
    { bg: 'bg-gradient-to-br from-amber-200 to-yellow-300', ring: 'ring-amber-200' },
    { bg: 'bg-gradient-to-br from-stone-400 to-stone-500', ring: 'ring-stone-300' },
    { bg: 'bg-gradient-to-br from-gray-800 to-gray-900', ring: 'ring-gray-600', active: true },
  ];

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
        <div className="flex items-center justify-center gap-3 mb-5">
          {colors.map((color, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE }}
              className="relative"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${color.bg} ${color.active ? `ring-2 ${color.ring} ring-offset-2` : ''} shadow-sm`} />
              {color.active && (
                <MousePointer2 className="absolute -bottom-2 -right-2 w-5 h-5 text-gray-700 drop-shadow-sm" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-[10px] font-medium">Programme fidélité</p>
              <p className="text-white font-bold text-sm">Ton Salon</p>
            </div>
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-6 rounded-md ${i < 3 ? 'bg-white/20' : 'border border-dashed border-white/15'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-xs font-semibold text-gray-500">Aperçu en temps réel</span>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-indigo-100 animate-float-subtle">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-xs font-bold text-gray-800">Effet premium</span>
      </div>
    </div>
  );
}

/* ── Visual: Inactivity Reminders ── */
function InactivityVisual() {
  const reminders = [
    {
      title: 'Tes ongles te manquent !',
      subtitle: 'Ça fait 3 semaines, on t\'attend',
      time: 'maintenant',
      color: 'bg-indigo-500',
      icon: <Sparkles className="w-5 h-5 text-white" />,
    },
    {
      title: 'Plus qu\'1 tampon !',
      subtitle: 'Ton brushing offert t\'attend',
      time: 'hier',
      color: 'bg-violet-500',
      icon: <Gift className="w-5 h-5 text-white" />,
    },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        {reminders.map((notif, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
            className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${notif.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {notif.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-900 truncate">{notif.title}</p>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{notif.time}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{notif.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute -bottom-3 right-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-emerald-100 animate-float-subtle">
        <Bell className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-bold text-gray-800">100% auto</span>
      </div>
    </div>
  );
}

/* ── Visual: Birthday ── */
function BirthdayVisual() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      <div className="absolute inset-0 -m-4 bg-rose-100/50 rounded-3xl blur-[60px] pointer-events-none" />

      <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
              <Cake className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Joyeux anniversaire !</p>
              <p className="text-xs text-gray-500">Sophie M.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-rose-100">
            <p className="text-sm font-semibold text-gray-800">-20% sur ton prochain soin</p>
            <p className="text-xs text-gray-400 mt-0.5">Valable 7 jours</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">12</p>
            <p className="text-[10px] text-gray-400 font-medium">Ce mois</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div>
            <p className="text-lg font-bold text-gray-900">87%</p>
            <p className="text-[10px] text-gray-400 font-medium">Reviennent</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div>
            <p className="text-lg font-bold text-gray-900">Auto</p>
            <p className="text-[10px] text-gray-400 font-medium">Envoi</p>
          </div>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-rose-100 animate-float-subtle">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        <span className="text-xs font-bold text-gray-800">Automatique</span>
      </div>
    </div>
  );
}

/* ── Visual: Special Events ── */
function EventsVisual() {
  const events = [
    { name: 'Saint-Valentin', date: '14 fév.', color: 'bg-pink-500', icon: <Heart className="w-4 h-4 text-white fill-white" /> },
    { name: 'Fête des mères', date: '25 mai', color: 'bg-violet-500', icon: <CalendarHeart className="w-4 h-4 text-white" /> },
    { name: 'Noël', date: '25 déc.', color: 'bg-emerald-500', icon: <Sparkles className="w-4 h-4 text-white" /> },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        {events.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${event.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {event.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{event.name}</p>
              <p className="text-xs text-gray-400">{event.date}</p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 rounded-full px-2.5 py-1">
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">Programmé</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute -bottom-3 left-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-emerald-100 animate-float-subtle">
        <CalendarHeart className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-bold text-gray-800">On s'occupe de tout</span>
      </div>
    </div>
  );
}

/* ── Visual: Referral ── */
function ReferralVisual() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto flex items-center justify-center py-6">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1.5 md:gap-2">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-violet-100 rounded-2xl flex items-center justify-center shadow-sm">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm">M</span>
            </div>
          </div>
          <div className="bg-violet-50 rounded-full px-3 py-1">
            <span className="text-xs font-bold text-violet-700">Marie</span>
          </div>
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-md shadow-gray-200/40 border border-violet-100">
            <span className="text-[11px] font-bold text-violet-600">-20% offert</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Share2 className="w-4 h-4 text-gray-300" />
          <div className="w-12 border-t-2 border-dashed border-gray-200" />
        </div>

        <div className="flex flex-col items-center gap-1.5 md:gap-2">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-2xl flex items-center justify-center shadow-sm">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm">S</span>
            </div>
          </div>
          <div className="bg-pink-50 rounded-full px-3 py-1">
            <span className="text-xs font-bold text-pink-700">Sophie</span>
          </div>
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-md shadow-gray-200/40 border border-pink-100">
            <span className="text-[11px] font-bold text-pink-600">-20% offert</span>
          </div>
        </div>
      </div>

      <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white rounded-full px-4 py-2 shadow-lg shadow-gray-200/40 border border-gray-100 animate-float-subtle">
        <Gift className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-bold text-gray-800">Les deux sont récompensées</span>
      </div>
    </div>
  );
}

/* ── Visual: Google Reviews ── */
function GoogleReviewsVisual() {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        {[
          { name: 'Camille L.', text: 'Un super salon, je recommande !', stars: 5 },
          { name: 'Inès M.', text: 'Personnel au top, résultat parfait.', stars: 5 },
          { name: 'Léa D.', text: 'J\'adore, j\'y retourne chaque mois.', stars: 5 },
        ].map((review, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
            className="bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">{review.name[0]}</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{review.name}</span>
              <div className="flex gap-0.5 ml-auto">
                {[...Array(review.stars)].map((_, j) => (
                  <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">{review.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="absolute -top-3 right-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-amber-100 animate-float-subtle">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span className="text-xs font-bold text-gray-800">4.9 Google</span>
      </div>
    </div>
  );
}

/* ── Section ── */

export function BentoFeaturesSection() {
  return (
    <section className="relative py-20 md:py-28 bg-gray-50/50 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tous les outils pour{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              fidéliser tes clientes.
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Chaque fonctionnalité a été pensée pour te simplifier la vie. Pas de superflu.
          </p>
        </motion.div>

        <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
          <FeatureBlock
            title="Tamponne en"
            titleBold="5 secondes."
            description="Affiche ton QR code, ta cliente scanne avec son téléphone, le point est validé. Pas d'appli à télécharger, pas de compte à créer."
            visual={<QRCodeVisual />}
          />

          <Separator />

          <FeatureBlock
            title="Récompense tes clientes"
            titleBold="les plus fidèles."
            description="Crée ton programme en 2 minutes. Paliers, récompenses, couleurs — tout s'adapte à ton image."
            visual={<LoyaltyCardVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Adapte ta carte à"
            titleBold="ton image."
            description="Tes couleurs, ton ambiance. Une carte aux couleurs de ton institut donne un effet premium — tes clientes reviennent plus, dépensent plus."
            visual={<BrandVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Relance les clientes"
            titleBold="qui s'éloignent."
            description="Une cliente ne vient plus ? On la détecte et on lui envoie un rappel au bon moment. Chaque relance, c'est du chiffre d'affaires récupéré."
            visual={<InactivityVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="N'oublie plus jamais un"
            titleBold="anniversaire."
            description="Une offre surprise le jour J, envoyée automatiquement. Résultat : elles reviennent et dépensent en moyenne 30% de plus."
            visual={<BirthdayVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Saint-Valentin, Noël,"
            titleBold="fête des mères..."
            description="Programme tes offres à l'avance pour chaque événement. On s'occupe de l'envoi au bon moment."
            visual={<EventsVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Transforme tes clientes en"
            titleBold="ambassadrices."
            description="Un lien, un partage, deux récompenses. Chaque cliente satisfaite te rapporte de nouvelles clientes — sans pub, sans budget."
            visual={<ReferralVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Booste tes"
            titleBold="avis Google."
            description="On demande un avis au bon moment. Tes clientes satisfaites deviennent tes meilleures ambassadrices en ligne."
            visual={<GoogleReviewsVisual />}
            delay={0.05}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-20 text-center"
        >
          <a
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('bento_cta', 'bento_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Essaie gratuitement
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-sm text-gray-400 mt-3">7 jours gratuits, sans carte bancaire</p>
        </motion.div>
      </div>
    </section>
  );
}
