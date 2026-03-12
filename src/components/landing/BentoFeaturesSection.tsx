'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
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
  Nfc,
  Link2,
  MapPin,
  UserPlus,
  Zap,
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
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-6 md:gap-10 lg:gap-24`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-2xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 md:mb-5">
          {title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-base md:text-xl text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
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

/* ── Visual: QR + NFC compact ── */
function ScanMethodsVisual() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="flex gap-4">
        {/* QR Code mini */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 p-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-xl border-2 border-indigo-100 p-2 shadow-sm mb-3">
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
              <rect x="38" y="38" width="8" height="8" rx="1.5" fill="#6366f1" />
              <rect x="70" y="70" width="8" height="8" rx="1.5" fill="#6366f1" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-800">QR Code</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Inclus</p>
        </div>

        {/* NFC mini */}
        <div className="flex-1 bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl shadow-lg shadow-violet-100/30 border border-violet-100 p-4 flex flex-col items-center">
          <div className="relative mb-3">
            <Image
              src="/images/Carte NFC QARTE .png"
              alt="Carte NFC Qarte"
              width={80}
              height={52}
              className="rounded-lg shadow-md shadow-violet-200/40"
            />
          </div>
          <p className="text-xs font-bold text-gray-800">Carte NFC</p>
          <p className="text-[10px] text-gray-400 mt-0.5">En option</p>
        </div>
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

/* ── Visual: Program + Brand (fusionné) ── */
function ProgramBrandVisual() {
  const colors = [
    { bg: 'bg-gradient-to-br from-indigo-400 to-violet-500' },
    { bg: 'bg-gradient-to-br from-pink-300 to-rose-400' },
    { bg: 'bg-gradient-to-br from-rose-600 to-pink-700' },
    { bg: 'bg-gradient-to-br from-amber-200 to-yellow-300' },
    { bg: 'bg-gradient-to-br from-gray-800 to-gray-900', active: true },
  ];

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="absolute inset-0 -m-4 bg-violet-100/50 rounded-3xl blur-[60px] pointer-events-none" />

      <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        {/* Color picker */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          {colors.map((color, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE }}
              className="relative"
            >
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full ${color.bg} ${color.active ? 'ring-2 ring-gray-600 ring-offset-2' : ''} shadow-sm`} />
              {color.active && (
                <MousePointer2 className="absolute -bottom-1.5 -right-1.5 w-4 h-4 text-gray-700 drop-shadow-sm" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Card preview */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-[10px] font-medium">Programme fidélité</p>
              <p className="text-white font-bold text-sm">Ton Salon</p>
            </div>
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-6 rounded-md flex items-center justify-center ${
                  i < 6 ? 'bg-white/20' : 'border border-dashed border-white/15'
                }`}
              >
                {i < 6 && <Heart className="w-3 h-3 text-white fill-white" />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            <Gift className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-[11px] font-semibold">Brushing offert</span>
            <ChevronRight className="w-3 h-3 text-white/40 ml-auto" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-[11px] font-semibold text-gray-500">Aperçu en temps réel</span>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-violet-100 animate-float-subtle">
        <Heart className="w-3.5 h-3.5 text-violet-500 fill-violet-500" />
        <span className="text-xs font-bold text-gray-800">6/10 tampons</span>
      </div>
    </div>
  );
}

/* ── Visual: Public Page (Ma Page) ── */
function PublicPageVisual() {
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div className="absolute inset-0 -m-4 bg-violet-100/50 rounded-3xl blur-[60px] pointer-events-none" />

      <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        {/* Header merchant */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">L&apos;Atelier</p>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-400">Paris 11e</span>
            </div>
          </div>
        </div>

        {/* Booking CTA */}
        <div className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-3 py-2.5 flex items-center justify-center gap-2 mb-4">
          <CalendarHeart className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold text-white">Prendre rendez-vous</span>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-gray-300" />
            </div>
          ))}
        </div>

        {/* Services preview */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Brushing</span>
            <span className="text-[10px] font-bold text-gray-800">35 &euro;</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Couleur</span>
            <span className="text-[10px] font-bold text-gray-800">65 &euro;</span>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full" />
          <div className="w-7 h-7 bg-gray-900 rounded-full" />
          <div className="w-7 h-7 bg-blue-500 rounded-full" />
        </div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-indigo-100 animate-float-subtle">
        <Link2 className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-xs font-bold text-gray-800">Lien en bio</span>
      </div>
    </div>
  );
}

/* ── Visual: Welcome Offer ── */
function WelcomeOfferVisual() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      {/* Welcome offer card */}
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-3xl shadow-xl shadow-violet-100/30 border border-violet-100 p-6 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Offre de bienvenue</span>
        </div>
        <p className="text-sm font-bold text-gray-800 mb-3">-20% sur votre première visite</p>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-4 py-2.5 text-center mb-2">
          <span className="text-xs font-bold text-white">En profiter</span>
        </div>
        <p className="text-[10px] text-gray-400 text-center">Inscrivez-vous pour en profiter</p>
      </div>

      {/* Result card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        className="bg-white rounded-2xl p-3 shadow-lg shadow-gray-200/40 border border-emerald-100 flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800">Sophie M.</p>
          <p className="text-[10px] text-gray-400">Nouvelle cliente inscrite</p>
        </div>
      </motion.div>

      {/* Floating badges */}
      <div className="absolute -top-3 -left-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-emerald-100 animate-float-subtle">
        <Zap className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-bold text-gray-800">0 &euro; de pub</span>
      </div>

      <div className="absolute -bottom-1 -right-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-pink-100 animate-float-subtle" style={{ animationDelay: '0.5s' }}>
        <UserPlus className="w-3.5 h-3.5 text-pink-500" />
        <span className="text-xs font-bold text-gray-800">+1 cliente</span>
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

/* ── Visual: Auto Offers (anniversaires + événements fusionnés) ── */
function AutoOffersVisual() {
  const offers = [
    { name: 'Anniversaire de Sophie', label: '-20% soin', color: 'bg-rose-500', icon: <Cake className="w-4 h-4 text-white" />, badge: 'Auto' },
    { name: 'Saint-Valentin', label: 'Offre duo', color: 'bg-pink-500', icon: <Heart className="w-4 h-4 text-white fill-white" />, badge: 'Programmé' },
    { name: 'Fête des mères', label: '-15% coffret', color: 'bg-violet-500', icon: <CalendarHeart className="w-4 h-4 text-white" />, badge: 'Programmé' },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        {offers.map((offer, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${offer.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {offer.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{offer.name}</p>
              <p className="text-xs text-gray-400">{offer.label}</p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 rounded-full px-2.5 py-1 flex-shrink-0">
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">{offer.badge}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats bar */}
      <div className="mt-3 flex items-center justify-center gap-6 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">87%</p>
          <p className="text-[10px] text-gray-400 font-medium">Reviennent</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-lg font-bold text-gray-900">+30%</p>
          <p className="text-[10px] text-gray-400 font-medium">Dépensent</p>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-emerald-100 animate-float-subtle">
        <CalendarHeart className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-bold text-gray-800">100% auto</span>
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

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Encore plus d&apos;outils pour fidéliser{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              et augmenter ton C.A.
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Créé en France 🇫🇷 par des pros de la beauté et du bien-être. Chaque fonctionnalité est pensée pour te simplifier la vie.
          </p>
        </motion.div>

        <div className="flex flex-col gap-6 md:gap-10 lg:gap-12">
          <FeatureBlock
            title="QR code ou NFC,"
            titleBold="zéro prise de tête."
            description="QR code prêt en 2 minutes sur ton téléphone. Carte NFC en option sur le comptoir. Aucune appli à télécharger — ni pour toi, ni pour ta cliente."
            visual={<ScanMethodsVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Crée ton programme à"
            titleBold="ton image."
            description="Paliers, récompenses, couleurs — tout se configure en 2 minutes. Une carte aux couleurs de ton salon donne un effet premium. Tes clientes la montrent, en parlent, reviennent."
            visual={<ProgramBrandVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Ta page pro,"
            titleBold="en un lien."
            description="Un seul lien dans ta bio Instagram et tes clientes retrouvent tout : ton salon, tes prestations, ta carte fidélité, la prise de rendez-vous. Mieux qu'un Linktree."
            visual={<PublicPageVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Attire de nouveaux clients"
            titleBold="sans dépenser en pub."
            description="Configure ton offre de bienvenue en 30 secondes. Tes nouvelles clientes la découvrent sur ta page, s'inscrivent et reviennent. 0 € de publicité."
            visual={<WelcomeOfferVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Relance les clients"
            titleBold="qui s'éloignent."
            description="Un client ne vient plus ? On le détecte et on lui envoie un rappel au bon moment. Chaque relance, c'est du chiffre d'affaires récupéré."
            visual={<InactivityVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Anniversaires, Noël, fête des mères —"
            titleBold="tout est automatique."
            description="Offre surprise le jour J, promos événementielles programmées à l'avance. On s'occupe de tout — tes clientes reviennent et dépensent 30% de plus."
            visual={<AutoOffersVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Transforme tes clients en"
            titleBold="ambassadeurs."
            description="Un lien, un partage, deux récompenses. Chaque client satisfait te rapporte de nouveaux clients — sans pub, sans budget."
            visual={<ReferralVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Booste tes"
            titleBold="avis Google."
            description="On demande un avis au bon moment. Tes clients satisfaits deviennent tes meilleurs ambassadeurs en ligne."
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
