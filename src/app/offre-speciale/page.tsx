'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  CreditCard,
  ArrowRight,
  Zap,
  Shield,
  Lock,
  X,
  Heart,
  Gift,
} from 'lucide-react';
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
            <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
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
                  Attendez ! Ne partez pas si vite
                </h3>
                <p className="mb-6 text-gray-600">
                  Testez Qarte gratuitement pendant 15 jours.
                  <br />
                  <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Sans carte bancaire. Sans engagement.</span>
                </p>

                <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
                  <button className="w-full mb-3 px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                    Essayer gratuitement
                    <ArrowRight className="w-5 h-5" />
                  </button>
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
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-lg md:hidden"
    >
      <Link href="/auth/merchant/signup" onClick={handleClick}>
        <button className="w-full px-6 py-4 text-base font-semibold text-white rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
          Commencer l&apos;essai gratuit
          <ArrowRight className="w-5 h-5" />
        </button>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      <FacebookPixel />
      <ExitIntentPopup isOpen={showExitPopup} onClose={closeExitPopup} />
      <StickyMobileCTA />

      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-secondary/15 to-primary/15 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-full blur-3xl" />

      {/* Minimal Header */}
      <header className="relative py-6">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Qarte</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-md border border-primary/20 text-primary shadow-sm">
              <Gift className="w-4 h-4" />
              Offre spéciale : 15 jours gratuits
            </span>

            {/* H1 */}
            <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
              Inscrivez votre établissement aujourd&apos;hui et{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">bénéficiez de 15 jours gratuits</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-600 sm:text-xl">
              Fini les cartes papier perdues. Offrez à vos clientes une carte de fidélité digitale élégante, accessible depuis leur téléphone.
            </p>

            {/* CTA Button */}
            <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
              <button className="px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 mx-auto">
                Inscrire mon établissement
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>

            {/* Micro-copy */}
            <p className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              15 jours gratuits • Sans carte bancaire
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative px-4 py-12 sm:py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto"
        >
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative h-64 md:h-auto md:min-h-[320px]">
                <Image
                  src="/images/testimonial-nail-salon.png"
                  alt="Nail Salon by Elodie"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                {/* Quote marks */}
                <div className="text-5xl text-primary/20 font-serif leading-none mb-2">"</div>

                <blockquote className="relative z-10">
                  <p className="text-lg text-gray-700 leading-relaxed italic mb-6">
                    Avant Qarte, je perdais des clientes qui oubliaient leurs cartes papier. Maintenant, elles reviennent plus souvent et me recommandent à leurs amies. En 3 mois, j&apos;ai vu mon taux de retour augmenter de 40%.
                  </p>
                  <footer className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base">
                      E
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Elodie</p>
                      <p className="text-sm text-gray-500">Nail Salon by Elodie, Paris</p>
                    </div>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section "Pourquoi Qarte" */}
      <section className="relative px-4 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {/* Card 1 */}
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-primary/5 rounded-3xl sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Conçu pour la beauté
              </h3>
              <p className="text-gray-600">
                Interface élégante adaptée aux instituts, salons de coiffure, spas et centres de bien-être.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-primary/5 rounded-3xl sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Zéro friction
              </h3>
              <p className="text-gray-600">
                Pas d&apos;appli à télécharger pour vos clientes. Un simple scan du QR Code suffit.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-primary/5 rounded-3xl sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Essai sans risque
              </h3>
              <p className="text-gray-600">
                15 jours pour tester gratuitement. Aucun engagement, aucune carte bancaire requise.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-4 py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-2xl mx-auto"
        >
          <div className="p-8 sm:p-12 bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl shadow-primary/10 text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Prête à fidéliser vos clientes ?
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Rejoignez les instituts et salons qui ont déjà digitalisé leur carte de fidélité
            </p>
            <Link href="/auth/merchant/signup" onClick={handleCTAClick}>
              <button className="px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 mx-auto">
                Créer mon compte gratuitement
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <p className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              15 jours d&apos;essai gratuit • Sans carte bancaire
            </p>
          </div>
        </motion.div>
      </section>

      {/* Bottom spacing for mobile sticky bar */}
      <div className="h-24 md:hidden"></div>
    </div>
  );
}
