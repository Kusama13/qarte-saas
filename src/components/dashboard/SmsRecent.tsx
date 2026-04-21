'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MessageSquare, Settings2, ChevronDown } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { formatRelativeTime, cn } from '@/lib/utils';

interface SmsLogRow {
  id: string;
  sms_type: string;
  phone_to: string;
  created_at: string;
  clientName: string;
}

interface Props {
  merchantId: string;
  smsUsage?: { sent: number; remaining: number; overageCount: number } | null;
  showQuota: boolean; // false pour Fidélité (pas de quota SMS)
}

const MAX_RECENT = 5;

// Mappe sms_type → clé i18n du label friendly
const TYPE_KEY: Record<string, string> = {
  reminder_j1: 'typeReminderJ1',
  reminder_j0: 'typeReminderJ0',
  confirmation_no_deposit: 'typeBookingConfirm',
  confirmation_deposit: 'typeBookingDeposit',
  welcome: 'typeWelcome',
  review_request: 'typeReview',
  voucher_expiry: 'typeVoucherExpiry',
  referral_invite: 'typeReferralInvite',
  inactive_reminder: 'typeInactive',
  near_reward: 'typeNearReward',
  birthday: 'typeBirthday',
  campaign: 'typeCampaign',
};

export default function SmsRecent({ merchantId, smsUsage, showQuota }: Props) {
  const t = useTranslations('smsRecent');
  const locale = useLocale();
  const [logs, setLogs] = useState<SmsLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      // 1) Derniers SMS envoyés pour ce merchant
      const { data: smsData } = await supabase
        .from('sms_logs')
        .select('id, sms_type, phone_to, created_at')
        .eq('merchant_id', merchantId)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(MAX_RECENT);

      const rows = (smsData || []) as Array<Omit<SmsLogRow, 'clientName'>>;
      const phones = Array.from(new Set(rows.map((r) => r.phone_to).filter(Boolean)));

      // 2) Fetch first_name des clients de ce merchant pour ces phones
      let phoneToName = new Map<string, string>();
      if (phones.length > 0) {
        const { data: cardsData } = await supabase
          .from('loyalty_cards')
          .select('customer:customers!inner(first_name, phone_number)')
          .eq('merchant_id', merchantId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in('customer.phone_number' as any, phones);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const c of (cardsData || []) as any[]) {
          const cust = Array.isArray(c.customer) ? c.customer[0] : c.customer;
          if (cust?.phone_number && cust?.first_name) {
            phoneToName.set(cust.phone_number, cust.first_name);
          }
        }
      }

      const merged = rows.map((r) => ({
        ...r,
        clientName: phoneToName.get(r.phone_to) || t('anonymousClient'),
      }));

      if (!cancelled) {
        setLogs(merged);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [merchantId, t]);

  if (loading) return null;
  if (logs.length === 0 && !showQuota) return null;

  const isOverage = (smsUsage?.sent ?? 0) > 100;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header : button toggle + link siblings (HTML valide) */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-3 text-left active:bg-slate-50 transition-colors touch-manipulation"
        >
          <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
          <span className="text-sm font-bold text-slate-900">{t('title')}</span>
          {showQuota && smsUsage && (
            <span className={cn(
              'shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums',
              isOverage ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            )}>
              {smsUsage.sent}/100
            </span>
          )}
          <span className="flex-1" />
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', expanded && 'rotate-180')} strokeWidth={2} />
        </button>
        <Link
          href="/dashboard/marketing?tab=automations"
          className="flex items-center gap-1 px-3 py-3 text-[11px] font-semibold text-emerald-600 active:bg-slate-50 transition-colors touch-manipulation"
        >
          <Settings2 className="w-3 h-3" strokeWidth={2.25} />
          {t('configure')}
        </Link>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100">
          <p className="px-4 py-2 text-[11px] text-slate-500 leading-snug bg-slate-50/40">
            {t('hint')}
          </p>
          {logs.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => {
                const labelKey = TYPE_KEY[log.sms_type] || 'typeOther';
                return (
                  <li key={log.id} className="flex items-center gap-2.5 px-4 py-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-slate-700 shrink-0">{t(labelKey)}</span>
                    <span className="text-[12px] text-slate-500 truncate flex-1">· {log.clientName}</span>
                    <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                      {formatRelativeTime(log.created_at, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-3 text-[12px] text-slate-400 text-center">{t('empty')}</p>
          )}
        </div>
      )}
    </div>
  );
}
