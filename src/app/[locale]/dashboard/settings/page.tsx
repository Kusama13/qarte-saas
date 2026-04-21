'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import {
  Store,
  Phone,
  Mail,
  Save,
  Check,
  Loader2,
  Gift,
  Copy,
  Share2,
  Download,
  Crown,
  Globe,
  ShieldAlert,
  MessageSquareOff,
  CalendarDays,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone, formatDate, PHONE_CONFIG, toBCP47 } from '@/lib/utils';
import { isPlanningHidden } from '@/lib/plan-tiers';
import { SHOP_TYPES, type ShopType, COUNTRIES } from '@/types';
import type { Merchant } from '@/types';

const shopTypeOptions = Object.entries(SHOP_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export default function SettingsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const currentLocale = useLocale();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const { saving, saved, save } = useDashboardSave();
  const [error, setError] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    shopType: '' as ShopType | '',
    phone: '',
  });
  const [userEmail, setUserEmail] = useState('');
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [shieldSaving, setShieldSaving] = useState(false);
  const [smsOptedOut, setSmsOptedOut] = useState(false);
  const [smsOptOutSaving, setSmsOptOutSaving] = useState(false);
  const [planningReEnabling, setPlanningReEnabling] = useState(false);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/merchant');
        return;
      }

      setUserEmail(user.email || '');

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setMerchant(data);
        setFormData({
          shopType: data.shop_type || '',
          phone: data.phone || '',
        });
        setShieldEnabled(data.shield_enabled !== false);
        setSmsOptedOut(data.marketing_sms_opted_out === true);
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  const handleSave = async () => {
    setError('');

    if (!merchant) return;

    const formattedPhone = formatPhoneNumber(formData.phone, merchant.country || 'FR');
    if (!validatePhone(formattedPhone, merchant.country || 'FR')) {
      setError(t('phoneError'));
      return;
    }

    save(async () => {
      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          shop_type: formData.shopType,
          phone: formattedPhone,
        })
        .eq('id', merchant.id);

      if (updateError) {
        setError(t('saveError'));
        throw updateError;
      }
    });
  };

  const toggleShield = async () => {
    if (!merchant || shieldSaving) return;
    const next = !shieldEnabled;
    setShieldSaving(true);
    const prev = shieldEnabled;
    setShieldEnabled(next);
    const { error: shieldError } = await supabase
      .from('merchants')
      .update({ shield_enabled: next })
      .eq('id', merchant.id);
    if (shieldError) setShieldEnabled(prev);
    setShieldSaving(false);
  };

  const handleReEnablePlanning = async () => {
    if (!merchant || planningReEnabling) return;
    setPlanningReEnabling(true);
    const { error: planningError } = await supabase
      .from('merchants')
      .update({ planning_intent: 'unsure' })
      .eq('id', merchant.id);
    if (!planningError) {
      setMerchant({ ...merchant, planning_intent: 'unsure' });
    }
    setPlanningReEnabling(false);
  };

  const toggleSmsOptOut = async () => {
    if (!merchant || smsOptOutSaving) return;
    const next = !smsOptedOut;
    setSmsOptOutSaving(true);
    const prev = smsOptedOut;
    setSmsOptedOut(next);
    const { error: smsError } = await supabase
      .from('merchants')
      .update({ marketing_sms_opted_out: next })
      .eq('id', merchant.id);
    if (smsError) setSmsOptedOut(prev);
    setSmsOptOutSaving(false);
  };

  const exportCSV = async () => {
    if (!merchant) return;
    setExporting(true);
    try {
      const { data: cards } = await supabase
        .from('loyalty_cards')
        .select('*, customer:customers (*)')
        .eq('merchant_id', merchant.id)
        .order('updated_at', { ascending: false });

      if (!cards) return;

      const headers = t('csvHeaders').split(',');
      const rows = cards.map((card: Record<string, unknown>) => {
        const customer = card.customer as Record<string, unknown> | null;
        return [
          (customer?.first_name as string) || '',
          (customer?.last_name as string) || '',
          (customer?.phone_number as string) || '',
          String(card.current_stamps),
          card.last_visit_date ? formatDate(card.last_visit_date as string) : '',
          formatDate(card.created_at as string),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clients-${merchant.slug}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-xs md:text-sm text-slate-500">
            {t('subtitle')}
          </p>
        </div>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={saved}
          className={`px-4 md:px-6 h-10 md:h-12 rounded-xl transition-all duration-300 text-sm ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              {t('saved')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              {t('save')}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 mb-8 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {/* Parrainage - en haut */}
      {merchant?.referral_code && (
        <div className="mb-6 md:mb-8 p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Gift className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" strokeWidth={2.25} />
            </div>
            <h2 className="text-base md:text-xl font-bold text-gray-900">
              {t('referralTitle')}
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t.rich('referralDesc', { b: (chunks) => <strong className="font-semibold text-gray-800">{chunks}</strong> })}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-white/80 border border-emerald-100 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('referralCodeLabel')}</p>
              <p className="text-lg font-mono font-bold text-[#4b0082] truncate">{merchant.referral_code}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(merchant.referral_code);
                  setReferralCopied(true);
                  setTimeout(() => setReferralCopied(false), 2000);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-[#4b0082]/10 text-[#4b0082] hover:bg-[#4b0082]/20 active:scale-[0.98] touch-manipulation transition-all"
              >
                {referralCopied ? (
                  <><Check className="w-4 h-4" /> {t('referralCopied')}</>
                ) : (
                  <><Copy className="w-4 h-4" /> {t('referralCopy')}</>
                )}
              </button>
              <button
                onClick={() => {
                  const text = t('referralShareText', { code: merchant.referral_code });
                  if (navigator.share) {
                    navigator.share({ text }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(text);
                    setReferralCopied(true);
                    setTimeout(() => setReferralCopied(false), 2000);
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] touch-manipulation transition-all"
              >
                <Share2 className="w-4 h-4" />
                {t('referralShare')}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {t('referralFooter')}
          </p>
        </div>
      )}

      <div className="mb-6 md:mb-8 p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${shieldEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                {t('shieldTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                {t('shieldDesc')}
              </p>
              <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${shieldEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                {shieldEnabled ? t('shieldOn') : t('shieldOff')}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={shieldEnabled}
            onClick={toggleShield}
            disabled={shieldSaving}
            className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shieldEnabled ? 'bg-indigo-600' : 'bg-gray-300'} ${shieldSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shieldEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="mb-6 md:mb-8 p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${!smsOptedOut ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <MessageSquareOff className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                {t('marketingSmsTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                {t('marketingSmsDesc')}
              </p>
              <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${!smsOptedOut ? 'text-emerald-600' : 'text-gray-400'}`}>
                {!smsOptedOut ? t('marketingSmsOn') : t('marketingSmsOff')}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!smsOptedOut}
            onClick={toggleSmsOptOut}
            disabled={smsOptOutSaving}
            className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!smsOptedOut ? 'bg-indigo-600' : 'bg-gray-300'} ${smsOptOutSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!smsOptedOut ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {isPlanningHidden(merchant) && (
        <div className="mb-6 md:mb-8 p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 md:p-2.5 rounded-xl bg-gray-100 text-gray-400 shrink-0">
                <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-xl font-bold text-gray-900">
                  {t('planningHiddenTitle')}
                </h2>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {t('planningHiddenDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReEnablePlanning}
              disabled={planningReEnabling}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors ${planningReEnabling ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {planningReEnabling ? '…' : t('planningReEnableCta')}
            </button>
          </div>
        </div>
      )}

      <div className="p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Store className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" strokeWidth={2.25} />
          </div>
          <h2 className="text-base md:text-xl font-bold text-gray-900">
            {t('businessInfoTitle')}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <Input
              label={t('emailLabel')}
              type="email"
              value={userEmail}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            />
            <Mail className="absolute w-4 h-4 text-gray-400 right-4 top-[42px]" />
            <p className="mt-1.5 text-xs text-gray-400">
              {t('emailReadonly')}
            </p>
          </div>

          <Select
            label={t('shopTypeLabel')}
            placeholder={t('shopTypePlaceholder')}
            options={shopTypeOptions}
            value={formData.shopType}
            onChange={(e) =>
              setFormData({ ...formData, shopType: e.target.value as ShopType })
            }
            required
            className="bg-white/50 border-gray-200"
          />

          <div className="relative group">
            <Input
              label={t('phoneLabel')}
              type="tel"
              placeholder={PHONE_CONFIG[merchant?.country || 'FR'].placeholder}
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              className="bg-white/50 border-gray-200 pl-4"
            />
            <Phone className="absolute w-4 h-4 text-gray-400 right-4 top-[42px] group-focus-within:text-indigo-500 transition-colors" />
          </div>

        </div>
      </div>

      <div className="mt-6 md:mt-8 p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="mb-5 md:mb-8 text-base md:text-xl font-bold text-gray-900">
          {t('accountTitle')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/50 border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('countryLabel')}</p>
            <p className="text-sm text-gray-700 font-medium">{COUNTRIES[merchant?.country || 'FR']}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/50 border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('createdAtLabel')}</p>
            <p className="text-sm text-gray-700 font-medium">
              {new Date(merchant?.created_at || '').toLocaleDateString(toBCP47(currentLocale), {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/50 border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t('languageLabel')}
            </p>
            <div className="flex gap-2 mt-2">
              {[
                { code: 'fr', label: 'Français' },
                { code: 'en', label: 'English' },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={async () => {
                    if (code === currentLocale) return;
                    if (merchant) {
                      const { error } = await supabase.from('merchants').update({ locale: code }).eq('id', merchant.id);
                      if (error) { console.error('Locale update error:', error); return; }
                    }
                    router.replace('/dashboard/settings', { locale: code as 'fr' | 'en' });
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    code === currentLocale
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling') && (
            <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <Crown className="w-4 h-4 text-indigo-600" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('subscriptionLabel')}</p>
                  <p className="text-sm font-bold text-gray-900">
                    {merchant?.billing_interval === 'annual' ? t('proAnnual') : t('proMonthly')}
                    {merchant?.subscription_status === 'canceling' && (
                      <span className="ml-2 text-[11px] font-semibold text-orange-500">· {t('canceling')}</span>
                    )}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/subscription"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
              >
                {t('manageSubscription')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 md:mt-8 p-5 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="mb-2 text-base md:text-xl font-bold text-gray-900">
          {t('dataTitle')}
        </h2>
        <p className="mb-4 text-sm text-gray-600 leading-relaxed">
          {t('dataDesc')}
        </p>
        <Button
          variant="outline"
          onClick={exportCSV}
          loading={exporting}
          className="h-9 px-4 text-sm border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-700 rounded-xl transition-all duration-200 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
          {t('exportCsv')}
        </Button>
      </div>

      <div className="mt-6 md:mt-8 p-5 md:p-8 bg-red-50 rounded-2xl border border-red-100">
        <h2 className="mb-2 text-base md:text-xl font-bold text-red-900">
          {t('dangerTitle')}
        </h2>
        <p className="mb-6 text-sm text-red-700 leading-relaxed">
          {t('dangerDesc')}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm active:scale-[0.98] touch-manipulation transition-all"
        >
          {t('deleteAccount')}
        </Link>
      </div>
    </div>
  );
}
