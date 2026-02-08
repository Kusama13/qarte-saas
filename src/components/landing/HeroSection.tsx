'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ChevronDown,
  X,
  Clock,
  Eye,
  Home,
  Gift,
  Users,
  Calendar,
  UserCheck,
  QrCode,
  Crown,
  CreditCard,
  Settings,
  Megaphone,
  Check,
  Footprints,
} from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

// Mini chart SVG for the dashboard mockup
function MiniChart() {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-full">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#654EDA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#654EDA" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,45 Q25,40 50,35 T100,20 T150,28 T200,10" fill="none" stroke="#654EDA" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0,45 Q25,40 50,35 T100,20 T150,28 T200,10 L200,60 L0,60 Z" fill="url(#chartGrad)" />
    </svg>
  );
}

// Dashboard mockup component
function DashboardMockup() {
  const sidebarItems = [
    { icon: Home, label: 'Accueil', active: true, color: 'bg-indigo-500' },
    { icon: Gift, label: 'Programme', active: false, color: 'bg-pink-500' },
    { icon: QrCode, label: 'QR Code', active: false, color: 'bg-violet-500' },
    { icon: Users, label: 'Clients', active: false, color: 'bg-emerald-500' },
    { icon: Crown, label: 'Membres', active: false, color: 'bg-amber-500' },
    { icon: Megaphone, label: 'Marketing', active: false, color: 'bg-orange-500' },
    { icon: CreditCard, label: 'Abonnement', active: false, color: 'bg-amber-500' },
    { icon: Settings, label: 'Paramètres', active: false, color: 'bg-slate-400' },
  ];

  const stats = [
    { label: 'Clients inscrits', value: '247', icon: Users, color: '#654EDA', trend: '+12%' },
    { label: 'Clients actifs', value: '183', icon: UserCheck, color: '#10B981', trend: '+8%' },
    { label: 'Visites ce mois', value: '1,024', icon: Calendar, color: '#F59E0B', trend: '+23%' },
    { label: 'Récompenses', value: '42', icon: Gift, color: '#EC4899', trend: '+5%' },
  ];

  const recentClients = [
    { name: 'Sophie M.', time: 'Il y a 12min', stamps: 7, max: 10, initials: 'SM', gradient: 'from-rose-400 to-pink-500' },
    { name: 'Clara D.', time: 'Il y a 1h', stamps: 4, max: 10, initials: 'CD', gradient: 'from-violet-400 to-indigo-500' },
    { name: 'Léa P.', time: 'Il y a 2h', stamps: 9, max: 10, initials: 'LP', gradient: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="w-full h-full flex bg-gray-50 rounded-xl overflow-hidden text-[10px] lg:text-xs">
      {/* Sidebar */}
      <div className="w-[140px] lg:w-[160px] bg-white/95 border-r border-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-3 py-3 flex items-center gap-1.5 border-b border-gray-100">
          <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-[8px] lg:text-[10px]">Q</span>
          </div>
          <span className="font-bold text-gray-900 text-[10px] lg:text-xs">Qarte</span>
        </div>
        {/* Nav Items */}
        <div className="flex-1 px-2 py-2 space-y-0.5">
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded flex items-center justify-center ${item.active ? 'bg-white/20' : item.color + '/10'}`}>
                <item.icon className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${item.active ? 'text-white' : ''}`} style={!item.active ? { color: item.color.replace('bg-', '').includes('slate') ? '#64748B' : undefined } : undefined} />
              </div>
              <span className="font-medium truncate">{item.label}</span>
            </div>
          ))}
        </div>
        {/* User */}
        <div className="px-3 py-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-[7px] lg:text-[8px]">NB</div>
            <div className="truncate">
              <div className="font-semibold text-gray-800 truncate text-[9px] lg:text-[10px]">Nails & Beauty</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 lg:p-4 overflow-hidden">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 lg:gap-3 mb-3 lg:mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-2 lg:p-3 border border-gray-100/50 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                  <stat.icon className="w-2.5 h-2.5 lg:w-3 lg:h-3" style={{ color: stat.color }} />
                </div>
                <span className="text-emerald-500 font-bold text-[8px] lg:text-[9px]">{stat.trend}</span>
              </div>
              <div className="font-extrabold text-gray-900 text-sm lg:text-base">{stat.value}</div>
              <div className="text-gray-400 text-[8px] lg:text-[9px] truncate">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-5 gap-2 lg:gap-3">
          {/* Chart */}
          <div className="col-span-3 bg-white rounded-xl p-2 lg:p-3 border border-gray-100/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-800">Visites (7 jours)</span>
              <div className="flex items-center gap-1 text-emerald-500">
                <span className="font-bold text-[8px] lg:text-[9px]">+23%</span>
              </div>
            </div>
            <div className="h-[60px] lg:h-[80px]">
              <MiniChart />
            </div>
            <div className="flex justify-between mt-1 text-gray-300 text-[7px] lg:text-[8px]">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-2 bg-white rounded-xl p-2 lg:p-3 border border-gray-100/50 shadow-sm">
            <span className="font-bold text-gray-800 block mb-2">Activité récente</span>
            <div className="space-y-2">
              {recentClients.map((client) => (
                <div key={client.name} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-r ${client.gradient} flex items-center justify-center text-white font-bold text-[6px] lg:text-[7px] shrink-0`}>
                    {client.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 truncate text-[9px] lg:text-[10px]">{client.name}</span>
                      <span className="text-gray-300 text-[7px] lg:text-[8px] shrink-0">{client.time}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${(client.stamps / client.max) * 100}%` }} />
                      </div>
                      <span className="text-gray-400 text-[7px] lg:text-[8px] shrink-0">{client.stamps}/{client.max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating client card mockup
function FloatingClientCard() {
  const stamps = 7;
  const total = 10;
  const primaryColor = '#EC4899';

  return (
    <div className="w-[200px] lg:w-[240px] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="relative px-3 py-3 lg:px-4 lg:py-4 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl" style={{ background: primaryColor, opacity: 0.15 }} />
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-[10px] lg:text-xs">NB</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-[10px] lg:text-xs">Nails & Beauty</div>
            <div className="text-gray-400 text-[8px] lg:text-[9px]">Carte de fidélité</div>
          </div>
        </div>
      </div>

      {/* Stamps Grid */}
      <div className="px-3 py-3 lg:px-4 lg:py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Footprints className="w-3 h-3 text-pink-500" />
            <span className="font-bold text-gray-700 text-[9px] lg:text-[10px]">{stamps}/{total} Passages</span>
          </div>
          <span className="text-[8px] lg:text-[9px] font-semibold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-full">70%</span>
        </div>
        <div className="grid grid-cols-5 gap-1 lg:gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                i < stamps
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm'
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              {i < stamps ? (
                <Check className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
              ) : (
                <span className="text-gray-300 text-[8px] lg:text-[9px] font-medium">{i + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Reward */}
        <div className="mt-2 lg:mt-3 px-2 py-1.5 lg:px-3 lg:py-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100">
          <div className="flex items-center gap-1">
            <Gift className="w-3 h-3 text-pink-500" />
            <span className="text-[8px] lg:text-[9px] font-semibold text-pink-600">Plus que 3 passages !</span>
          </div>
          <span className="text-[8px] lg:text-[9px] text-gray-500 mt-0.5 block">→ Une pose gel offerte</span>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { ref, isInView } = useInView();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Sticky Top Banner - Customer Card Recovery */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500 hidden sm:inline">Vous avez déjà une carte de fidélité ?</span>
          <span className="text-gray-500 sm:hidden">Déjà client ?</span>
          <a
            href="/customer/cards"
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            Retrouver ma carte →
          </a>
        </div>
      </div>

      {/* Fixed Navbar - Light */}
      <nav className="fixed top-[36px] left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Qarte</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors link-underline">Solutions</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors link-underline">Tarifs</a>
            <a href="/contact" className="hover:text-indigo-600 transition-colors link-underline">Contact</a>
            <a href="/auth/merchant" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg">Espace Pro</a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-3">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Solutions
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Tarifs
                </a>
                <a
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Contact
                </a>
                <a
                  href="/auth/merchant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 mt-2 text-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-lg transition-all shadow-sm"
                >
                  Espace Pro
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Animated Background & Particles - Light */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob absolute top-20 left-20 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="animate-blob absolute bottom-20 right-20 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl delay-200" style={{ animationDelay: '2s' }} />
        <div className="animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse delay-700 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-1000 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 pt-28 lg:pt-32 pb-8">
        {/* Text Content - Centered & Compact */}
        <div className={`max-w-3xl mx-auto text-center space-y-5 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 backdrop-blur-md rounded-full border border-indigo-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs text-indigo-700 font-semibold tracking-wide uppercase">Prêt en 3 minutes</span>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Vos clientes passent une fois et ne reviennent jamais.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                Changez ça aujourd&apos;hui.
              </span>
            </h1>
          </div>

          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            <span className="text-gray-900 font-medium">+40% de clientes régulières</span> en moyenne. Vos clientes scannent un QR code, cumulent des points, reviennent. Sans app, sans carte papier.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); }}
              className="group relative px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Lancer mon programme gratuit</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="/customer/card/demo-onglerie?preview=true&demo=true"
              onClick={() => trackCtaClick('hero_demo', 'hero_section')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:from-pink-600 hover:to-rose-600 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye className="w-5 h-5" />
              Voir une démo
            </a>
          </div>

          {/* Social Proof Stats - Compact */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-gray-200/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">
                    {['S', 'C', 'M', 'L'][i-1]}
                  </div>
                ))}
              </div>
              <span className="text-gray-600"><span className="font-semibold text-gray-900">150+</span> instituts</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-gray-600"><span className="font-semibold text-gray-900">4.9/5</span></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="text-gray-600">
              <span className="font-semibold text-gray-900">12,000+</span> clientes fidélisées
            </div>
          </div>
        </div>

        {/* Product Showcase - Dashboard + Floating Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-10 lg:mt-14"
        >
          {/* Glow behind the dashboard */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-pink-500/20 rounded-3xl blur-3xl pointer-events-none" />

          {/* Dashboard Frame */}
          <div className="relative bg-white rounded-2xl lg:rounded-3xl shadow-2xl shadow-gray-900/15 border border-gray-200/60 overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100/80 border-b border-gray-200/60">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-[10px] lg:text-xs text-gray-400 font-medium border border-gray-200/60 max-w-xs mx-auto text-center">
                  app.qarte.fr/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="h-[260px] sm:h-[300px] lg:h-[380px]">
              <DashboardMockup />
            </div>
          </div>

          {/* Floating Client Card - Positioned to overlap */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-8 -right-2 sm:right-4 lg:-right-6 lg:-bottom-12 z-10 animate-float"
          >
            <FloatingClientCard />
          </motion.div>

          {/* Floating notification badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -top-4 -left-2 sm:left-8 lg:-left-4 z-10"
          >
            <div className="bg-white rounded-xl shadow-xl shadow-gray-900/10 border border-gray-100 px-3 py-2 lg:px-4 lg:py-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-[10px] lg:text-xs">Nouveau passage !</div>
                <div className="text-gray-400 text-[8px] lg:text-[10px]">Sophie M. — 7/10 tampons</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-gray-400" />
      </div>
    </section>
  );
}
