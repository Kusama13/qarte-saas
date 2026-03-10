'use client';

import {
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HowItWorksProps {
  show: boolean;
}

export default function HowItWorks({ show }: HowItWorksProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-8"
        >
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Comment fonctionnent les programmes membres ?</h3>
                <p className="text-sm text-gray-600">Les programmes membres permettent de cr&eacute;er des avantages exclusifs pour tes meilleurs clients.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">1</div>
                  <span className="font-semibold text-gray-900">Cr&eacute;ez un programme</span>
                </div>
                <p className="text-sm text-gray-500">D&eacute;finissez un nom (ex: VIP Gold), un avantage (-10% permanent) et une dur&eacute;e d&apos;adh&eacute;sion.</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">2</div>
                  <span className="font-semibold text-gray-900">Ajoutez des membres</span>
                </div>
                <p className="text-sm text-gray-500">S&eacute;lectionne tes clients fid&egrave;les parmi ceux qui ont d&eacute;j&agrave; une carte de fid&eacute;lit&eacute; chez toi.</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">3</div>
                  <span className="font-semibold text-gray-900">Ils profitent des avantages</span>
                </div>
                <p className="text-sm text-gray-500">L&apos;avantage s&apos;affiche sur leur carte digitale. Tu peux renouveler ou retirer &agrave; tout moment.</p>
              </div>
            </div>

            <div className="mt-5 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Astuce :</strong> Utilise les programmes pour r&eacute;compenser tes 10 meilleurs clients avec un statut VIP permanent !
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
