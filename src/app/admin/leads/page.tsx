'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  UserPlus,
  Calendar,
  CheckCircle,
  Search,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface IncompleteSignup {
  id: string;
  email: string;
  created_at: string;
}

interface TodaySignup {
  id: string;
  shop_name: string;
  shop_type: string;
  created_at: string;
  subscription_status: string;
  user_email?: string;
  has_program: boolean;
}

type Tab = 'incomplete' | 'today';

export default function LeadsPage() {
  const supabase = getSupabase();
  const [activeTab, setActiveTab] = useState<Tab>('incomplete');
  const [incompleteSignups, setIncompleteSignups] = useState<IncompleteSignup[]>([]);
  const [todaySignups, setTodaySignups] = useState<TodaySignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchIncompleteSignups = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/incomplete-signups', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIncompleteSignups(data.incompleteSignups || []);
      }
    } catch (error) {
      console.error('Error fetching incomplete signups:', error);
    }
  }, [supabase]);

  const fetchTodaySignups = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/today-signups', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodaySignups(data.signups || []);
      }
    } catch (error) {
      console.error('Error fetching today signups:', error);
    }
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchIncompleteSignups(), fetchTodaySignups()]).finally(() => {
      setLoading(false);
    });
  }, [fetchIncompleteSignups, fetchTodaySignups]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `il y a ${diffDays}j`;
    if (diffHours > 0) return `il y a ${diffHours}h`;
    return 'à l\'instant';
  };

  const filteredTodaySignups = todaySignups.filter(signup => {
    if (!search) return true;
    return signup.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      (signup.user_email && signup.user_email.toLowerCase().includes(search.toLowerCase()));
  });

  const filteredIncomplete = incompleteSignups.filter(signup => {
    if (!search) return true;
    return signup.email.toLowerCase().includes(search.toLowerCase());
  });

  const incompleteStats = {
    total: incompleteSignups.length,
  };

  const todayStats = {
    total: todaySignups.length,
    withProgram: todaySignups.filter(s => s.has_program).length,
    withoutProgram: todaySignups.filter(s => !s.has_program).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5167fc]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Leads
        </h1>
        <p className="mt-1 text-gray-600">
          Prospects a contacter et convertir
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('incomplete')}
          className={cn(
            'px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'incomplete'
              ? 'border-[#5167fc] text-[#5167fc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Inscriptions incomplètes
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeTab === 'incomplete' ? 'bg-[#5167fc] text-white' : 'bg-gray-100 text-gray-600'
          )}>
            {incompleteStats.total}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={cn(
            'px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'today'
              ? 'border-[#5167fc] text-[#5167fc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Store className="w-4 h-4" />
          Inscriptions du jour
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeTab === 'today' ? 'bg-[#5167fc] text-white' : 'bg-gray-100 text-gray-600'
          )}>
            {todayStats.total}
          </span>
        </button>
      </div>

      {/* Stats */}
      {activeTab === 'incomplete' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-100">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Inscriptions incomplètes</p>
                <p className="text-2xl font-bold text-gray-900">{incompleteStats.total}</p>
                <p className="text-xs text-gray-400 mt-0.5">Dernières 48h</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email de relance envoyé</p>
                <p className="text-xs text-gray-400 mt-1">Automatique 2-3h après inscription</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100">
                <UserPlus className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Inscriptions aujourd&apos;hui</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Programme créé</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.withProgram}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Sans programme</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.withoutProgram}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'incomplete' ? "Rechercher par email..." : "Rechercher par nom ou email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc]"
          />
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {activeTab === 'incomplete' ? (
          // Incomplete Signups List
          filteredIncomplete.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredIncomplete.map((signup) => (
                <div
                  key={signup.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                      <Mail className="w-5 h-5 text-yellow-700" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg">
                        {signup.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Phase 1 uniquement
                        </span>
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getTimeSince(signup.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <a
                      href={`mailto:${signup.email}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <CheckCircle className="w-16 h-16 mb-4 text-green-300" />
              <p className="text-lg font-medium">Aucune inscription incomplète</p>
              <p className="text-sm text-gray-400 mt-1">
                Tous les utilisateurs ont finalisé leur inscription (dernières 48h)
              </p>
            </div>
          )
        ) : (
          // Today's Signups List
          filteredTodaySignups.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredTodaySignups.map((signup) => (
                <div
                  key={signup.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full',
                      signup.has_program ? 'bg-emerald-100' : 'bg-amber-100'
                    )}>
                      <Store className={cn(
                        'w-5 h-5',
                        signup.has_program ? 'text-emerald-600' : 'text-amber-600'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg">
                        {signup.shop_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {signup.shop_type}
                        </span>
                        {signup.has_program ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3" />
                            Programme créé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            Sans programme
                          </span>
                        )}
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(signup.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {signup.user_email && (
                      <a
                        href={`mailto:${signup.user_email}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Store className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucune inscription aujourd&apos;hui</p>
              <p className="text-sm text-gray-400 mt-1">
                Les nouveaux commerçants inscrits aujourd&apos;hui apparaîtront ici
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
