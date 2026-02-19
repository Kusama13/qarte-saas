'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
}

const typeConfig = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', iconColor: 'text-orange-500' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-500' },
  urgent: { icon: AlertOctagon, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
};

export default function AdminAnnouncementBanner() {
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
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2 pr-6">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.iconColor}`} />
              <div>
                <span className="font-semibold">{a.title}</span>
                <p className="mt-0.5 text-xs opacity-80">{a.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
