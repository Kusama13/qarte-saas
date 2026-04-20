'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Calendar,
  CalendarX,
  CalendarClock,
  Clock,
  AlertTriangle,
  Cake,
  Trophy,
  Sparkles,
  CalendarDays,
  CalendarRange,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMerchant } from '@/contexts/MerchantContext';
import { formatRelativeTimeShort } from '@/lib/utils';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  sent_at: string;
}

type IconTint = { icon: LucideIcon; bg: string; fg: string };

const ICON_MAP: Record<string, IconTint> = {
  booking: { icon: Calendar, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
  booking_cancelled: { icon: CalendarX, bg: 'bg-red-50', fg: 'text-red-600' },
  booking_rescheduled: { icon: CalendarClock, bg: 'bg-amber-50', fg: 'text-amber-600' },
  deposit_expired: { icon: Clock, bg: 'bg-red-50', fg: 'text-red-600' },
  deposit_expiring: { icon: AlertTriangle, bg: 'bg-amber-50', fg: 'text-amber-600' },
  birthday_digest: { icon: Cake, bg: 'bg-pink-50', fg: 'text-pink-600' },
  contest_winner: { icon: Trophy, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  daily_digest: { icon: CalendarDays, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
  weekly_recap: { icon: CalendarRange, bg: 'bg-violet-50', fg: 'text-violet-600' },
  trial_reminder: { icon: AlertTriangle, bg: 'bg-amber-50', fg: 'text-amber-600' },
};
const ONBOARDING_ICON: IconTint = { icon: Sparkles, bg: 'bg-violet-50', fg: 'text-violet-600' };
const DEFAULT_ICON: IconTint = { icon: Bell, bg: 'bg-gray-100', fg: 'text-gray-500' };

function getIcon(type: string): IconTint {
  return ICON_MAP[type] || (type.startsWith('onboarding') ? ONBOARDING_ICON : DEFAULT_ICON);
}

export default function NotificationBell() {
  const { merchant } = useMerchant();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('notifBell');

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasNotifs = merchant?.planning_enabled || merchant?.auto_booking_enabled;

  const fetchNotifications = useCallback(async () => {
    if (!merchant?.id || !hasNotifs || document.hidden) return;
    try {
      const res = await fetch(`/api/merchant-notifications?merchantId=${merchant.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silent */ }
  }, [merchant?.id, hasNotifs]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    // pointerdown covers mouse + touch in one listener (reliable on iOS PWA where
    // mousedown synthesis from touch is inconsistent)
    const handler = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler, { passive: true });
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    if (!merchant?.id) return;
    setLoading(true);
    try {
      await fetch('/api/merchant-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id }),
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleClearAll = async () => {
    if (!merchant?.id) return;
    setLoading(true);
    try {
      await fetch(`/api/merchant-notifications?merchantId=${merchant.id}`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleClick = (notif: Notification) => {
    if (!notif.read && merchant?.id) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      fetch('/api/merchant-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, notificationId: notif.id }),
      }).catch(() => {});
    }
    setOpen(false);
    if (notif.url) {
      // next-intl router.push doesn't handle query strings in raw URLs reliably
      // Use window.location for URLs with query params, router.push for simple paths
      if (notif.url.includes('?')) {
        window.location.href = `/${locale}${notif.url}`;
      } else {
        router.push(notif.url);
      }
    }
  };

  if (!merchant || !hasNotifs) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label={t('title')}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-3 top-14 z-50 w-[calc(100vw-1.5rem)] max-w-80 lg:absolute lg:left-0 lg:right-auto lg:top-full lg:mt-2 lg:w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">{t('title')}</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-sm">{t('empty')}</span>
                </div>
              ) : (
                notifications.map(notif => {
                  const { icon: Icon, bg, fg } = getIcon(notif.notification_type);
                  return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full ${bg} ${fg} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      {!notif.read && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className={`flex-1 text-sm leading-snug truncate ${notif.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums mt-0.5">{formatRelativeTimeShort(notif.sent_at, locale)}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 break-words mt-0.5">{notif.body}</p>
                    </div>
                  </button>
                  );
                })
              )}
            </div>
            {notifications.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-xs font-medium text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                >
                  {t('clearAll')}
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
