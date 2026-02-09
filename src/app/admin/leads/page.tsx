'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail,
  UserPlus,
  Calendar,
  CheckCircle,
  Search,
  Store,
  AlertTriangle,
  ChevronRight,
  MessageCircle,
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
  phone?: string;
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

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Format local français : 0X → 33X
    if (cleaned.startsWith('0')) return '33' + cleaned.substring(1);
    // Déjà en format international (FR, BE, CH, LU)
    if (cleaned.startsWith('33') || cleaned.startsWith('32') || cleaned.startsWith('41') || cleaned.startsWith('352')) return cleaned;
    return cleaned;
  };

  const openWhatsApp = (phone: string, name?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(name ? `Bonjour ${name}, ` : 'Bonjour, ');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5167fc]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pt-10 lg:pt-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Leads
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">
          Prospects a contacter et convertir
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('incomplete')}
          className={cn(
            'px-3 sm:px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap',
            activeTab === 'incomplete'
              ? 'border-[#5167fc] text-[#5167fc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Inscriptions incomplètes</span>
          <span className="sm:hidden">Incomplètes</span>
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
            'px-3 sm:px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap',
            activeTab === 'today'
              ? 'border-[#5167fc] text-[#5167fc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Store className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Inscriptions du jour</span>
          <span className="sm:hidden">Aujourd&apos;hui</span>
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Incomplètes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{incompleteStats.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">48h</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex-shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Relance auto</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">2-3h après</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-3 sm:p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex-shrink-0">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500">Aujourd&apos;hui</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500">Programme</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayStats.withProgram}</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500">Sans prog.</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayStats.withoutProgram}</p>
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
                <Link
                  key={signup.id}
                  href={`/admin/merchants/${signup.id}`}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-indigo-50/50 transition-colors cursor-pointer group block"
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
                      <p className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
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

                  <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    {signup.phone && (
                      <span
                        onClick={(e) => { e.preventDefault(); openWhatsApp(signup.phone!, signup.shop_name); }}
                        className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                        <span className="sm:hidden">WA</span>
                      </span>
                    )}
                    {signup.user_email && (
                      <span
                        onClick={(e) => { e.preventDefault(); window.location.href = `mailto:${signup.user_email}`; }}
                        className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Email
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors hidden sm:block" />
                  </div>
                </Link>
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
