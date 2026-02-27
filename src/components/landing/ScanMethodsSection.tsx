'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';

function QRCard() {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/30 p-8 flex flex-col items-center text-center">
      {/* QR code visual — même hauteur que l'image NFC */}
      <div className="relative w-full max-w-[220px] h-[140px] bg-white rounded-2xl border-2 border-indigo-200 flex items-center justify-center mb-6 shadow-inner overflow-visible">
        <svg viewBox="0 0 100 100" className="w-[72px] h-[72px]">
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
          <rect x="38" y="18" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="5" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="18" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="38" y="38" width="8" height="8" rx="1.5" fill="#6366f1" />
          <rect x="52" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="70" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="85" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="38" y="52" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="52" y="52" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="70" y="70" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="85" y="70" width="8" height="8" rx="1.5" fill="#4f46e5" />
          <rect x="70" y="85" width="8" height="8" rx="1.5" fill="#4f46e5" />
        </svg>
        {/* Scan line */}
        <div className="absolute inset-x-8 top-4 h-px bg-indigo-400/40 rounded-full animate-pulse" />
        {/* +1 flottant */}
        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-sm font-extrabold rounded-full w-9 h-9 flex items-center justify-center shadow-md shadow-emerald-300/50 animate-bounce">
          +1
        </div>
      </div>

      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">QR code</h3>
      <p className="text-lg text-gray-500 leading-relaxed">
        Disponible dès ton inscription. Garde-le sur ton téléphone et fidélise ta première cliente aujourd&apos;hui — sans rien imprimer, sans attendre.
      </p>

      <div className="mt-6 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-2">
        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-bold text-emerald-700">Prêt en 2 minutes, sur ton téléphone</span>
      </div>
    </div>
  );
}

function NFCCard() {
  return (
    <div className="flex-1 bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl border border-violet-100 shadow-xl shadow-violet-100/30 p-8 flex flex-col items-center text-center">
      {/* Badge NFC image */}
      <div className="relative mb-6">
        <Image
          src="/images/Carte NFC QARTE .png"
          alt="Carte NFC Qarte"
          width={220}
          height={140}
          className="rounded-2xl shadow-lg shadow-violet-200/40"
        />
        {/* Ripple waves */}
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-violet-300/50 animate-ping" style={{ animationDuration: '1.8s' }} />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-violet-400/40 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
      </div>

      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Carte NFC</h3>
      <p className="text-lg text-gray-500 leading-relaxed">
        Pose-le sur le comptoir. Ta cliente approche son téléphone — le point est validé instantanément. Pas de manipulation, pas d&apos;explication.
      </p>

      <div className="mt-6 flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-2">
        <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
        <span className="text-sm font-bold text-violet-700">Envoyé après souscription</span>
      </div>
    </div>
  );
}

export function ScanMethodsSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div ref={ref} className="px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-6xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 md:whitespace-nowrap">
            Deux façons de tamponner,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">
              zéro prise de tête.
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            QR code inclus. Carte NFC disponible. Aucune application à télécharger — ni pour toi, ni pour ta cliente.
          </p>
        </motion.div>

        {/* Two cards */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex-1 flex"
          >
            <QRCard />
          </motion.div>

          {/* VS divider — desktop */}
          <div className="hidden md:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-px h-16 bg-gray-200" />
              <span className="text-xs font-bold text-gray-300 bg-white px-2">OU</span>
              <div className="w-px h-16 bg-gray-200" />
            </div>
          </div>
          {/* VS divider — mobile */}
          <div className="md:hidden flex items-center justify-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-bold text-gray-300">OU</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex-1 flex"
          >
            <NFCCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
