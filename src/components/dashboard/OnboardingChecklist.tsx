'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Check, Sparkles, X, Heart, Globe, CalendarDays,
  Gift, ImageIcon, Share2, MapPin, Camera, QrCode,
  Users, UserPlus, Cake, Calendar, ChevronDown, ArrowRight,
  Scissors, FileText, CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import { sparkleGrand, sparkleMedium, sparkleSubtle } from '@/lib/sparkles';


interface Step {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
  href: string;
  icon: React.ElementType;
}

interface Group {
  id: string;
  name: string;
  icon: React.ElementType;
  gradient: string;
  sparkleColors: string[];
  steps: Step[];
}


const DISMISSED_KEY = 'qarte_checklist_dismissed';
const COMPLETED_KEY = 'qarte_checklist_completed_at';


function CircularProgressRing({ size = 24, progress, color }: { size?: number; progress: number; color: string }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}


export default function OnboardingChecklist() {
  const { merchant } = useMerchant();
  const t = useTranslations('onboarding');

  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);

  const prevCompletedRef = useRef<Set<string>>(new Set());
  const celebratedRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);


  useEffect(() => {
    if (!merchant) return;

    const isDismissed = sessionStorage.getItem(`${DISMISSED_KEY}_${merchant.id}`);
    if (isDismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const completedAt = localStorage.getItem(`${COMPLETED_KEY}_${merchant.id}`);
    if (completedAt) {
      const daysSince = (Date.now() - parseInt(completedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince > 3) {
        setDismissed(true);
        setLoading(false);
      }
    }
  }, [merchant]);


  useEffect(() => {
    if (!merchant) return;
    if (dismissed) return;

    const supabase = getSupabase();

    const fetchData = async () => {
      try {
        const [
          onboardingRes,
          visitsResult,
          photosResult,
          servicesResult,
          slotsResult,
          bookedResult,
        ] = await Promise.all([
          fetch('/api/onboarding/status').then(r => r.json()).catch(() => ({})),
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .eq('status', 'confirmed'),
          supabase
            .from('merchant_photos')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id),
          supabase
            .from('merchant_services')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id),
          supabase
            .from('merchant_planning_slots')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id),
          supabase
            .from('merchant_planning_slots')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .not('client_name', 'is', null),
        ]);

        const qrDownloaded = onboardingRes.qrDownloaded === true;
        const visitsCount = visitsResult.count || 0;
        const photosCount = photosResult.count || 0;
        const servicesCount = servicesResult.count || 0;
        const slotsCount = slotsResult.count || 0;
        const bookedCount = bookedResult.count || 0;

        const hasSocial = !!(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url);

        const newGroups: Group[] = [
          {
            id: 'loyalty',
            name: t('groupLoyalty'),
            icon: Heart,
            gradient: 'from-violet-500 to-purple-600',
            sparkleColors: ['#7C3AED', '#A78BFA', '#DDD6FE', '#FFD700'],
            steps: [
              { id: 'program', label: t('stepProgram'), done: !!merchant.reward_description, href: '/dashboard/program', icon: Gift },
              { id: 'logo', label: t('stepLogo'), done: !!merchant.logo_url, href: '/dashboard/personalize', icon: ImageIcon },
              { id: 'qr', label: t('stepQr'), done: qrDownloaded, href: '/dashboard/qr-download', icon: QrCode },
              { id: 'referral', label: t('stepReferral'), done: merchant.referral_program_enabled === true, href: '/dashboard/referrals', icon: UserPlus },
              { id: 'birthday', label: t('stepBirthday'), done: merchant.birthday_gift_enabled === true, href: '/dashboard/program', icon: Cake },
              { id: 'first_client', label: t('stepFirstClient'), done: visitsCount >= 1, href: '/dashboard/qr-download', icon: Users },
            ],
          },
          {
            id: 'vitrine',
            name: t('groupVitrine'),
            icon: Globe,
            gradient: 'from-indigo-500 to-blue-600',
            sparkleColors: ['#6366F1', '#818CF8', '#C7D2FE', '#FFD700'],
            steps: [
              { id: 'bio', label: t('stepBio'), done: !!merchant.bio, href: '/dashboard/public-page', icon: FileText },
              { id: 'address', label: t('stepAddress'), done: !!merchant.shop_address, href: '/dashboard/public-page', icon: MapPin },
              { id: 'photos', label: t('stepPhotos'), done: photosCount >= 1, href: '/dashboard/public-page', icon: Camera },
              { id: 'services', label: t('stepServices'), done: servicesCount >= 1, href: '/dashboard/public-page', icon: Scissors },
              { id: 'social', label: t('stepSocial'), done: hasSocial, href: '/dashboard/public-page', icon: Share2 },
            ],
          },
          {
            id: 'planning',
            name: t('groupPlanning'),
            icon: CalendarDays,
            gradient: 'from-cyan-500 to-teal-600',
            sparkleColors: ['#06B6D4', '#22D3EE', '#CFFAFE', '#FFD700'],
            steps: [
              { id: 'planning', label: t('stepPlanning'), done: merchant.planning_enabled === true, href: '/dashboard/planning', icon: CalendarDays },
              { id: 'slots', label: t('stepSlots'), done: slotsCount >= 1, href: '/dashboard/planning', icon: Calendar },
              { id: 'booking', label: t('stepBooking'), done: merchant.auto_booking_enabled === true, href: '/dashboard/planning', icon: Calendar },
              { id: 'first_booking', label: t('stepFirstBooking'), done: bookedCount >= 1, href: '/dashboard/planning', icon: Users },
            ],
          },
        ];

        setGroups(newGroups);

        // Initialize on first load only
        if (initialLoadRef.current) {
          const firstIncomplete = newGroups.find(g => g.steps.some(s => !s.done));
          setExpandedGroup(firstIncomplete?.id ?? null);

          const completed = new Set<string>();
          for (const g of newGroups) {
            for (const s of g.steps) {
              if (s.done) completed.add(s.id);
            }
            if (g.steps.every(s => s.done)) completed.add(`group_${g.id}`);
          }
          if (newGroups.every(g => g.steps.every(s => s.done))) completed.add('all_done');
          prevCompletedRef.current = completed;
          initialLoadRef.current = false;
        }
      } catch (err) {
        console.error('Onboarding checklist error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchant, dismissed, t]);


  useEffect(() => {
    if (groups.length === 0 || initialLoadRef.current || !merchant) return;

    const prev = prevCompletedRef.current;
    const celebrated = celebratedRef.current;

    // Check individual steps
    for (const group of groups) {
      for (const step of group.steps) {
        if (step.done && !prev.has(step.id) && !celebrated.has(step.id)) {
          celebrated.add(step.id);
          sparkleSubtle(group.sparkleColors);
        }
      }

      // Check group completion
      const groupKey = `group_${group.id}`;
      const groupComplete = group.steps.every(s => s.done);
      if (groupComplete && !prev.has(groupKey) && !celebrated.has(groupKey)) {
        celebrated.add(groupKey);
        sparkleMedium(group.sparkleColors);
      }
    }

    // Check all done
    const allDone = groups.every(g => g.steps.every(s => s.done));
    if (allDone && !prev.has('all_done') && !celebrated.has('all_done')) {
      celebrated.add('all_done');
      sparkleGrand(['#4b0082', '#7C3AED', '#06B6D4', '#FFD700']);
      localStorage.setItem(`${COMPLETED_KEY}_${merchant.id}`, Date.now().toString());
    }

    // Update prev
    const newPrev = new Set<string>();
    for (const g of groups) {
      for (const s of g.steps) if (s.done) newPrev.add(s.id);
      if (g.steps.every(s => s.done)) newPrev.add(`group_${g.id}`);
    }
    if (allDone) newPrev.add('all_done');
    prevCompletedRef.current = newPrev;
  }, [groups, merchant]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prev => prev === groupId ? null : groupId);
  };


  if (!merchant) return null;
  if (merchant.subscription_status !== 'trial') return null;
  if (dismissed || loading) return null;


  const allSteps = groups.flatMap(g => g.steps);
  const completedCount = allSteps.filter(s => s.done).length;
  const totalCount = allSteps.length;
  const globalProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount && totalCount > 0;


  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white/70 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/50 shadow-sm overflow-hidden"
    >
      {/* Gradient stripe */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 md:px-6 md:pt-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4b0082] to-violet-500 shadow-lg shadow-[#4b0082]/20 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {confirmingDismiss && !allDone ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <p className="flex-1 text-xs font-semibold text-gray-700 leading-tight">
              {t('dismissConfirm', { count: totalCount - completedCount })}
            </p>
            <button
              onClick={() => {
                if (merchant) sessionStorage.setItem(`${DISMISSED_KEY}_${merchant.id}`, '1');
                setDismissed(true);
              }}
              className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              {t('dismissYes')}
            </button>
            <button
              onClick={() => setConfirmingDismiss(false)}
              className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {t('dismissNo')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm md:text-base font-bold text-gray-900">
                {allDone ? t('allDoneTitle') : t('launchTitle')}
              </h2>
              <p className="text-xs text-gray-500">
                {allDone ? t('allDoneDesc') : `${completedCount}/${totalCount} ${t('completed')}`}
              </p>
            </div>
            <button
              onClick={() => {
                if (allDone) {
                  if (merchant) sessionStorage.setItem(`${DISMISSED_KEY}_${merchant.id}`, '1');
                  setDismissed(true);
                } else {
                  setConfirmingDismiss(true);
                }
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Global progress bar */}
      <div className="mx-4 md:mx-6 mt-3 mb-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all duration-700 ease-out"
          style={{ width: `${globalProgress}%` }}
        />
      </div>

      {/* Subscribe CTA — always visible during trial */}
      <div className="mx-4 md:mx-6 mb-3">
        <Link
          href="/dashboard/subscription"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 hover:shadow-md transition-all duration-200 group/cta"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0 shadow-sm">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-amber-900 block">{t('stepSubscribe')}</span>
            <p className="text-[11px] text-amber-600/80 leading-tight mt-0.5">{t('stepSubscribeHint')}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover/cta:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>

      {/* Groups accordion */}
      <div className="px-4 pb-4 md:px-6 md:pb-6 pt-2 space-y-2">
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.id;
          const trackableSteps = group.steps;
          const doneCount = trackableSteps.filter(s => s.done).length;
          const isComplete = doneCount === trackableSteps.length;
          const nextStep = trackableSteps.find(s => !s.done);
          const progress = trackableSteps.length > 0 ? doneCount / trackableSteps.length : 0;

          // Color map for progress ring
          const ringColor = group.id === 'loyalty' ? '#7C3AED' : group.id === 'vitrine' ? '#6366F1' : '#06B6D4';

          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  isComplete
                    ? 'bg-gray-50/80'
                    : isExpanded
                      ? 'bg-gray-50/80 border border-gray-200/50'
                      : 'bg-gray-50/60 hover:bg-gray-100/60'
                }`}
              >
                {/* Group icon */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all ${
                  isComplete
                    ? 'bg-emerald-100 text-emerald-600'
                    : `bg-gradient-to-br ${group.gradient} text-white shadow-sm`
                }`}>
                  {isComplete ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <group.icon className="w-4 h-4" />
                  )}
                </div>

                {/* Group name */}
                <span className={`flex-1 text-left text-sm font-semibold truncate ${
                  isComplete ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {group.name}
                </span>

                {/* Progress ring + fraction */}
                {isComplete ? (
                  <span className="text-xs font-bold text-emerald-500 shrink-0">{doneCount}/{trackableSteps.length}</span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-gray-500 tabular-nums">{doneCount}/{trackableSteps.length}</span>
                    <CircularProgressRing size={24} progress={progress} color={ringColor} />
                  </div>
                )}

                {/* Chevron */}
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className={`w-4 h-4 shrink-0 ${isComplete ? 'text-gray-300' : 'text-gray-400'}`} />
                </motion.div>
              </button>

              {/* Group body (accordion) */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 pb-1 pl-11 pr-3 space-y-0.5">
                      {group.steps.map((step) => {
                        const isNext = !step.done && step.id === nextStep?.id;

                        return (
                          <Link
                            key={step.id}
                            href={step.href}
                            className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg transition-all duration-200 group/step ${
                              step.done
                                ? 'opacity-60'
                                : isNext
                                  ? 'bg-white shadow-sm border border-gray-100 hover:shadow-md'
                                  : 'hover:bg-white/60'
                            }`}
                          >
                            {/* Step indicator */}
                            <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-all ${
                              step.done
                                ? 'bg-emerald-500 text-white'
                                : isNext
                                  ? `bg-gradient-to-br ${group.gradient} text-white`
                                  : 'border-2 border-gray-200'
                            }`}>
                              {step.done ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : isNext ? (
                                <step.icon className="w-2.5 h-2.5" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              )}
                            </div>

                            {/* Label */}
                            <span className={`flex-1 text-xs font-medium leading-tight ${
                              step.done ? 'text-gray-400 line-through' : 'text-gray-700'
                            }`}>
                              {step.label}
                            </span>

                            {/* Arrow for next step */}
                            {isNext && (
                              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover/step:translate-x-0.5 transition-transform shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
