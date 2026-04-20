'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Check, Sparkles, X, CalendarDays,
  Gift, ImageIcon, Share2, MapPin, Camera, QrCode,
  Users, UserPlus, Cake, Calendar, ChevronDown, ArrowRight,
  Scissors, FileText, CreditCard, MessageSquare,
  Heart, Store, EyeOff,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import { isPlanningHidden } from '@/lib/plan-tiers';
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
  sparkleColors: string[];
  steps: Step[];
  hideable?: boolean;
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
  const { merchant, updateMerchant } = useMerchant();
  const t = useTranslations('onboarding');

  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);
  const [confirmingHidePlanning, setConfirmingHidePlanning] = useState(false);
  const [hidingPlanning, setHidingPlanning] = useState(false);

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
    // Skip the (expensive) onboarding queries entirely once the merchant is paying —
    // the checklist UI is gated on `subscription_status === 'trial'` further down.
    if (merchant.subscription_status !== 'trial') {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    const planningHidden = isPlanningHidden(merchant);

    const fetchData = async () => {
      try {
        const [
          onboardingRes,
          visitsResult,
          photosResult,
          servicesResult,
          slotsResult,
          bookedResult,
          smsCampaignsResult,
        ] = await Promise.all([
          fetch('/api/onboarding/status').then(r => r.json()).catch(() => ({})),
          supabase.from('visits').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id).eq('status', 'confirmed'),
          supabase.from('merchant_photos').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
          supabase.from('merchant_services').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
          supabase.from('merchant_planning_slots').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
          supabase.from('merchant_planning_slots').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id).not('client_name', 'is', null),
          planningHidden
            ? Promise.resolve({ count: 0 })
            : supabase.from('sms_campaigns').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
        ]);

        const qrDownloaded = onboardingRes.qrDownloaded === true;
        const visitsCount = visitsResult.count || 0;
        const photosCount = photosResult.count || 0;
        const servicesCount = servicesResult.count || 0;
        const slotsCount = slotsResult.count || 0;
        const bookedCount = bookedResult.count || 0;
        const smsCampaignsCount = smsCampaignsResult.count || 0;

        const hasSocial = !!(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url);

        const baseGroups: Group[] = [
          {
            id: 'loyalty',
            name: t('groupLoyalty'),
            icon: Heart,
            sparkleColors: ['#EC4899', '#F472B6', '#FB7185', '#FFD700'],
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
            id: 'showcase',
            name: t('groupVitrine'),
            icon: Store,
            sparkleColors: ['#6366F1', '#8B5CF6', '#A78BFA', '#FFD700'],
            steps: [
              { id: 'bio', label: t('stepBio'), done: !!merchant.bio, href: '/dashboard/public-page', icon: FileText },
              { id: 'services', label: t('stepServices'), done: servicesCount >= 1, href: '/dashboard/public-page', icon: Scissors },
              { id: 'address', label: t('stepAddress'), done: !!merchant.shop_address, href: '/dashboard/public-page', icon: MapPin },
              { id: 'photos', label: t('stepPhotos'), done: photosCount >= 1, href: '/dashboard/public-page', icon: Camera },
              { id: 'social', label: t('stepSocial'), done: hasSocial, href: '/dashboard/public-page', icon: Share2 },
            ],
          },
        ];

        const planningGroup: Group = {
          id: 'planning',
          name: t('groupPlanning'),
          icon: CalendarDays,
          sparkleColors: ['#10B981', '#34D399', '#6EE7B7', '#FFD700'],
          hideable: true,
          steps: [
            { id: 'planning', label: t('stepPlanning'), done: merchant.planning_enabled === true, href: '/dashboard/planning', icon: CalendarDays },
            { id: 'booking', label: t('stepBooking'), done: merchant.auto_booking_enabled === true, href: '/dashboard/planning', icon: Calendar },
            { id: 'slots', label: t('stepSlots'), done: slotsCount >= 1, href: '/dashboard/planning', icon: Calendar },
            { id: 'first_booking', label: t('stepFirstBooking'), done: bookedCount >= 1, href: '/dashboard/planning', icon: Users },
            { id: 'sms', label: t('stepSms'), done: smsCampaignsCount >= 1, href: '/dashboard/marketing', icon: MessageSquare },
          ],
        };

        const newGroups: Group[] = planningHidden ? baseGroups : [...baseGroups, planningGroup];

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

  const handleHidePlanning = async () => {
    if (!merchant) return;
    setHidingPlanning(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('merchants')
        .update({ planning_intent: 'no' })
        .eq('id', merchant.id);
      if (!error) {
        setConfirmingHidePlanning(false);
        setExpandedGroup(prev => prev === 'planning' ? null : prev);
        updateMerchant({ planning_intent: 'no' });
      }
    } catch (err) {
      console.error('Hide planning error:', err);
    } finally {
      setHidingPlanning(false);
    }
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
    <div className="relative bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 md:px-6 md:pt-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#4b0082]/10 shrink-0">
          <Sparkles className="w-5 h-5 text-[#4b0082]" />
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
          className="h-full rounded-full bg-[#4b0082] transition-all duration-700 ease-out"
          style={{ width: `${globalProgress}%` }}
        />
      </div>

      {/* Subscribe CTA — always visible during trial */}
      <div className="mx-4 md:mx-6 mb-3">
        <Link
          href="/dashboard/subscription"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-violet-50 to-pink-50 border border-indigo-200/60 hover:shadow-lg hover:shadow-indigo-200/40 transition-all duration-200 group/cta"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shrink-0 shadow-md shadow-indigo-300/40">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-indigo-900 block">{t('stepSubscribe')}</span>
            <p className="text-[11px] text-indigo-700/70 leading-tight mt-0.5">{t('stepSubscribeHint')}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-500 group-hover/cta:translate-x-0.5 transition-transform shrink-0" />
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

          const showHideConfirm = confirmingHidePlanning && group.id === 'planning';

          return (
            <div key={group.id}>
              {showHideConfirm ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="flex-1 text-xs font-semibold text-amber-900 leading-tight">
                    {t('hidePlanningConfirm')}
                  </p>
                  <button
                    onClick={() => setConfirmingHidePlanning(false)}
                    disabled={hidingPlanning}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors border border-gray-200"
                  >
                    {t('hidePlanningCancel')}
                  </button>
                  <button
                    onClick={handleHidePlanning}
                    disabled={hidingPlanning}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    {hidingPlanning ? '…' : t('hidePlanningConfirmYes')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isComplete
                      ? 'bg-gray-50'
                      : isExpanded
                        ? 'bg-gray-50 border border-gray-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Group icon */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all ${
                    isComplete
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-[#4b0082]/10 text-[#4b0082]'
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
                      <CircularProgressRing size={24} progress={progress} color="#4b0082" />
                    </div>
                  )}

                  {/* Chevron — CSS transform pour éviter framer-motion sur un composant layout-level */}
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isComplete ? 'text-gray-300' : 'text-gray-400'}`}
                  />
                </button>
              )}

              {/* Group body (accordion) — CSS-only transition (no AnimatePresence) to avoid framer-motion unmount races on dashboard re-renders. */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
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
                                  ? 'bg-[#4b0082] text-white'
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

                      {group.hideable && (
                        <button
                          type="button"
                          onClick={() => setConfirmingHidePlanning(true)}
                          className="mt-1 ml-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-amber-600 transition-colors"
                        >
                          <EyeOff className="w-3 h-3" />
                          {t('hidePlanningLink')}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
