'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  CreditCard,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  QrCode,
  Printer,
  TrendingUp,
  ChevronDown,
  Lock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { FacebookPixel, fbEvents } from '@/components/FacebookPixel';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// FAQ Data
const faqItems = [
  {
    question: 'Est-ce que je dois entrer ma carte bancaire ?',
    answer: 'Non, l\'essai est 100% gratuit et sans CB. Vous ne payez que si vous décidez de continuer après les 14 jours.',
  },
  {
    question: 'Est-ce que mes clients doivent télécharger une appli ?',
    answer: 'Non, tout se passe sur leur navigateur web. Vos clients scannent simplement le QR Code et accèdent instantanément à leur carte de fidélité. Zéro friction.',
  },
  {
    question: 'Et si je veux arrêter ?',
    answer: 'Vous arrêtez quand vous voulez en un clic depuis votre espace. Pas d\'engagement, pas de frais cachés, pas de questions.',
  },
];

// FAQ Accordion Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-gray-200 last:border-0"
      initial={false}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-5 text-left"
      >
        <span className="text-base font-medium text-gray-900 sm:text-lg">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-gray-600">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

// Exit Intent Popup
function ExitIntentPopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const handleCTAClick = () => {
    fbEvents.initiateCheckout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[101] w-[90%] max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
          >
            <div className="relative overflow-hidden bg-white shadow-2xl rounded-3xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute z-10 p-2 text-white transition-colors bg-black/30 rounded-full top-3 right-3 hover:bg-black/50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image header */}
              <div className="relative w-full h-48 sm:h-56">
                <Image
                  src="/images/exit-popup.jpg"
                  alt="Ne partez pas !"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  Attendez ! Ne partez pas si vite 👋
                </h3>
                <p className="mb-6 text-gray-600">
                  Testez Qarte gratuitement pendant 14 jours.
                  <br />
                  <span className="font-medium text-primary">Sans carte bancaire. Sans engagement.</span>
                </p>

                <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
                  <Button size="lg" className="w-full mb-3">
                    Essayer gratuitement
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  Non merci, je préfère passer à côté
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sticky Mobile CTA
function StickyMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    fbEvents.initiateCheckout();
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{
        y: isVisible ? 0 : 100,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg md:hidden"
    >
      <Link href="/auth/merchant/signup" onClick={handleClick}>
        <Button size="lg" className="w-full">
          Commencer l&apos;essai gratuit
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function OffreSpecialePage() {
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  const handleCTAClick = () => {
    fbEvents.initiateCheckout();
  };

  // Exit intent detection
  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the viewport
      if (e.clientY <= 0 && !hasShownPopup) {
        setShowExitPopup(true);
        setHasShownPopup(true);
      }
    },
    [hasShownPopup]
  );

  useEffect(() => {
    // Check if popup was already shown this session
    const popupShown = sessionStorage.getItem('exitPopupShown');
    if (popupShown) {
      setHasShownPopup(true);
    }

    // Desktop: mouse leave detection
    document.addEventListener('mouseout', handleMouseLeave);

    // Mobile: show popup after 30 seconds if still on page
    const mobileTimer = setTimeout(() => {
      if (!hasShownPopup && window.innerWidth < 768) {
        setShowExitPopup(true);
        setHasShownPopup(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    }, 30000);

    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
      clearTimeout(mobileTimer);
    };
  }, [handleMouseLeave, hasShownPopup]);

  const closeExitPopup = () => {
    setShowExitPopup(false);
    sessionStorage.setItem('exitPopupShown', 'true');
  };

  return (
    <div className="min-h-screen bg-white">
      <FacebookPixel />
      <ExitIntentPopup isOpen={showExitPopup} onClose={closeExitPopup} />
      <StickyMobileCTA />

      {/* Minimal Header */}
      <header className="py-6">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Qarte</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-primary-50 text-primary">
              <Sparkles className="w-4 h-4" />
              Offre Spéciale : Reprenez là où vous vous êtes arrêté
            </span>

            {/* H1 */}
            <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
              Lancez votre fidélité digitale en{' '}
              <span className="text-primary">2 minutes chrono.</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-600 sm:text-xl">
              Vous hésitez encore ? Testez gratuitement sans engagement.
              Pas de carte bancaire requise. Aucune compétence technique nécessaire.
            </p>

            {/* CTA Button */}
            <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
              <Button size="lg" className="text-lg px-8 py-4">
                Commencer mon essai gratuit maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            {/* Micro-copy */}
            <p className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              0% Risque • Annulable à tout moment
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section "Les 3 Freins levés" */}
      <section className="px-4 py-16 bg-gray-50 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {/* Card 1 - Simplicité */}
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-8"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary-50">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Pas besoin d&apos;être un geek
              </h3>
              <p className="text-gray-600">
                Créez votre compte, ajoutez votre logo, c&apos;est prêt.
                Si vous savez envoyer un SMS, vous savez utiliser Qarte.
              </p>
            </motion.div>

            {/* Card 2 - Rapidité */}
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-8"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary-50">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Installation éclair
              </h3>
              <p className="text-gray-600">
                Pas d&apos;application à installer pour vos clients.
                Un simple QR Code posé sur le comptoir suffit.
              </p>
            </motion.div>

            {/* Card 3 - Sécurité */}
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-8"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary-50">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Testez sans payer
              </h3>
              <p className="text-gray-600">
                Profitez de l&apos;essai gratuit pour voir les premiers clients revenir.
                Vous ne payez que si ça marche pour vous.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section "Comment ça marche" */}
      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Comment ça marche ?
            </h2>
            <p className="text-gray-600">
              3 étapes simples pour digitaliser votre fidélité
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {/* Step 1 */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-100"></div>
                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gray-900 rounded-full">
                  1
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Créez</h3>
              <p className="text-gray-600">
                Configurez votre carte de fidélité en quelques clics
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-100"></div>
                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gray-900 rounded-full">
                  2
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Imprimez</h3>
              <p className="text-gray-600">
                Recevez votre QR Code unique par email et imprimez-le
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-100"></div>
                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gray-900 rounded-full">
                  3
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Encaissez</h3>
              <p className="text-gray-600">
                Vos clients scannent, cumulent et reviennent
              </p>
            </motion.div>
          </motion.div>

          {/* CTA after steps */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 text-center"
          >
            <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
              <Button size="lg">
                Démarrer maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="px-4 py-16 bg-gray-50 sm:py-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="mb-10 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Questions fréquentes
            </h2>
            <p className="text-gray-600">
              On répond à vos dernières hésitations
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="p-6 bg-white border border-gray-100 rounded-2xl sm:p-8"
          >
            {faqItems.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Prêt à fidéliser vos clients ?
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Rejoignez les commerçants qui ont déjà digitalisé leur carte de fidélité
          </p>
          <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
            <Button size="lg" className="text-lg px-8 py-4">
              Créer mon compte gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            14 jours d&apos;essai gratuit • Sans carte bancaire
          </p>
        </motion.div>
      </section>

      {/* Bottom spacing for mobile sticky bar */}
      <div className="h-24 md:hidden"></div>
    </div>
  );
}
