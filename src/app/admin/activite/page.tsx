'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  UserPlus,
  Gift,
  Users,
  MessageCircle,
  Loader2,
  Filter,
  Calendar,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type EventType = 'scan' | 'signup' | 'redemption' | 'new_customer' | 'contact';

interface ActivityEvent {
  type: EventType;
  timestamp: string;
  title: string;
  subtitle: string;
}

interface Summary {
  scans: number;
  signups: number;
  redemptions: number;
  newCustomers: number;
  contacts: number;
}

const EVENT_CONFIG: Record<EventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  scan: { icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Scans' },
  signup: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Inscriptions' },
  redemption: { icon: Gift, color: 'text-pink-600', bg: 'bg-pink-50', label: 'Récompenses' },
  new_customer: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Clients' },
  contact: { icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Messages' },
};

export default function ActivitePage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [summary, setSummary] = useState<Summary>({ scans: 0, signups: 0, redemptions: 0, newCustomers: 0, contacts: 0 });
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  const fetchActivity = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/activity-feed', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setSummary(data.summary || { scans: 0, signups: 0, redemptions: 0, newCustomers: 0, contacts: 0 });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter(e => e.type === activeFilter);

  const totalEvents = events.length;

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pt-10 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Activité</h1>
        <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span className="capitalize">{formattedDate}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard label="Scans" value={summary.scans} icon={Eye} color="emerald" />
        <SummaryCard label="Inscriptions" value={summary.signups} icon={UserPlus} color="blue" />
        <SummaryCard label="Récompenses" value={summary.redemptions} icon={Gift} color="pink" />
        <SummaryCard label="Nouveaux clients" value={summary.newCustomers} icon={Users} color="indigo" />
        <SummaryCard label="Messages" value={summary.contacts} icon={MessageCircle} color="amber" />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap',
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Tout ({totalEvents})
        </button>
        {(Object.keys(EVENT_CONFIG) as EventType[]).map((type) => {
          const config = EVENT_CONFIG[type];
          const count = type === 'scan' ? summary.scans
            : type === 'signup' ? summary.signups
            : type === 'redemption' ? summary.redemptions
            : type === 'new_customer' ? summary.newCustomers
            : summary.contacts;
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5',
                activeFilter === type
                  ? `${config.bg} ${config.color}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Eye className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune activité aujourd&apos;hui</p>
            <p className="text-sm text-gray-400 mt-1">
              Les événements apparaîtront ici au fil de la journée
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEvents.map((event, index) => {
              const config = EVENT_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', config.bg)}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'pink' | 'indigo' | 'amber';
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    pink: 'bg-pink-50 text-pink-600',
    indigo: 'bg-[#5167fc]/10 text-[#5167fc]',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
