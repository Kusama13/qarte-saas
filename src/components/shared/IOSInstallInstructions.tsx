'use client';

import { useTranslations } from 'next-intl';
import { X, ChevronDown, ChevronUp, Share, PlusSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface IOSInstallInstructionsProps {
  isIOS: boolean;
  isIOSChrome: boolean;
  onClose: () => void;
  /** Title displayed in the modal header */
  title?: string;
  /** Subtitle displayed below the title */
  subtitle?: string;
  /** CSS for the header background (inline style or className approach) */
  headerStyle?: React.CSSProperties;
  /** Colour of the PlusSquare icon in the header */
  iconColor?: string;
  /** CSS for the "J'ai compris" button background */
  buttonStyle?: React.CSSProperties;
  /** Extra className for the "J'ai compris" button */
  buttonClassName?: string;
  /** When true, show the non-iOS animated arrow. Defaults to true. */
  showNonIOSArrow?: boolean;
}

export default function IOSInstallInstructions({
  isIOS,
  isIOSChrome,
  onClose,
  title: titleProp,
  subtitle,
  headerStyle,
  iconColor = '#4f46e5',
  buttonStyle,
  buttonClassName = 'bg-indigo-600 hover:bg-indigo-700',
  showNonIOSArrow = true,
}: IOSInstallInstructionsProps) {
  const t = useTranslations('installInstructions');
  const title = titleProp || t('title');
  return (
    <>
      {/* Animated arrows pointing to the right button */}
      {isIOS && !isIOSChrome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
          className="fixed bottom-3 right-3 z-[60] flex flex-col items-center"
        >
          <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
            <ChevronDown className="w-6 h-6 text-blue-500" />
          </div>
        </motion.div>
      )}

      {isIOS && isIOSChrome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
          className="fixed top-3 right-3 z-[60] flex flex-col items-center"
        >
          <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
            <ChevronUp className="w-6 h-6 text-blue-500" />
          </div>
        </motion.div>
      )}

      {!isIOS && showNonIOSArrow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
          className="fixed top-3 right-3 z-[60] flex flex-col items-center"
        >
          <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
            <ChevronUp className="w-6 h-6 text-blue-500" />
          </div>
        </motion.div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="relative px-4 py-4 text-center bg-gradient-to-r from-indigo-50 to-violet-50"
            style={headerStyle}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center justify-center gap-2">
              <PlusSquare className="w-5 h-5" style={{ color: iconColor }} />
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>

          {/* Steps */}
          <div className="px-4 py-3 space-y-2">
            {isIOS && !isIOSChrome ? (
              <>
                <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">&#x22EF;</span>
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('iosSafariStep1', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('iosSafariStep2', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('iosSafariStep3', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
              </>
            ) : isIOS && isIOSChrome ? (
              <>
                <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('iosChromeStep1', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">&#x22EF;</span>
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('iosChromeStep2', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('iosChromeStep3', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">&#x22EE;</span>
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('androidStep1', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-800">{t.rich('androidStep2', { bold: (c) => <strong>{c}</strong> })}</p>
                </div>
              </>
            )}
          </div>

          {/* Footer button */}
          <div className="px-4 pb-4 pt-2">
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all ${buttonClassName}`}
              style={buttonStyle}
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
