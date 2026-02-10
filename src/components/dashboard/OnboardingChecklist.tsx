'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Sparkles, X, Gift, QrCode, Users, Megaphone, ImageIcon } from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';

interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
  icon: React.ElementType;
}

const DISMISSED_KEY = 'qarte_checklist_dismissed';
const COMPLETED_KEY = 'qarte_checklist_completed_at';

export default function OnboardingChecklist() {
  const { merchant } = useMerchant();
  const supabase = getSupabase();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confettiFired, setConfettiFired] = useState(false);

  useEffect(() => {
    if (!merchant) return;

    // Check if dismissed this session
    const isDismissed = sessionStorage.getItem(`${DISMISSED_KEY}_${merchant.id}`);
    if (isDismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    // Check if completed more than 3 days ago → auto-hide
    const completedAt = localStorage.getItem(`${COMPLETED_KEY}_${merchant.id}`);
    if (completedAt) {
      const daysSince = (Date.now() - parseInt(completedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince > 3) {
        setDismissed(true);
        setLoading(false);
        return;
      }
    }

    const fetchSteps = async () => {
      try {
        const [visitsResult, pushRes, onboardingRes] = await Promise.all([
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .eq('status', 'confirmed'),
          fetch(`/api/push/history?merchantId=${merchant.id}&limit=1`)
            .then(r => r.json())
            .catch(() => ({ history: [] })),
          fetch('/api/onboarding/status')
            .then(r => r.json())
            .catch(() => ({ qrEmailSent: false })),
        ]);

        const visitsCount = visitsResult.count || 0;
        const hasPush = (pushRes.history?.length || 0) > 0;
        const qrDownloaded = onboardingRes.qrDownloaded === true;

        setSteps([
          {
            id: 'program',
            label: 'Configurer mon programme',
            done: !!merchant.reward_description,
            href: '/dashboard/program',
            icon: Gift,
          },
          {
            id: 'logo',
            label: 'Ajouter mon logo',
            done: !!merchant.logo_url,
            href: '/dashboard/settings',
            icon: ImageIcon,
          },
          {
            id: 'qr',
            label: 'Télécharger mon QR code',
            done: qrDownloaded,
            href: '/dashboard/qr-download',
            icon: QrCode,
          },
          {
            id: 'clients',
            label: 'Recevoir mes 2 premiers clients',
            done: visitsCount >= 2,
            href: '/dashboard/customers',
            icon: Users,
          },
          {
            id: 'push',
            label: 'Envoyer une notification push',
            done: hasPush,
            href: '/dashboard/marketing',
            icon: Megaphone,
          },
        ]);
      } catch (err) {
        console.error('Onboarding checklist error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, [merchant, supabase]);

  // Fire confetti when all steps complete
  useEffect(() => {
    if (steps.length === 0 || confettiFired) return;
    const allDone = steps.every(s => s.done);
    if (allDone) {
      setConfettiFired(true);
      if (merchant) {
        localStorage.setItem(`${COMPLETED_KEY}_${merchant.id}`, Date.now().toString());
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4b0082', '#7c3aed', '#a78bfa', '#ddd6fe'],
      });
    }
  }, [steps, confettiFired, merchant]);

  if (!merchant) return null;
  if (merchant.subscription_status !== 'trial') return null;
  if (dismissed || loading) return null;

  const completedCount = steps.filter(s => s.done).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const allDone = completedCount === steps.length;
  const nextStep = steps.find(s => !s.done);

  return (
    <div className="relative p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
      {/* Close button */}
      <button
        onClick={() => {
          if (merchant) {
            sessionStorage.setItem(`${DISMISSED_KEY}_${merchant.id}`, '1');
          }
          setDismissed(true);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/80 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4b0082] to-violet-500 shadow-lg shadow-[#4b0082]/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">
            {allDone ? 'Programme lancé !' : 'Lancez votre programme'}
          </h2>
          <p className="text-xs text-gray-500">
            {allDone
              ? 'Félicitations, tout est en place !'
              : `${completedCount}/${steps.length} étapes complétées`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200/60 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4b0082] to-violet-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => {
          const isNext = !step.done && step.id === nextStep?.id;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                step.done
                  ? 'bg-white/40 opacity-70'
                  : isNext
                    ? 'bg-white shadow-sm border border-[#4b0082]/10 hover:shadow-md'
                    : 'bg-white/40 hover:bg-white/60'
              }`}
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-all ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : isNext
                    ? 'bg-[#4b0082] text-white'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {step.done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <step.icon className="w-3.5 h-3.5" />
                )}
              </div>

              <span className={`flex-1 text-sm font-medium ${
                step.done ? 'text-gray-400 line-through' : 'text-gray-700'
              }`}>
                {step.label}
              </span>

              {isNext && (
                <ChevronRight className="w-4 h-4 text-[#4b0082]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
