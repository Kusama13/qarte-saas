'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMerchant } from '@/contexts/MerchantContext';
import { formatRelativeTime } from '@/lib/utils';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  sent_at: string;
}

const EMOJI_MAP: Record<string, string> = {
  booking: '\uD83D\uDCC5',
  booking_cancelled: '\u274C',
  booking_rescheduled: '\uD83D\uDD04',
  deposit_expired: '\u23F0',
  deposit_expiring: '\u26A0\uFE0F',
  birthday_digest: '\uD83C\uDF82',
  contest_winner: '\uD83C\uDF89',
  onboarding_planning: '\uD83D\uDC4B',
  onboarding_first_scan: '\uD83D\uDC4B',
  onboarding_qr: '\uD83D\uDC4B',
};
const DEFAULT_EMOJI = '\uD83D\uDD14';

function getEmoji(type: string): string {
  return EMOJI_MAP[type] || (type.startsWith('onboarding') ? '\uD83D\uDC4B' : DEFAULT_EMOJI);
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
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
        const prefix = window.location.pathname.startsWith('/en/') ? '/en' : '/fr';
        window.location.href = `${prefix}${notif.url}`;
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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
                notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="w-2 flex-shrink-0 mt-1.5">
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>

                    <span className="text-lg flex-shrink-0 mt-0.5">{getEmoji(notif.notification_type)}</span>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug line-clamp-1 ${notif.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{notif.body}</p>
                    </div>

                    <span className="text-[11px] text-gray-400 flex-shrink-0">{formatRelativeTime(notif.sent_at, locale)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
