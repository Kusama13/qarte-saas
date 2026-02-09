'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail,
  Calendar,
  CheckCircle,
  Search,
  Store,
  AlertTriangle,
  ChevronRight,
  MessageCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
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

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

type Tab = 'incomplete' | 'today' | 'messages';

// ============================================
// MAIN COMPONENT
// ============================================
export default function LeadsPage() {
  const supabase = getSupabase();
  const [activeTab, setActiveTab] = useState<Tab>('incomplete');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Tab data
  const [incompleteSignups, setIncompleteSignups] = useState<IncompleteSignup[]>([]);
  const [todaySignups, setTodaySignups] = useState<TodaySignup[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  // ============================================
  // DATA FETCHING
  // ============================================
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return { 'Authorization': `Bearer ${session.access_token}` };
  }, [supabase]);

  const fetchIncompleteSignups = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch('/api/admin/incomplete-signups', { headers });
      if (res.ok) {
        const data = await res.json();
        setIncompleteSignups(data.incompleteSignups || []);
      }
    } catch (error) {
      console.error('Error fetching incomplete signups:', error);
    }
  }, [getAuthHeaders]);

  const fetchTodaySignups = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch('/api/admin/today-signups', { headers });
      if (res.ok) {
        const data = await res.json();
        setTodaySignups(data.signups || []);
      }
    } catch (error) {
      console.error('Error fetching today signups:', error);
    }
  }, [getAuthHeaders]);

  const fetchContactMessages = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch('/api/admin/contact-messages', { headers });
      if (res.ok) {
        const data = await res.json();
        setContactMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  }, [getAuthHeaders]);

  // State to force time recalculation every 30s
  const [, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchIncompleteSignups(),
      fetchTodaySignups(),
      fetchContactMessages(),
    ]).finally(() => setLoading(false));

    // Refresh data + recalculate times every 30s
    const interval = setInterval(() => {
      fetchIncompleteSignups();
      fetchTodaySignups();
      fetchContactMessages();
      setTick(t => t + 1);
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchIncompleteSignups, fetchTodaySignups, fetchContactMessages]);

  // ============================================
  // ACTIONS
  // ============================================
  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '33' + cleaned.substring(1);
    return cleaned;
  };

  const openWhatsApp = (phone: string, name?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(name ? `Bonjour ${name}, ` : 'Bonjour, ');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const deleteContactMessage = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`/api/admin/contact-messages?id=${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setContactMessages(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Error deleting contact message:', error);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
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

  // Counts
  const counts = {
    incomplete: incompleteSignups.length,
    today: todaySignups.length,
    messages: contactMessages.length,
  };

  // Filtered data
  const filteredIncomplete = incompleteSignups.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredToday = todaySignups.filter(s =>
    !search || s.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.user_email && s.user_email.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredMessages = contactMessages.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  // ============================================
  // TAB CONFIG
  // ============================================
  const tabs: { key: Tab; label: string; shortLabel: string; icon: React.ElementType; count: number }[] = [
    { key: 'incomplete', label: 'Incomplètes', shortLabel: 'Incompl.', icon: AlertTriangle, count: counts.incomplete },
    { key: 'today', label: 'Aujourd\'hui', shortLabel: 'Auj.', icon: Store, count: counts.today },
    { key: 'messages', label: 'Messages', shortLabel: 'Msgs', icon: MessageCircle, count: counts.messages },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pt-10 lg:pt-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Leads</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">
          Prospects à contacter et convertir
        </p>
      </div>

      {/* Tabs - horizontal scroll on mobile */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-2.5 sm:px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0',
                activeTab === tab.key
                  ? 'border-[#5167fc] text-[#5167fc]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold',
                activeTab === tab.key ? 'bg-[#5167fc] text-white' : 'bg-gray-100 text-gray-600'
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc]"
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tab: Incomplete */}
        {activeTab === 'incomplete' && (
          filteredIncomplete.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredIncomplete.map((signup) => (
                <div key={signup.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                      <Mail className="w-5 h-5 text-yellow-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg">{signup.email}</p>
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
                  <a
                    href={`mailto:${signup.email}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 w-fit"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle} title="Aucune inscription incomplète" subtitle="Tous les utilisateurs ont finalisé (48h)" />
          )
        )}

        {/* Tab: Today */}
        {activeTab === 'today' && (
          filteredToday.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredToday.map((signup) => (
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
                      <Store className={cn('w-5 h-5', signup.has_program ? 'text-emerald-600' : 'text-amber-600')} />
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
            <EmptyState icon={Store} title="Aucune inscription aujourd'hui" subtitle="Les nouveaux commerçants apparaîtront ici" />
          )
        )}

        {/* Tab: Contact Messages */}
        {activeTab === 'messages' && (
          filteredMessages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 shrink-0">
                        <MessageCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{msg.name}</p>
                          <span className="text-xs text-gray-400">{msg.email}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-1">{msg.subject}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">Répondre</span>
                      </a>
                      <button
                        onClick={() => deleteContactMessage(msg.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageCircle} title="Aucun message" subtitle="Les messages du formulaire de contact apparaîtront ici" />
          )
        )}
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================
function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <Icon className="w-16 h-16 mb-4 text-gray-300" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
