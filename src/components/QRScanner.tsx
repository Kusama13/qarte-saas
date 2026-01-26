'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode, Flashlight, FlashlightOff, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  primaryColor?: string;
}

// Validate if the QR code is a Qarte code
const isValidQarteCode = (text: string): { valid: boolean; code?: string } => {
  // Check for Qarte URL patterns
  // Supports: getqarte.com/scan/CODE, www.getqarte.com/scan/CODE, https://getqarte.com/scan/CODE
  const qarteUrlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?getqarte\.com\/scan\/([^/?]+)/i);
  if (qarteUrlMatch) {
    return { valid: true, code: qarteUrlMatch[1] };
  }

  // Also support localhost for development
  const localhostMatch = text.match(/(?:https?:\/\/)?localhost(?::\d+)?\/scan\/([^/?]+)/i);
  if (localhostMatch) {
    return { valid: true, code: localhostMatch[1] };
  }

  // Support direct /scan/CODE path
  const pathMatch = text.match(/^\/scan\/([^/?]+)$/);
  if (pathMatch) {
    return { valid: true, code: pathMatch[1] };
  }

  return { valid: false };
};

export default function QRScanner({ isOpen, onClose, onScan, primaryColor = '#6366f1' }: QRScannerProps) {
  const [torchOn, setTorchOn] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [invalidQR, setInvalidQR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (result: { rawValue: string }[]) => {
    if (!result || result.length === 0 || scanSuccess) return;

    const text = result[0].rawValue;
    const validation = isValidQarteCode(text);

    if (!validation.valid) {
      // Not a Qarte QR code
      setInvalidQR(true);
      if (navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => setInvalidQR(false), 2500);
      return;
    }

    // Valid Qarte code
    setScanSuccess(true);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    // Delay to show success animation
    setTimeout(() => {
      onScan(validation.code!);
    }, 1000);
  };

  const handleError = (err: unknown) => {
    console.error('Scanner error:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Permission') || message.includes('NotAllowed')) {
      setError('Accès caméra refusé. Autorisez l\'accès dans les paramètres.');
    } else if (message.includes('NotFound')) {
      setError('Aucune caméra trouvée.');
    }
  };

  const handleClose = () => {
    setScanSuccess(false);
    setInvalidQR(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Camera Scanner */}
        <div className="absolute inset-0">
          {!error && (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{
                facingMode: 'environment',
              }}
              components={{
                torch: torchOn,
              }}
              styles={{
                container: {
                  width: '100%',
                  height: '100%',
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                },
              }}
            />
          )}
        </div>

        {/* Overlay with scan zone */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top overlay */}
          <div className="absolute top-0 left-0 right-0 h-[30%] bg-black/60" />
          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/60" />
          {/* Left overlay */}
          <div className="absolute top-[30%] left-0 w-[10%] h-[40%] bg-black/60" />
          {/* Right overlay */}
          <div className="absolute top-[30%] right-0 w-[10%] h-[40%] bg-black/60" />
        </div>

        {/* Scan frame */}
        <div className="absolute top-[30%] left-[10%] right-[10%] h-[40%] pointer-events-none">
          {/* Corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: primaryColor }} />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: primaryColor }} />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: primaryColor }} />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: primaryColor }} />

          {/* Scanning line */}
          {!scanSuccess && !error && (
            <motion.div
              initial={{ top: '5%' }}
              animate={{ top: ['5%', '95%', '5%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-4 right-4 h-0.5"
              style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}` }}
            />
          )}

          {/* Success overlay */}
          {scanSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}30` }}
              >
                <QrCode className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-white font-bold">Scanner</h2>
                <p className="text-white/60 text-xs">QR code Qarte uniquement</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {/* Torch toggle */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setTorchOn(!torchOn)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${
                torchOn ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'
              }`}
            >
              {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
              <span className="font-medium">{torchOn ? 'Lampe allumée' : 'Allumer lampe'}</span>
            </button>
          </div>

          <p className="text-white/60 text-center text-sm">
            Placez le QR code du commerce dans le cadre
          </p>
        </div>

        {/* Invalid QR Warning */}
        <AnimatePresence>
          {invalidQR && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-28 left-4 right-4 z-20"
            >
              <div className="bg-red-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">QR code non reconnu</p>
                  <p className="text-white/80 text-xs">Scannez uniquement un QR code Qarte</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-white mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-white text-black rounded-xl font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
