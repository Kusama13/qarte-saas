'use client';

import { useState } from 'react';
import { CreditCard, Moon, Bell, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Switch, ChipGroup, Callout } from '@/components/ui';
import { DepositLinkInput } from './DepositLinkInput';
import { getCurrencySymbol } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

interface DepositCardProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  link: string;
  onLinkChange: (next: string) => void;
  link2: string;
  onLink2Change: (next: string) => void;
  percent: string;
  onPercentChange: (next: string) => void;
  amount: string;
  onAmountChange: (next: string) => void;
  onlyForNew: boolean;
  onOnlyForNewChange: (next: boolean) => void;
  deadlineHours: string;
  onDeadlineHoursChange: (next: string) => void;
  country?: MerchantCountry;
}

export function DepositCard({
  enabled,
  onEnabledChange,
  link,
  onLinkChange,
  link2,
  onLink2Change,
  percent,
  onPercentChange,
  amount,
  onAmountChange,
  onlyForNew,
  onOnlyForNewChange,
  deadlineHours,
  onDeadlineHoursChange,
  country,
}: DepositCardProps) {
  const t = useTranslations('planning');
  const [validationOpen, setValidationOpen] = useState(false);

  const hasAmount = !!(percent || amount);
  const hasLink = !!link.trim();
  const linkMissing = enabled && hasAmount && !hasLink;
  const amountMissing = enabled && hasLink && !hasAmount;

  const currencyChips = ['10', '15', '20', '25', '30'].map(v => ({
    value: v,
    label: `${v}${getCurrencySymbol(country)}`,
  }));
  const percentChips = ['10', '15', '20', '25', '30'].map(v => ({ value: v, label: `${v}%` }));
  const deadlineChips = [
    { value: '', label: t('depositDeadlineFree') },
    ...['1', '2', '3', '4'].map(v => ({ value: v, label: `${v}h` })),
  ];

  const handlePercentChange = (next: string) => {
    onPercentChange(next);
    if (next) onAmountChange('');
  };
  const handleAmountChange = (next: string) => {
    onAmountChange(next);
    if (next) onPercentChange('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sm:col-span-2">
      <div className="px-4 sm:px-5 py-3 bg-amber-50/50 border-b border-amber-100/50 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
        <h2 className="text-sm font-bold text-gray-800">{t('depositTitle')}</h2>
        <div className="ml-auto">
          <Switch checked={enabled} onChange={onEnabledChange} tone="amber" size="sm" />
        </div>
      </div>

      {enabled && (
        <div className="p-4 sm:p-5 space-y-5">
          <Section number="1" title={t('depositLinkLabel')}>
            <DepositLinkInput
              value={link}
              onChange={onLinkChange}
              placeholder={t('depositLinkPlaceholder')}
              error={linkMissing}
            />
            {linkMissing && <p className="text-[10px] text-red-500 mt-1.5">{t('depositLinkRequired')}</p>}
            <div className="mt-2">
              <DepositLinkInput
                value={link2}
                onChange={onLink2Change}
                placeholder={t('depositLink2Placeholder')}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">{t('depositLink2Hint')}</p>
            <p className="text-[11px] text-gray-500 mt-2">
              {t('depositLinkAffiliate')}{' '}
              <a
                href="https://revolut.com/referral/?referral-code=judicasay3!APR1-26-VR-FR&geo-redirect"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-semibold hover:underline"
              >
                {t('depositLinkAffiliateJoin')}
              </a>
            </p>
          </Section>

          <Section number="2" title={t('depositAmountLabel')}>
            <div className={`transition-opacity ${amount ? 'opacity-40' : ''}`}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('percentageLabel')}
              </p>
              <ChipGroup
                options={percentChips}
                value={percent}
                onChange={handlePercentChange}
                custom={{ placeholder: t('customPercent'), min: 1, max: 100 }}
                error={amountMissing}
                className="mb-3"
              />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase">{t('or')}</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>
            <div className={`transition-opacity ${percent ? 'opacity-40' : ''}`}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('fixedAmountLabel')}
              </p>
              <ChipGroup
                options={currencyChips}
                value={amount}
                onChange={handleAmountChange}
                custom={{ placeholder: t('customAmount'), min: 1 }}
                error={amountMissing}
              />
            </div>
            {amountMissing && <p className="text-[10px] text-red-500 mt-1.5">{t('depositAmountRequired')}</p>}
          </Section>

          <Section number="3" title={t('depositForWhomLabel')}>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onOnlyForNewChange(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  !onlyForNew
                    ? 'bg-slate-900 text-white border border-slate-900'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <p>{t('depositForWhomEveryone')}</p>
                <p className={`text-[10px] font-medium mt-0.5 ${!onlyForNew ? 'text-white/70' : 'text-gray-500'}`}>
                  {t('depositForWhomEveryoneHint')}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onOnlyForNewChange(true)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  onlyForNew
                    ? 'bg-slate-900 text-white border border-slate-900'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <p>{t('depositForWhomNew')}</p>
                <p className={`text-[10px] font-medium mt-0.5 ${onlyForNew ? 'text-white/70' : 'text-gray-500'}`}>
                  {t('depositForWhomNewHint')}
                </p>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-2">
              {t('depositMembersHintBody')}{' '}
              <Link href="/dashboard/members" className="font-semibold text-gray-700 underline underline-offset-2 hover:text-gray-900">
                {t('depositMembersHintCta')}
              </Link>
            </p>
          </Section>

          <Section number="4" title={t('depositDeadlineLabel')}>
            <ChipGroup
              options={deadlineChips}
              value={deadlineHours}
              onChange={onDeadlineHoursChange}
              custom={{ placeholder: t('customHours'), min: 1 }}
            />
            <p className="text-[11px] text-gray-500 mt-1.5">
              {deadlineHours ? t('depositDeadlineHint') : t('depositDeadlineFreeHint')}
            </p>
            {deadlineHours && (
              <Callout variant="info" icon={Moon} className="mt-2">
                {t('depositNightGraceHint')}
              </Callout>
            )}
            <button
              type="button"
              onClick={() => setValidationOpen(o => !o)}
              className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
              aria-expanded={validationOpen}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                {t('depositValidationToggleLabel')}
              </span>
              {validationOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            {validationOpen && (
              <div className="mt-2 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 space-y-2">
                <p className="text-[11px] text-indigo-900 leading-relaxed">{t('depositValidationBody')}</p>
                <div className="pt-2 border-t border-indigo-100/80 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-600 leading-relaxed">{t('depositEmailSpamWarning')}</p>
                </div>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tabular-nums">
          {number}
        </span>
        <label className="text-xs font-semibold text-gray-700">{title}</label>
      </div>
      {children}
    </div>
  );
}

