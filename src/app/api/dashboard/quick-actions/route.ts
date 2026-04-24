import { NextRequest, NextResponse } from 'next/server';
import { authorizeMerchant } from '@/lib/api-helpers';
import { getTodayForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

export type QuickActionId =
  | 'mark_attendance'
  | 'new_customer_today'
  | 'empty_tomorrow'
  | 'birthday_week'
  | 'near_reward'
  | 'reward_vip'
  | 'inactive_customers'
  | 'suggest_deposit'
  | 'sms_campaign'
  | 'referral_boost';

export type QuickActionIcon =
  | 'calendar'
  | 'crown'
  | 'sparkles'
  | 'userPlus'
  | 'share'
  | 'cake'
  | 'target'
  | 'userX'
  | 'shield'
  | 'gift';

export type QuickActionAccent = 'indigo' | 'amber' | 'rose' | 'emerald' | 'violet';

export interface QuickActionSlot {
  id: string;
  slot_date: string;
  start_time: string;
  client_name: string | null;
}

export interface QuickAction {
  id: QuickActionId;
  title: string;
  subtitle?: string;
  href?: string;
  icon: QuickActionIcon;
  accent: QuickActionAccent;
  meta?: { slots?: QuickActionSlot[] };
}

const ATTENDANCE_MIN_UNMARKED = 2;
const VIP_REWARDS_THRESHOLD = 2;
const SMS_MIN_CUSTOMERS = 50;
const SMS_DAYS_SINCE_LAST = 30;
const INACTIVE_DAYS = 60;
const INACTIVE_MIN_CUSTOMERS = 3;
const NO_SHOW_RATE_THRESHOLD = 0.15;
const NO_SHOW_MIN_MARKED = 10;
const NO_SHOW_WINDOW_DAYS = 30;
const REFERRAL_WINDOW_DAYS = 30;
const BIRTHDAY_FETCH_LIMIT = 200;

const PRIORITY: QuickActionId[] = [
  'mark_attendance',
  'new_customer_today',
  'empty_tomorrow',
  'birthday_week',
  'near_reward',
  'reward_vip',
  'inactive_customers',
  'suggest_deposit',
  'sms_campaign',
  'referral_boost',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function firstName(full: string | null | undefined): string {
  return (full || '').trim().split(' ')[0] || '';
}

function plural(n: number, singular: string): string {
  return n > 1 ? `${singular}s` : singular;
}

type CustomerEmbed = { first_name: string | null } | { first_name: string | null }[] | null;
function embeddedFirstName(embed: CustomerEmbed): string {
  const record = Array.isArray(embed) ? embed[0] : embed;
  return firstName(record?.first_name);
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = new URL(request.url).searchParams.get('merchantId');
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    const auth = await authorizeMerchant(merchantId);
    if (auth.response) return auth.response;
    const { supabaseAdmin } = auth;

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select(
        'country, loyalty_mode, stamps_required, planning_enabled, deposit_link, deposit_percent, deposit_amount, referral_program_enabled',
      )
      .eq('id', merchantId)
      .maybeSingle();

    const today = getTodayForCountry(merchant?.country);
    const tomorrow = addDaysIso(today, 1);
    const inactiveCutoff = addDaysIso(today, -INACTIVE_DAYS);
    const noShowCutoff = addDaysIso(today, -NO_SHOW_WINDOW_DAYS);
    const stampsRequired = Number(merchant?.stamps_required ?? 10);
    const loyaltyMode = merchant?.loyalty_mode as string | undefined;
    const depositActive = !!(
      merchant?.deposit_link || merchant?.deposit_percent || merchant?.deposit_amount
    );
    const referralEnabled = !!merchant?.referral_program_enabled;
    const planningEnabled = !!merchant?.planning_enabled;

    // Liste des (month, day) pour les 7 prochains jours (today inclus)
    const birthdayPairs: Array<{ month: number; day: number }> = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDaysIso(today, i);
      const [, m, d] = iso.split('-').map((n) => parseInt(n, 10));
      birthdayPairs.push({ month: m, day: d });
    }
    const birthdayMonths = Array.from(new Set(birthdayPairs.map((p) => p.month)));

    const emptyData = Promise.resolve({ data: [] as never[] });
    const emptyCount = Promise.resolve({ count: null as number | null });

    const [
      unmarkedRes,
      vipRes,
      campaignCountRes,
      lastCampaignRes,
      nearRewardRes,
      inactiveCountRes,
      birthdayRes,
      attendedCountRes,
      noShowCountRes,
      tomorrowBookedRes,
      referralCountRes,
      newCardsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('merchant_planning_slots')
        .select('id, slot_date, start_time, client_name')
        .eq('merchant_id', merchantId)
        .is('attendance_status', null)
        .lt('slot_date', today)
        .not('client_name', 'is', null)
        .neq('client_name', '__blocked__')
        .order('slot_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(20),

      supabaseAdmin
        .from('loyalty_cards')
        .select('rewards_earned, customers!inner(first_name)')
        .eq('merchant_id', merchantId)
        .gte('rewards_earned', VIP_REWARDS_THRESHOLD)
        .order('rewards_earned', { ascending: false })
        .limit(1),

      supabaseAdmin
        .from('loyalty_cards')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId),

      supabaseAdmin
        .from('sms_campaigns')
        .select('sent_at')
        .eq('merchant_id', merchantId)
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(1),

      loyaltyMode === 'visit' && stampsRequired > 1
        ? supabaseAdmin
            .from('loyalty_cards')
            .select('id, customers!inner(first_name)')
            .eq('merchant_id', merchantId)
            .eq('current_stamps', stampsRequired - 1)
            .limit(10)
        : emptyData,

      supabaseAdmin
        .from('loyalty_cards')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .not('last_visit_date', 'is', null)
        .lt('last_visit_date', inactiveCutoff),

      birthdayMonths.length > 0
        ? supabaseAdmin
            .from('customers')
            .select('first_name, birth_month, birth_day')
            .eq('merchant_id', merchantId)
            .in('birth_month', birthdayMonths)
            .not('birth_day', 'is', null)
            .limit(BIRTHDAY_FETCH_LIMIT)
        : emptyData,

      planningEnabled
        ? supabaseAdmin
            .from('merchant_planning_slots')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .gte('slot_date', noShowCutoff)
            .lt('slot_date', today)
            .eq('attendance_status', 'attended')
        : emptyCount,

      planningEnabled
        ? supabaseAdmin
            .from('merchant_planning_slots')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .gte('slot_date', noShowCutoff)
            .lt('slot_date', today)
            .eq('attendance_status', 'no_show')
        : emptyCount,

      planningEnabled
        ? supabaseAdmin
            .from('merchant_planning_slots')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .eq('slot_date', tomorrow)
            .not('client_name', 'is', null)
            .neq('client_name', '__blocked__')
        : emptyCount,

      referralEnabled
        ? supabaseAdmin
            .from('referrals')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .eq('status', 'completed')
            .gte(
              'created_at',
              new Date(Date.now() - REFERRAL_WINDOW_DAYS * 86_400_000).toISOString(),
            )
        : emptyCount,

      supabaseAdmin
        .from('loyalty_cards')
        .select('id, customers!inner(first_name)')
        .eq('merchant_id', merchantId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${tomorrow}T00:00:00`)
        .limit(10),
    ]);

    const actions: QuickAction[] = [];

    const unmarked = (unmarkedRes.data ?? []) as QuickActionSlot[];
    if (unmarked.length >= ATTENDANCE_MIN_UNMARKED) {
      const firstNames = unmarked
        .slice(0, 3)
        .map((s) => firstName(s.client_name))
        .filter(Boolean)
        .join(' · ');
      actions.push({
        id: 'mark_attendance',
        title: `Marque la présence de tes ${unmarked.length} RDV récents`,
        subtitle: firstNames || undefined,
        icon: 'calendar',
        accent: 'indigo',
        meta: { slots: unmarked },
      });
    }

    const newCards = (newCardsRes.data ?? []) as Array<{ customers: CustomerEmbed }>;
    if (newCards.length > 0) {
      const names = newCards.map((c) => embeddedFirstName(c.customers)).filter(Boolean);
      const first = names[0] || 'Une nouvelle cliente';
      const extra = names.length - 1;
      actions.push({
        id: 'new_customer_today',
        title:
          extra > 0
            ? `${first} et ${extra} ${plural(extra, 'autre')} viennent pour la 1ère fois aujourd'hui`
            : `${first} vient pour la 1ère fois aujourd'hui`,
        subtitle: 'Note ce qu’elle aime pour la fidéliser',
        href: '/dashboard/customers',
        icon: 'userPlus',
        accent: 'emerald',
      });
    }

    if (planningEnabled && tomorrowBookedRes.count === 0) {
      actions.push({
        id: 'empty_tomorrow',
        title: 'Ton agenda a de la place demain',
        subtitle: 'Partage ton lien résa, que tes clientes l’aient en tête',
        href: '/dashboard/public-page',
        icon: 'share',
        accent: 'violet',
      });
    }

    const birthdayAll = (birthdayRes.data ?? []) as Array<{
      first_name: string | null;
      birth_month: number;
      birth_day: number;
    }>;
    const weekSet = new Set(birthdayPairs.map((p) => `${p.month}-${p.day}`));
    const birthdaysThisWeek = birthdayAll.filter((c) =>
      weekSet.has(`${c.birth_month}-${c.birth_day}`),
    );
    if (birthdaysThisWeek.length > 0) {
      const first = firstName(birthdaysThisWeek[0].first_name) || 'Une cliente';
      const extra = birthdaysThisWeek.length - 1;
      actions.push({
        id: 'birthday_week',
        title:
          extra > 0
            ? `${first} et ${extra} ${plural(extra, 'autre')} ${plural(extra, 'cliente')} fêtent leur anniv cette semaine`
            : `${first} a son anniv cette semaine`,
        subtitle: 'Un petit message lui fera plaisir',
        href: '/dashboard/customers',
        icon: 'cake',
        accent: 'rose',
      });
    }

    const nearRewardCards = (nearRewardRes.data ?? []) as Array<{ customers: CustomerEmbed }>;
    if (nearRewardCards.length > 0) {
      const names = nearRewardCards.map((c) => embeddedFirstName(c.customers)).filter(Boolean);
      const first = names[0] || 'Une cliente';
      const extra = names.length - 1;
      actions.push({
        id: 'near_reward',
        title:
          extra > 0
            ? `${first} et ${extra} ${plural(extra, 'autre')} sont à 1 tampon de leur récompense`
            : `${first} est à 1 tampon de sa récompense`,
        subtitle: 'Un petit SMS et elle revient',
        href: '/dashboard/customers',
        icon: 'target',
        accent: 'rose',
      });
    }

    const vipRows = (vipRes.data ?? []) as Array<{
      rewards_earned: number;
      customers: CustomerEmbed;
    }>;
    if (vipRows.length > 0) {
      const vip = vipRows[0];
      const first = embeddedFirstName(vip.customers) || 'ta meilleure cliente';
      actions.push({
        id: 'reward_vip',
        title: `Offre -5 % permanents à ${first}`,
        subtitle: `${vip.rewards_earned} récompenses atteintes · signal VIP`,
        href: '/dashboard/members',
        icon: 'crown',
        accent: 'amber',
      });
    }

    const inactiveCount = inactiveCountRes.count ?? 0;
    if (inactiveCount >= INACTIVE_MIN_CUSTOMERS) {
      actions.push({
        id: 'inactive_customers',
        title: `${inactiveCount} clientes ne sont pas venues depuis ${INACTIVE_DAYS} jours`,
        subtitle: 'Relance-les avec une offre',
        href: '/dashboard/marketing?tab=sms',
        icon: 'userX',
        accent: 'amber',
      });
    }

    const attended = attendedCountRes.count ?? 0;
    const noShows = noShowCountRes.count ?? 0;
    const marked = attended + noShows;
    const noShowRate = marked > 0 ? noShows / marked : 0;
    if (
      planningEnabled &&
      !depositActive &&
      marked >= NO_SHOW_MIN_MARKED &&
      noShowRate > NO_SHOW_RATE_THRESHOLD
    ) {
      actions.push({
        id: 'suggest_deposit',
        title: `Ton taux de no-show est à ${Math.round(noShowRate * 100)} %`,
        subtitle: 'Active l’acompte pour les protéger',
        href: '/dashboard/planning',
        icon: 'shield',
        accent: 'amber',
      });
    }

    const customerCount = campaignCountRes.count ?? 0;
    if (customerCount >= SMS_MIN_CUSTOMERS) {
      const lastSentAt = (lastCampaignRes.data as Array<{ sent_at: string }> | null)?.[0]?.sent_at;
      const daysSince = lastSentAt
        ? Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 86_400_000)
        : null;
      if (daysSince === null || daysSince >= SMS_DAYS_SINCE_LAST) {
        actions.push({
          id: 'sms_campaign',
          title: `Envoie une offre à tes ${customerCount} clientes`,
          subtitle:
            daysSince === null
              ? 'Tu n’as encore jamais lancé de campagne'
              : `Dernière campagne il y a ${daysSince} jours`,
          href: '/dashboard/marketing?tab=sms',
          icon: 'sparkles',
          accent: 'rose',
        });
      }
    }

    if (referralEnabled && referralCountRes.count === 0) {
      actions.push({
        id: 'referral_boost',
        title: 'Aucun parrainage utilisé ces 30 derniers jours',
        subtitle: 'Rappelle à tes clientes que tu offres un parrainage',
        href: '/dashboard/referrals',
        icon: 'gift',
        accent: 'emerald',
      });
    }

    actions.sort((a, b) => PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id));
    const response = NextResponse.json({ actions: actions.slice(0, 3) });
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (error) {
    logger.error('quick-actions GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
