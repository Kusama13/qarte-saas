'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, AlertCircle, QrCode, Flashlight, FlashlightOff, Check, Sparkles } from 'lucide-react';
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

// Confetti particle component
const ConfettiParticle = ({ color, delay }: { color: string; delay: number }) => (
  <motion.div
    initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
    animate={{
      y: [0, -100, 200],
      x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100],
      opacity: [1, 1, 0],
      scale: [1, 1.2, 0.5],
      rotate: [0, 360, 720],
    }}
    transition={{ duration: 1.5, delay, ease: 'easeOut' }}
    className="absolute w-3 h-3 rounded-sm"
    style={{ backgroundColor: color }}
  />
);

// Glowing corner component
const GlowingCorner = ({
  position,
  primaryColor
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  primaryColor: string;
}) => {
  const positionClasses = {
    tl: 'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
    tr: 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
    bl: 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
    br: 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
  };

  return (
    <motion.div
      className={`absolute w-16 h-16 ${positionClasses[position]}`}
      style={{ borderColor: primaryColor }}
      animate={{
        boxShadow: [
          `0 0 10px ${primaryColor}40, inset 0 0 10px ${primaryColor}20`,
          `0 0 25px ${primaryColor}80, inset 0 0 20px ${primaryColor}40`,
          `0 0 10px ${primaryColor}40, inset 0 0 10px ${primaryColor}20`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export default function QRScanner({ isOpen, onClose, onScan, primaryColor = '#6366f1' }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [invalidQR, setInvalidQR] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      const newState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        // @ts-expect-error - torch is not in the type definitions but works
        advanced: [{ torch: newState }]
      });
      setTorchOn(newState);
    } catch (err) {
      console.error('Torch toggle failed:', err);
    }
  }, [torchOn]);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);
      setInvalidQR(false);
      setScanSuccess(false);
      setScannedCode(null);
      setTorchOn(false);

      try {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!containerRef.current) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            // Validate that this is a Qarte QR code
            const validation = isValidQarteCode(decodedText);

            if (!validation.valid) {
              // Not a Qarte QR code - show error but keep scanning
              setInvalidQR(true);
              // Vibrate if available
              if (navigator.vibrate) navigator.vibrate(100);
              // Auto-hide error after 3 seconds
              setTimeout(() => setInvalidQR(false), 3000);
              return;
            }

            // Valid Qarte code - show success animation
            setScanSuccess(true);
            setScannedCode(validation.code!);

            // Vibrate success pattern
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Stop scanner
            scanner.stop().catch(console.error);

            // Delay before calling onScan to show animation
            setTimeout(() => {
              onScan(validation.code!);
            }, 1500);
          },
          () => {
            // QR code not found - this is called frequently, ignore
          }
        );

        // Check if torch is available
        try {
          const capabilities = await scanner.getRunningTrackCapabilities();
          // @ts-expect-error - torch is not in the type definitions
          if (capabilities.torch) {
            setTorchAvailable(true);
          }
        } catch {
          // Torch not available
        }
      } catch (err) {
        console.error('Scanner error:', err);
        if (err instanceof Error) {
          if (err.message.includes('Permission')) {
            setError('Accès caméra refusé. Autorisez l\'accès dans les paramètres.');
          } else if (err.message.includes('NotFoundError')) {
            setError('Aucune caméra trouvée sur cet appareil.');
          } else {
            setError('Impossible de démarrer la caméra.');
          }
        }
      } finally {
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    onClose();
  };

  const confettiColors = [primaryColor, '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          {/* Camera feed container - full screen */}
          <div className="absolute inset-0 bg-black">
            <div
              id="qr-reader"
              ref={containerRef}
              className="w-full h-full"
            />
          </div>

          {/* Semi-transparent overlay with hole */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top overlay */}
            <div className="absolute top-0 left-0 right-0 h-[calc(50%-140px)] bg-black/70" />
            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-140px)] bg-black/70" />
            {/* Left overlay */}
            <div className="absolute top-[calc(50%-140px)] left-0 w-[calc(50%-140px)] h-[280px] bg-black/70" />
            {/* Right overlay */}
            <div className="absolute top-[calc(50%-140px)] right-0 w-[calc(50%-140px)] h-[280px] bg-black/70" />
          </div>

          {/* Scan frame with glowing corners */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]">
            {/* Glowing corners */}
            <GlowingCorner position="tl" primaryColor={primaryColor} />
            <GlowingCorner position="tr" primaryColor={primaryColor} />
            <GlowingCorner position="bl" primaryColor={primaryColor} />
            <GlowingCorner position="br" primaryColor={primaryColor} />

            {/* Scanning line animation */}
            {!scanSuccess && !error && !isStarting && (
              <motion.div
                initial={{ top: '5%' }}
                animate={{ top: ['5%', '95%', '5%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-2 right-2 h-1 rounded-full"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 0 15px ${primaryColor}, 0 0 30px ${primaryColor}50`
                }}
              />
            )}

            {/* Success overlay */}
            <AnimatePresence>
              {scanSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl backdrop-blur-sm"
                >
                  {/* Confetti */}
                  <div className="absolute inset-0 overflow-hidden">
                    {confettiColors.map((color, i) => (
                      <div key={i} className="absolute top-1/2 left-1/2">
                        <ConfettiParticle color={color} delay={i * 0.05} />
                        <ConfettiParticle color={color} delay={i * 0.05 + 0.1} />
                      </div>
                    ))}
                  </div>

                  {/* Success checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                    <span className="font-semibold text-lg">QR Code scanné !</span>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-white/60 text-sm mt-2"
                  >
                    Redirection en cours...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pb-16">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <QrCode className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Scanner</h2>
                  <p className="text-white/50 text-xs">Scannez un QR code Qarte</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-8 px-6">
              {/* Torch button */}
              {torchAvailable && !scanSuccess && (
                <div className="flex justify-center mb-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTorch}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
                      torchOn
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                    }`}
                  >
                    {torchOn ? (
                      <>
                        <Flashlight className="w-5 h-5" />
                        <span className="font-medium">Lampe allumée</span>
                      </>
                    ) : (
                      <>
                        <FlashlightOff className="w-5 h-5" />
                        <span className="font-medium">Allumer la lampe</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Instructions */}
              {!scanSuccess && (
                <p className="text-white/60 text-center text-sm">
                  Placez le QR code Qarte du commerce dans le cadre
                </p>
              )}
            </div>
          </div>

          {/* Loading State */}
          <AnimatePresence>
            {isStarting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/90"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white mb-4"
                />
                <p className="text-white/80">Démarrage de la caméra...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4"
                >
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </motion.div>
                <p className="text-white text-center mb-6">{error}</p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-white text-gray-900 rounded-xl font-medium"
                >
                  Fermer
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invalid QR Code Warning */}
          <AnimatePresence>
            {invalidQR && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="absolute bottom-32 left-4 right-4 z-20"
              >
                <div className="bg-red-500 text-white px-5 py-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-red-500/30">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">QR code non reconnu</p>
                    <p className="text-white/80 text-sm">Scannez uniquement les QR codes Qarte</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
