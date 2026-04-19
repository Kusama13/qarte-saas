'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMerchant } from '@/contexts/MerchantContext';
import {
  MessageSquareText,
  Send,
  Sparkles,
  Users,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { SMS_SUGGESTIONS } from '@/lib/sms-templates';
import { SMS_UNIT_COST_CENTS } from '@/lib/sms-constants';
import {
  SMS_LIMIT_SINGLE,
  SMS_LIMIT_DOUBLE,
  SMS_LIMIT_MAX,
  countSms,
  appendStopIfMissing,
  resolveVariables,
  validateMarketingSms,
} from '@/lib/sms-validator';
import type { AudienceFilter } from '@/lib/sms-audience';
import { getPlanFeatures } from '@/lib/plan-tiers';
import PlanUpgradeCTA from '@/components/dashboard/PlanUpgradeCTA';

type CampaignRow = {
  id: string;
  body: string;
  recipient_count: number | null;
  status: string;
  review_note: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  cost_cents: number | null;
  created_at: string;
};

const AUDIENCE_OPTIONS: { value: string; label: string; filter: AudienceFilter }[] = [
  { value: 'all', label: 'Toutes mes clientes', filter: { type: 'all' } },
  { value: 'inactive30', label: 'Inactives depuis 30 jours', filter: { type: 'inactive', days: 30 } },
  { value: 'inactive60', label: 'Inactives depuis 60 jours', filter: { type: 'inactive', days: 60 } },
  { value: 'inactive90', label: 'Inactives depuis 90 jours', filter: { type: 'inactive', days: 90 } },
  { value: 'new30', label: 'Nouvelles (30 derniers jours)', filter: { type: 'new', days: 30 } },
  { value: 'vip5', label: 'VIP (5+ tampons)', filter: { type: 'vip', minStamps: 5 } },
  { value: 'birthday', label: 'Anniversaires ce mois', filter: { type: 'birthday_month' } },
  { value: 'voucher7', label: 'Récompense non utilisée (7j+)', filter: { type: 'unused_voucher', olderThanDays: 7 } },
];

function statusLabel(status: string): { label: string; color: string; Icon: typeof Clock } {
  switch (status) {
    case 'pending_review': return { label: 'En attente de validation', color: 'text-amber-700 bg-amber-50 border-amber-200', Icon: Clock };
    case 'scheduled':
    case 'approved': return { label: 'Approuvé, envoi programmé', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: CheckCircle2 };
    case 'rejected': return { label: 'Refusé', color: 'text-red-700 bg-red-50 border-red-200', Icon: XCircle };
    case 'sending': return { label: 'En cours d\'envoi', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', Icon: Loader2 };
    case 'done': return { label: 'Envoyé', color: 'text-gray-700 bg-gray-50 border-gray-200', Icon: CheckCircle2 };
    case 'failed': return { label: 'Échec', color: 'text-red-700 bg-red-50 border-red-200', Icon: XCircle };
    default: return { label: status, color: 'text-gray-700 bg-gray-50 border-gray-200', Icon: Clock };
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCostCents(cents: number | null): string {
  if (cents == null) return '—';
  return (cents / 100).toFixed(2) + ' €';
}

export default function SmsTab() {
  const t = useTranslations('marketing.smsTab');
  const { merchant } = useMerchant();

  const [body, setBody] = useState('');
  const [audienceValues, setAudienceValues] = useState<string[]>(['all']);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('10:00');

  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const selectedFilters = useMemo<AudienceFilter[]>(() => {
    if (audienceValues.length === 0 || audienceValues.includes('all')) return [{ type: 'all' }];
    return audienceValues
      .map((v) => AUDIENCE_OPTIONS.find((o) => o.value === v)?.filter)
      .filter((f): f is AudienceFilter => !!f);
  }, [audienceValues]);

  const toggleAudience = (value: string) => {
    setAudienceValues((prev) => {
      if (value === 'all') return ['all'];
      const without = prev.filter((v) => v !== 'all' && v !== value);
      return prev.includes(value) ? (without.length === 0 ? ['all'] : without) : [...without, value];
    });
  };

  const previewBody = useMemo(() => {
    const withStop = appendStopIfMissing(body || '');
    return resolveVariables(withStop, {
      prenom: 'Sophie',
      shop_name: merchant?.shop_name || 'Ma boutique',
    });
  }, [body, merchant?.shop_name]);

  const charCount = previewBody.length;
  const smsCount = countSms(previewBody);
  const validation = useMemo(() => validateMarketingSms(body || '', { requireStop: true }), [body]);

  const costEstimate = useMemo(() => {
    if (audienceCount == null) return null;
    const count = audienceCount * (smsCount === 3 ? 3 : smsCount);
    return Math.round(count * SMS_UNIT_COST_CENTS);
  }, [audienceCount, smsCount]);

  useEffect(() => {
    if (!merchant?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingCount(true);
      try {
        const res = await fetch('/api/sms/campaign/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId: merchant.id, filters: selectedFilters }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAudienceCount(data.count || 0);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoadingCount(false);
      }
    })();
    return () => { cancelled = true; };
  }, [merchant?.id, selectedFilters]);

  const fetchCampaigns = async () => {
    if (!merchant?.id) return;
    try {
      const res = await fetch(`/api/sms/campaign/list?merchantId=${merchant.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (!merchant?.id) return;
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  const applySuggestion = (suggestionBody: string) => {
    setBody(suggestionBody);
    setShowSuggestions(false);
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => (prev ? `${prev}${prev.endsWith(' ') ? '' : ' '}{${variable}}` : `{${variable}}`));
  };

  const handleSubmit = async () => {
    if (!merchant?.id || !validation.ok || submitting) return;
    setSubmitting(true);
    setSubmitResult(null);

    let scheduledAt: string | undefined;
    if (scheduleMode === 'later' && scheduleDate) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    }

    try {
      const res = await fetch('/api/sms/campaign/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          body,
          filters: selectedFilters,
          scheduledAt,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitResult({ success: true, message: t('submitSuccess') });
        setBody('');
        fetchCampaigns();
      } else {
        const errs = Array.isArray(data.errors) ? data.errors.join(' ') : data.error || t('submitError');
        setSubmitResult({ success: false, message: errs });
      }
    } catch {
      setSubmitResult({ success: false, message: t('submitError') });
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitResult(null), 6000);
    }
  };

  const charColor =
    charCount > SMS_LIMIT_DOUBLE
      ? 'text-red-600'
      : charCount > SMS_LIMIT_SINGLE
        ? 'text-amber-600'
        : 'text-emerald-600';

  const smsCountLabel =
    smsCount === 3 ? t('tooLong') : smsCount === 2 ? t('twoSms') : t('oneSms');

  if (!getPlanFeatures(merchant).marketingSms) {
    return (
      <PlanUpgradeCTA
        title={t('upgradeTitle')}
        description={t('upgradeDesc')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareText className="w-5 h-5 text-[#4b0082]" />
          <h2 className="text-base font-bold text-gray-900">{t('composerTitle')}</h2>
        </div>

        {/* Suggestions dropdown */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
              showSuggestions
                ? 'border-[#4b0082]/30 bg-[#4b0082]/[0.04]'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#4b0082] shrink-0" />
            <span className="flex-1 text-left text-xs font-semibold text-gray-700">{t('suggestions')}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>
          {showSuggestions && (
            <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
              {SMS_SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applySuggestion(s.body)}
                  className="w-full flex flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-[#4b0082]/[0.04] transition-colors"
                >
                  <span className="text-xs font-bold text-[#4b0082]">{s.label}</span>
                  <span className="text-[11px] text-gray-500 line-clamp-2">{s.body}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Textarea */}
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('messageLabel')}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('messagePlaceholder')}
          rows={4}
          maxLength={SMS_LIMIT_MAX}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#4b0082]/20 focus:border-[#4b0082] resize-none"
        />

        {/* Counter + variables */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('insert')}:</span>
            {['prenom', 'shop_name'].map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
          <div className={`text-xs font-bold ${charColor}`}>
            {charCount} / {smsCount >= 2 ? SMS_LIMIT_DOUBLE : SMS_LIMIT_SINGLE} — {smsCountLabel}
          </div>
        </div>

        {/* Preview mockup */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('previewLabel')}</span>
          </div>
          <div className="mx-auto max-w-xs rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-700">Qarte</span>
              <span className="text-[11px] text-gray-400">maintenant</span>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs text-gray-800 whitespace-pre-wrap break-words min-h-[60px]">
              {previewBody || <span className="text-gray-400">{t('previewEmpty')}</span>}
            </div>
          </div>
        </div>

        {/* Validation errors */}
        {validation.errors.length > 0 && body.trim() && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
            <ul className="text-xs text-red-700 space-y-1">
              {validation.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Audience */}
        <div className="mt-5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
            <Users className="w-3.5 h-3.5" />
            {t('audienceLabel')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AUDIENCE_OPTIONS.map((o) => {
              const active = audienceValues.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleAudience(o.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-[#4b0082] text-white border-[#4b0082]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {loadingCount ? t('audienceLoading') : t('audienceCount', { count: audienceCount ?? 0 })}
          </p>
        </div>

        {/* Schedule */}
        <div className="mt-5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t('scheduleLabel')}
          </label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setScheduleMode('now')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                scheduleMode === 'now'
                  ? 'bg-[#4b0082] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('scheduleNow')}
            </button>
            <button
              onClick={() => setScheduleMode('later')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                scheduleMode === 'later'
                  ? 'bg-[#4b0082] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('scheduleLater')}
            </button>
          </div>
          {scheduleMode === 'later' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          )}
          <p className="mt-1.5 text-xs text-gray-500">{t('scheduleHelp')}</p>
        </div>

        {/* Summary + submit */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-gray-500">{t('estimatedCost')}</span>
            <span className="font-bold text-gray-900">
              {audienceCount && costEstimate != null
                ? `${audienceCount} × ${smsCount} SMS = ${formatCostCents(costEstimate)} HT`
                : '—'}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !validation.ok || !body.trim() || audienceCount === 0 || (scheduleMode === 'later' && !scheduleDate)}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('submit')}
          </button>
          <p className="mt-2 text-[11px] text-center text-gray-500">{t('adminReviewNotice')}</p>

          {submitResult && (
            <div
              className={`mt-3 rounded-xl p-3 text-xs font-medium ${
                submitResult.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {submitResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Historique */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">{t('historyTitle')}</h3>
        {loadingCampaigns ? (
          <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
        ) : campaigns.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">{t('historyEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => {
              const status = statusLabel(c.status);
              return (
                <div key={c.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${status.color}`}>
                      <status.Icon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{c.body}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{c.recipient_count ?? 0} destinataires</span>
                    <span>•</span>
                    <span>{formatCostCents(c.cost_cents)}</span>
                    {c.scheduled_at && (
                      <>
                        <span>•</span>
                        <span>Prévu {formatDate(c.scheduled_at)}</span>
                      </>
                    )}
                  </div>
                  {c.status === 'rejected' && c.review_note && (
                    <p className="mt-1.5 text-[11px] text-red-600 italic">{c.review_note}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
