'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertOctagon, ExternalLink } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  link_url: string | null;
}

const typeConfig = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500', iconBg: 'bg-blue-100' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', iconColor: 'text-orange-500', iconBg: 'bg-orange-100' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-100' },
  urgent: { icon: AlertOctagon, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-500', iconBg: 'bg-red-100' },
};

interface Props {
  variant: 'sidebar' | 'banner';
}

export default function AdminAnnouncementBanner({ variant }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/announcements', { signal: controller.signal })
      .then((res) => res.ok ? res.json() : { announcements: [] })
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleDismiss = async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement_id: id }),
    }).catch(() => {});
  };

  if (announcements.length === 0) return null;

  // ── Sidebar variant (desktop) ──
  if (variant === 'sidebar') {
    return (
      <>
        {announcements.map((a) => {
          const config = typeConfig[a.type] || typeConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={a.id}
              className={`mx-3 mt-3 p-3 rounded-xl text-sm border ${config.bg} ${config.border} ${config.text} relative`}
            >
              <button
                onClick={() => handleDismiss(a.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {a.link_url ? (
                <a
                  href={a.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 pr-6 hover:opacity-80 transition-opacity"
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.iconColor}`} />
                  <div className="min-w-0">
                    <span className="font-semibold">{a.title}</span>
                    <p className="mt-0.5 text-xs opacity-80">{a.body}</p>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-medium opacity-60">
                      <ExternalLink className="w-2.5 h-2.5" />
                      En savoir plus
                    </span>
                  </div>
                </a>
              ) : (
                <div className="flex items-start gap-2 pr-6">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.iconColor}`} />
                  <div>
                    <span className="font-semibold">{a.title}</span>
                    <p className="mt-0.5 text-xs opacity-80">{a.body}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // ── Banner variant (mobile top) ──
  return (
    <div className="space-y-2 mb-4">
      {announcements.map((a) => {
        const config = typeConfig[a.type] || typeConfig.info;
        const Icon = config.icon;

        const content = (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${config.bg} ${config.border} ${config.text} relative`}>
            <div className={`w-9 h-9 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{a.title}</p>
              <p className="text-xs opacity-75 mt-0.5 line-clamp-2">{a.body}</p>
            </div>
            {a.link_url && (
              <ExternalLink className={`w-4 h-4 shrink-0 ${config.iconColor} opacity-50`} />
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismiss(a.id);
              }}
              className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );

        if (a.link_url) {
          return (
            <a
              key={a.id}
              href={a.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-90 transition-opacity"
            >
              {content}
            </a>
          );
        }

        return <div key={a.id}>{content}</div>;
      })}
    </div>
  );
}
