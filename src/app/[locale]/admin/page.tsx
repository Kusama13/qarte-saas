'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Store,
  Users,
  Clock,
  CreditCard,
  TrendingUp,
  Calendar,
  Percent,
  Plus,
  Check,
  Trash2,
  StickyNote,
  Target,
  MessageCircle,
  ChevronRight,
  Save,
  Loader2,
  X,
  Wallet,
  UserX,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { Button, Input, Modal } from '@/components/ui';
import { cn, formatPhoneForWhatsApp, getMerchantMonthlyPrice } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
interface Merchant {
  id: string;
  user_id: string;
  shop_name: string;
  shop_type: string;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  billing_interval: 'monthly' | 'annual' | null;
  billing_period_start: string | null;
  trial_ends_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  reward_description: string | null;
  logo_url: string | null;
  loyalty_mode: 'visit' | 'cagnotte';
  bio: string | null;
  planning_enabled: boolean;
  auto_booking_enabled: boolean;
  booking_mode: 'slots' | 'free' | null;
  referral_program_enabled: boolean;
  birthday_gift_enabled: boolean;
  welcome_offer_enabled: boolean;
  double_days_enabled: boolean;
  shield_enabled: boolean;
  tier2_enabled: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'normal' | 'high';
  due_date: string | null;
  created_at: string;
}

interface Prospect {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string;
  status: string;
  notes: string | null;
  next_followup: string | null;
  created_at: string;
}

// ============================================
// STATUS CONFIG
// ============================================
const PROSPECT_STATUSES = [
  { value: 'new', label: 'Nouveau', color: 'bg-gray-100 text-gray-700' },
  { value: 'contacted', label: 'Contacté', color: 'bg-blue-100 text-blue-700' },
  { value: 'demo_scheduled', label: 'Démo prévue', color: 'bg-purple-100 text-purple-700' },
  { value: 'demo_done', label: 'Démo faite', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'trial', label: 'En essai', color: 'bg-amber-100 text-amber-700' },
  { value: 'converted', label: 'Converti', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Perdu', color: 'bg-red-100 text-red-700' },
];

const PRIORITY_CONFIG = {
  high: { label: 'Haute', color: 'text-red-600 bg-red-50' },
  normal: { label: 'Normal', color: 'text-gray-600 bg-gray-50' },
  low: { label: 'Basse', color: 'text-blue-600 bg-blue-50' },
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminDashboardPage() {
  const supabase = getSupabase();

  // Stats
  const [stats, setStats] = useState({
    totalMerchants: 0,
    trialMerchants: 0,
    activeMerchants: 0,
    canceledMerchants: 0,
    totalCustomers: 0,
    weeklyActiveMerchants: 0,
    cagnotteMerchants: 0,
    mrr: 0,
    planningActive: 0,
    resaEnLigne: 0,
    modeLibre: 0,
  });
  const [recentMerchants, setRecentMerchants] = useState<Merchant[]>([]);

  // Action segments

  // Notes
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesLastSaved, setNotesLastSaved] = useState<Date | null>(null);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Prospects
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectCounts, setProspectCounts] = useState<Record<string, number>>({});
  const [prospectFilter, setProspectFilter] = useState('all');
  const [prospectModalOpen, setProspectModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [prospectForm, setProspectForm] = useState({
    business_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    source: 'other',
    status: 'new',
    notes: '',
    next_followup: '',
  });
  const [savingProspect, setSavingProspect] = useState(false);

  const [loading, setLoading] = useState(true);

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchStatsAndActions = useCallback(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [
      { data: allMerchants },
      { data: superAdmins },
      { data: recentMerchantsList },
    ] = await Promise.all([
      supabase.from('merchants').select('id, user_id, shop_name, shop_type, shop_address, phone, subscription_status, billing_interval, billing_period_start, trial_ends_at, created_at, last_seen_at, reward_description, logo_url, loyalty_mode, bio, planning_enabled, auto_booking_enabled, booking_mode, referral_program_enabled, birthday_gift_enabled, welcome_offer_enabled, double_days_enabled, shield_enabled, tier2_enabled'),
      supabase.from('super_admins').select('user_id'),
      supabase.from('merchants').select('id, user_id, shop_name, shop_type, shop_address, phone, subscription_status, billing_interval, billing_period_start, trial_ends_at, created_at, reward_description, logo_url, loyalty_mode, bio, planning_enabled, auto_booking_enabled, booking_mode, referral_program_enabled, birthday_gift_enabled, welcome_offer_enabled, double_days_enabled, shield_enabled, tier2_enabled').order('created_at', { ascending: false }).limit(10),
    ]);

    const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));
    const merchants = (allMerchants || []).filter((m: Merchant) => !superAdminUserIds.has(m.user_id));

    // Count customers excluding admin merchants
    const adminMerchantIds = (allMerchants || []).filter((m: Merchant) => superAdminUserIds.has(m.user_id)).map((m: Merchant) => m.id);
    const customerCountQuery = adminMerchantIds.length > 0
      ? supabase.from('customers').select('*', { count: 'exact', head: true }).not('merchant_id', 'in', `(${adminMerchantIds.join(',')})`)
      : supabase.from('customers').select('*', { count: 'exact', head: true });
    const { count: totalCustomers } = await customerCountQuery;

    // Stats
    const trial = merchants.filter((m: Merchant) => m.subscription_status === 'trial');
    const active = merchants.filter((m: Merchant) => m.subscription_status === 'active' || m.subscription_status === 'canceling' || m.subscription_status === 'past_due');
    const canceled = merchants.filter((m: Merchant) => m.subscription_status === 'canceled');
    // Actifs 7j = merchants ayant ouvert leur dashboard dans les 7 derniers jours (action merchant, pas scans clients).
    const weeklyActive = new Set(
      merchants.filter((m: Merchant) => m.last_seen_at && new Date(m.last_seen_at) >= sevenDaysAgo).map((m: Merchant) => m.id),
    );

    const cagnotte = merchants.filter((m: Merchant) => m.loyalty_mode === 'cagnotte');
    const planningActive = merchants.filter((m: Merchant) => m.planning_enabled);
    const resaEnLigne = merchants.filter((m: Merchant) => m.auto_booking_enabled);
    const modeLibre = merchants.filter((m: Merchant) => m.booking_mode === 'free');

    // MRR via getMerchantMonthlyPrice : tarif par tier/cycle (14€ Fidélité, 24€ Tout-en-un, legacy 19€, annuel /12)
    const mrr = active.reduce((sum: number, m: Merchant) => {
      return sum + getMerchantMonthlyPrice(m);
    }, 0);

    setStats({
      totalMerchants: merchants.length,
      trialMerchants: trial.length,
      activeMerchants: active.length,
      canceledMerchants: canceled.length,
      totalCustomers: totalCustomers || 0,
      weeklyActiveMerchants: weeklyActive.size,
      cagnotteMerchants: cagnotte.length,
      mrr,
      planningActive: planningActive.length,
      resaEnLigne: resaEnLigne.length,
      modeLibre: modeLibre.length,
    });

    // Recent merchants (for bottom row)
    setRecentMerchants(
      (recentMerchantsList || []).filter((m: Merchant) => !superAdminUserIds.has(m.user_id)).slice(0, 5)
    );

  }, [supabase]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch('/api/admin/notes');
    const data = await res.json();
    if (data.notes !== undefined) {
      setNotes(data.notes);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/admin/tasks');
    const data = await res.json();
    if (data.tasks) {
      setTasks(data.tasks);
    }
  }, []);

  const fetchProspects = useCallback(async () => {
    const res = await fetch(`/api/admin/prospects?status=${prospectFilter}`);
    const data = await res.json();
    if (data.prospects) {
      setProspects(data.prospects);
    }
    if (data.counts) {
      setProspectCounts(data.counts);
    }
  }, [prospectFilter]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        await Promise.all([
          fetchStatsAndActions(),
          fetchNotes(),
          fetchTasks(),
          fetchProspects(),
        ]);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [fetchStatsAndActions, fetchNotes, fetchTasks, fetchProspects]);

  useEffect(() => {
    fetchProspects();
  }, [prospectFilter, fetchProspects]);

  // ============================================
  // NOTES HANDLERS
  // ============================================
  const saveNotes = useCallback(async () => {
    setNotesSaving(true);
    try {
      await fetch('/api/admin/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notes }),
      });
      setNotesLastSaved(new Date());
    } catch (error) {
      console.error('Error saving notes:', error);
    }
    setNotesSaving(false);
  }, [notes]);

  // Auto-save notes after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes && !loading) {
        saveNotes();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [notes, loading, saveNotes]);

  // ============================================
  // TASKS HANDLERS
  // ============================================
  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim() }),
      });
      if (res.ok) {
        setNewTaskTitle('');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
    setAddingTask(false);
  };

  const toggleTask = async (task: Task) => {
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/admin/tasks?id=${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // ============================================
  // PROSPECTS HANDLERS
  // ============================================
  const openProspectModal = (prospect?: Prospect) => {
    if (prospect) {
      setEditingProspect(prospect);
      setProspectForm({
        business_name: prospect.business_name,
        contact_name: prospect.contact_name || '',
        phone: prospect.phone || '',
        email: prospect.email || '',
        address: prospect.address || '',
        source: prospect.source,
        status: prospect.status,
        notes: prospect.notes || '',
        next_followup: prospect.next_followup || '',
      });
    } else {
      setEditingProspect(null);
      setProspectForm({
        business_name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        source: 'other',
        status: 'new',
        notes: '',
        next_followup: '',
      });
    }
    setProspectModalOpen(true);
  };

  const saveProspect = async () => {
    if (!prospectForm.business_name.trim()) return;
    setSavingProspect(true);
    try {
      const method = editingProspect ? 'PATCH' : 'POST';
      const body = editingProspect
        ? { id: editingProspect.id, ...prospectForm }
        : prospectForm;

      const res = await fetch('/api/admin/prospects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setProspectModalOpen(false);
        fetchProspects();
      }
    } catch (error) {
      console.error('Error saving prospect:', error);
    }
    setSavingProspect(false);
  };

  const updateProspectStatus = async (prospectId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospectId, status: newStatus }),
      });
      fetchProspects();
    } catch (error) {
      console.error('Error updating prospect:', error);
    }
  };

  const deleteProspect = async (prospectId: string) => {
    if (!confirm('Supprimer ce prospect ?')) return;
    try {
      await fetch(`/api/admin/prospects?id=${prospectId}`, { method: 'DELETE' });
      fetchProspects();
    } catch (error) {
      console.error('Error deleting prospect:', error);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const conversionRate = (stats.activeMerchants + stats.canceledMerchants) > 0
    ? Math.round((stats.activeMerchants / (stats.activeMerchants + stats.canceledMerchants)) * 100)
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = PROSPECT_STATUSES.find(s => s.value === status);
    return config || PROSPECT_STATUSES[0];
  };

  const openWhatsApp = (phone: string, name?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(name ? `Bonjour ${name}, ` : 'Bonjour, ');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const totalProspects = Object.values(prospectCounts).reduce((a: number, b: number) => a + b, 0);
  const pendingTasks = tasks.filter((t: { completed?: boolean }) => !t.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{formattedDate}</span>
          </div>
        </div>
        <Button onClick={() => openProspectModal()} className="bg-[#5167fc] hover:bg-[#4154d4] text-white rounded-lg shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau prospect
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Commerçants" value={stats.totalMerchants} icon={Store} color="emerald" />
        <StatCard label="Abonnes" value={stats.activeMerchants} icon={CreditCard} color="pink" />
        <StatCard label="MRR" value={`${Math.round(stats.mrr)}€`} icon={Wallet} color="purple" />
        <StatCard label="En essai" value={stats.trialMerchants} icon={Clock} color="amber" />
        <StatCard label="Annules" value={stats.canceledMerchants} icon={UserX} color="red" />
        <StatCard label="Actifs 7j" value={stats.weeklyActiveMerchants} icon={Users} color="blue" />
        <StatCard label="Conversion" value={`${conversionRate}%`} icon={Percent} color="green" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Planning actif" value={stats.planningActive} icon={Calendar} color="blue" />
        <StatCard label="Resa en ligne" value={stats.resaEnLigne} icon={Calendar} color="emerald" />
        <StatCard label="Mode Libre" value={stats.modeLibre} icon={Calendar} color="purple" />
      </div>


      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: Notes + Tasks */}
        <div className="space-y-6">
          {/* Notes */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <StickyNote className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="font-semibold text-slate-900">Notes</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {notesSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5167fc]" />}
                {notesLastSaved && !notesSaving && (
                  <span className="text-[#5167fc]">
                    Sauvé {notesLastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Écrivez vos notes, idées, rappels..."
              className="w-full h-48 p-4 text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none"
            />
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5167fc]/10 rounded-lg">
                  <Check className="w-5 h-5 text-[#5167fc]" />
                </div>
                <h2 className="font-semibold text-slate-900">Tâches</h2>
                {pendingTasks > 0 && (
                  <span className="px-2 py-0.5 bg-[#5167fc] text-white text-xs font-medium rounded-full">
                    {pendingTasks}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              {/* Add task */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Nouvelle tâche..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#5167fc] focus:ring-1 focus:ring-[#5167fc]"
                />
                <button
                  onClick={addTask}
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="px-3 py-2 bg-[#5167fc] text-white rounded-lg hover:bg-[#4154d4] transition-colors disabled:opacity-50"
                >
                  {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Task list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-6">Aucune tâche</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-lg transition-colors",
                        task.completed ? "bg-slate-50" : "hover:bg-slate-50"
                      )}
                    >
                      <button
                        onClick={() => toggleTask(task)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          task.completed
                            ? "bg-[#5167fc] border-[#5167fc] text-white"
                            : "border-slate-300 hover:border-[#5167fc]"
                        )}
                      >
                        {task.completed && <Check className="w-3 h-3" />}
                      </button>
                      <span className={cn("flex-1 text-sm", task.completed && "line-through text-slate-400")}>
                        {task.title}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Prospects CRM */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 shadow-md overflow-hidden">
          <div className="border-b border-slate-100">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#5167fc]/10 rounded-lg">
                    <Target className="w-5 h-5 text-[#5167fc]" />
                  </div>
                  <h2 className="font-semibold text-slate-900">Pipeline Prospects</h2>
                  <span className="px-2 py-0.5 bg-[#5167fc] text-white text-xs font-medium rounded-full">
                    {totalProspects}
                  </span>
                </div>
              </div>

              {/* Status filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setProspectFilter('all')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    prospectFilter === 'all'
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Tous ({totalProspects})
                </button>
                {PROSPECT_STATUSES.slice(0, 5).map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setProspectFilter(status.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      prospectFilter === status.value
                        ? status.color
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {status.label} ({prospectCounts[status.value] || 0})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prospects list */}
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {prospects.length === 0 ? (
              <div className="py-12 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun prospect</p>
                <button
                  onClick={() => openProspectModal()}
                  className="mt-3 text-[#5167fc] font-medium text-sm hover:underline"
                >
                  Ajouter un prospect
                </button>
              </div>
            ) : (
              prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => openProspectModal(prospect)}
                          className="font-semibold text-gray-900 hover:text-[#5167fc] truncate"
                        >
                          {prospect.business_name}
                        </button>
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full", getStatusBadge(prospect.status).color)}>
                          {getStatusBadge(prospect.status).label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {prospect.contact_name && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {prospect.contact_name}
                          </span>
                        )}
                        {prospect.phone && (
                          <button
                            onClick={() => openWhatsApp(prospect.phone!, prospect.contact_name || undefined)}
                            className="flex items-center gap-1 hover:text-green-600 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {prospect.phone}
                          </button>
                        )}
                        {prospect.next_followup && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Calendar className="w-3 h-3" />
                            Relance: {formatDate(prospect.next_followup)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick status change */}
                      <select
                        value={prospect.status}
                        onChange={(e) => updateProspectStatus(prospect.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#5167fc]"
                      >
                        {PROSPECT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteProspect(prospect.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dernières inscriptions */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5167fc]/10 rounded-lg">
              <Store className="w-5 h-5 text-[#5167fc]" />
            </div>
            <h2 className="font-semibold text-slate-900">Dernières inscriptions</h2>
          </div>
          <Link href="/admin/merchants" className="text-[#5167fc] text-sm font-medium hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentMerchants.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">Aucune inscription</p>
          ) : (
            recentMerchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/admin/merchants/${merchant.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5167fc] flex items-center justify-center text-white font-medium text-sm">
                    {merchant.shop_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{merchant.shop_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(merchant.created_at)}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Prospect Modal */}
      <Modal
        isOpen={prospectModalOpen}
        onClose={() => setProspectModalOpen(false)}
        title={editingProspect ? 'Modifier prospect' : 'Nouveau prospect'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom du commerce *"
            placeholder="Ex: Boulangerie Martin"
            value={prospectForm.business_name}
            onChange={(e) => setProspectForm({ ...prospectForm, business_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact"
              placeholder="Nom du contact"
              value={prospectForm.contact_name}
              onChange={(e) => setProspectForm({ ...prospectForm, contact_name: e.target.value })}
            />
            <Input
              label="Téléphone"
              placeholder="06 12 34 56 78"
              value={prospectForm.phone}
              onChange={(e) => setProspectForm({ ...prospectForm, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="contact@example.com"
              value={prospectForm.email}
              onChange={(e) => setProspectForm({ ...prospectForm, email: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={prospectForm.status}
                onChange={(e) => setProspectForm({ ...prospectForm, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc]"
              >
                {PROSPECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Adresse"
            placeholder="Adresse du commerce"
            value={prospectForm.address}
            onChange={(e) => setProspectForm({ ...prospectForm, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={prospectForm.source}
                onChange={(e) => setProspectForm({ ...prospectForm, source: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc]"
              >
                <option value="cold_call">Appel froid</option>
                <option value="referral">Recommandation</option>
                <option value="website">Site web</option>
                <option value="social">Réseaux sociaux</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <Input
              label="Date de relance"
              type="date"
              value={prospectForm.next_followup}
              onChange={(e) => setProspectForm({ ...prospectForm, next_followup: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={prospectForm.notes}
              onChange={(e) => setProspectForm({ ...prospectForm, notes: e.target.value })}
              placeholder="Notes sur ce prospect..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5167fc] h-24 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setProspectModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={saveProspect}
              disabled={savingProspect || !prospectForm.business_name.trim()}
              className="flex-1 bg-[#5167fc] hover:bg-[#4154d4] text-white"
            >
              {savingProspect ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingProspect ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'emerald' | 'amber' | 'indigo' | 'pink' | 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-[#5167fc]/10 text-[#5167fc]',
    pink: 'bg-pink-50 text-pink-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-full shrink-0", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 tracking-tight leading-none">{value}</p>
        </div>
      </div>
    </div>
  );
}


