'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Store,
  Users,
  Clock,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  ArrowUpRight,
  Percent,
  Plus,
  Check,
  Trash2,
  StickyNote,
  Target,
  Phone,
  Mail,
  Building,
  ChevronRight,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button, Input, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
interface Merchant {
  id: string;
  shop_name: string;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
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
  { value: 'converted', label: 'Converti', color: 'bg-emerald-100 text-emerald-700' },
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
  const supabase = createClientComponentClient();

  // Stats
  const [stats, setStats] = useState({
    totalMerchants: 0,
    trialMerchants: 0,
    activeMerchants: 0,
    totalCustomers: 0,
  });
  const [trialEndingMerchants, setTrialEndingMerchants] = useState<Merchant[]>([]);
  const [recentMerchants, setRecentMerchants] = useState<Merchant[]>([]);

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
  const fetchStats = useCallback(async () => {
    const [
      { count: totalMerchants },
      { count: trialMerchants },
      { count: activeMerchants },
      { count: totalCustomers },
    ] = await Promise.all([
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      totalMerchants: totalMerchants || 0,
      trialMerchants: trialMerchants || 0,
      activeMerchants: activeMerchants || 0,
      totalCustomers: totalCustomers || 0,
    });
  }, [supabase]);

  const fetchMerchants = useCallback(async () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const [{ data: endingTrials }, { data: recent }] = await Promise.all([
      supabase
        .from('merchants')
        .select('*')
        .eq('subscription_status', 'trial')
        .lte('trial_ends_at', threeDaysFromNow.toISOString())
        .gte('trial_ends_at', new Date().toISOString())
        .order('trial_ends_at', { ascending: true })
        .limit(5),
      supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    setTrialEndingMerchants(endingTrials || []);
    setRecentMerchants(recent || []);
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
          fetchStats(),
          fetchMerchants(),
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
  }, [fetchStats, fetchMerchants, fetchNotes, fetchTasks, fetchProspects]);

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

  const conversionRate = stats.totalMerchants > 0
    ? ((stats.activeMerchants / stats.totalMerchants) * 100).toFixed(1)
    : '0';

  const getDaysRemaining = (trialEndsAt: string) => {
    const end = new Date(trialEndsAt);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

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

  const totalProspects = Object.values(prospectCounts).reduce((a, b) => a + b, 0);
  const pendingTasks = tasks.filter(t => !t.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {getGreeting()} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{formattedDate}</span>
          </div>
        </div>
        <Button onClick={() => openProspectModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau prospect
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Commerçants"
          value={stats.totalMerchants}
          icon={Store}
          color="emerald"
        />
        <StatCard
          label="En essai"
          value={stats.trialMerchants}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Conversion"
          value={`${conversionRate}%`}
          icon={Percent}
          color="indigo"
        />
        <StatCard
          label="MRR"
          value={`${stats.activeMerchants * 29}€`}
          icon={CreditCard}
          color="pink"
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: Notes + Tasks */}
        <div className="space-y-6">
          {/* Notes */}
          <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200/50 transition-all duration-500 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.08] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/20 rounded-xl blur-md animate-pulse" />
                  <div className="relative p-2 bg-white rounded-xl shadow-sm border border-amber-100/50">
                    <StickyNote className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-gray-800">Notes</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase text-gray-400">
                {notesSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
                {notesLastSaved && !notesSaving && (
                  <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-full border border-gray-100/50">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Sauvé {notesLastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Écrivez vos notes, idées, rappels..."
              className="w-full h-48 p-5 text-[15px] leading-relaxed text-gray-600 placeholder:text-gray-300 bg-white/40 resize-none focus:outline-none transition-colors"
            />
          </div>

          {/* Tasks */}
          <div className="relative group bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(139,92,246,0.08)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-70" />

            <div className="px-6 py-5 border-b border-gray-100/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-200 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="relative p-2.5 bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-xl shadow-sm">
                    <Check className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 tracking-tight">Tâches</h2>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Gestion quotidienne</p>
                </div>
                {pendingTasks > 0 && (
                  <span className="px-2.5 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-violet-200 animate-pulse">
                    {pendingTasks}
                  </span>
                )}
              </div>
            </div>

            <div className="p-5">
              {/* Add task */}
              <div className="flex gap-2.5 mb-6 group/input">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Qu'y a-t-il à faire ?"
                    className="w-full pl-4 pr-4 py-2.5 text-sm bg-white border border-gray-100 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 shadow-sm"
                  />
                </div>
                <button
                  onClick={addTask}
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-2xl hover:bg-violet-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:grayscale flex items-center justify-center min-w-[48px] shadow-lg shadow-gray-200 hover:shadow-violet-200"
                >
                  {addingTask ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {/* Task list */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 opacity-40">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
                      <Check className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-xs font-medium">Aucune tâche en attente</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "group/item flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 border border-transparent",
                        task.completed
                          ? "bg-gray-50/50 opacity-60"
                          : "bg-white hover:bg-violet-50/30 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5 hover:border-violet-100"
                      )}
                    >
                      <button
                        onClick={() => toggleTask(task)}
                        className={cn(
                          "relative w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                          task.completed
                            ? "bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-100"
                            : "border-gray-200 bg-white hover:border-violet-400 group-hover/item:border-violet-400"
                        )}
                      >
                        <Check className={cn(
                          "w-3.5 h-3.5 text-white transition-all duration-300 scale-0",
                          task.completed && "scale-100"
                        )} />
                      </button>

                      <div className="flex-1 flex flex-col min-w-0">
                        <span className={cn(
                          "text-sm font-medium transition-all duration-500 truncate",
                          task.completed ? "line-through text-gray-400 translate-x-1" : "text-gray-700"
                        )}>
                          {task.title}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden transition-all duration-500">
          <div className="relative border-b border-gray-100 bg-white/60 backdrop-blur-xl">
            {/* Emerald gradient accent top bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 opacity-90" />

            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full animate-pulse" />
                    <div className="relative p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-900 tracking-tight text-lg">Pipeline Prospects</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Temps Réel</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-lg shadow-emerald-200 ring-2 ring-emerald-50">
                    {totalProspects}
                  </span>
                </div>
              </div>

              {/* Status filters */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setProspectFilter('all')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 border shadow-sm",
                    prospectFilter === 'all'
                      ? "bg-gray-900 border-gray-900 text-white shadow-gray-300 scale-105"
                      : "bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5"
                  )}
                >
                  Tous ({totalProspects})
                </button>
                {PROSPECT_STATUSES.slice(0, 5).map((status) => {
                  const isActive = prospectFilter === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => setProspectFilter(status.value)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 border flex items-center gap-2 group",
                        isActive
                          ? `${status.color} border-transparent shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] scale-105 ring-2 ring-emerald-50/50`
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        isActive ? "bg-current scale-125 ring-2 ring-white/50" : "bg-gray-300 group-hover:bg-gray-400"
                      )} />
                      {status.label}
                      <span className={cn(
                        "text-[10px] opacity-60 font-medium",
                        isActive ? "text-current" : "text-gray-400"
                      )}>
                        ({prospectCounts[status.value] || 0})
                      </span>
                    </button>
                  );
                })}
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
                  className="mt-3 text-emerald-600 font-medium text-sm hover:underline"
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
                          className="font-semibold text-gray-900 hover:text-emerald-600 truncate"
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
                          <a href={`tel:${prospect.phone}`} className="flex items-center gap-1 hover:text-emerald-600">
                            <Phone className="w-3 h-3" />
                            {prospect.phone}
                          </a>
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
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-400"
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

      {/* Bottom Row: Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trial Ending */}
        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-amber-200/50 shadow-lg shadow-amber-900/5 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/10">
          <div className="absolute inset-0 border-2 border-amber-400/20 rounded-2xl animate-pulse pointer-events-none" />
          <div className="px-5 py-4 border-b border-amber-100/50 bg-gradient-to-r from-amber-50/80 to-transparent flex items-center gap-3 relative z-10">
            <div className="p-2 bg-amber-500/10 rounded-xl shadow-inner">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce [animation-duration:3s]" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 tracking-tight">Essais se terminant</h2>
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600/80">Action prioritaire requise</p>
            </div>
          </div>
          <div className="divide-y divide-amber-100/30 relative z-10">
            {trialEndingMerchants.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm font-medium italic">Aucun essai urgent pour le moment</p>
            ) : (
              trialEndingMerchants.map((merchant) => {
                const daysLeft = getDaysRemaining(merchant.trial_ends_at!);
                return (
                  <Link
                    key={merchant.id}
                    href={`/admin/merchants/${merchant.id}`}
                    className="group/item flex items-center justify-between p-4 hover:bg-amber-50/50 transition-all duration-300 ease-out active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-amber-100 flex items-center justify-center shadow-sm group-hover/item:border-amber-300 group-hover/item:shadow-md transition-all">
                        <span className="text-amber-700 font-bold text-sm">{merchant.shop_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover/item:text-amber-900 transition-colors">{merchant.shop_name}</p>
                        {merchant.shop_address && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {merchant.shop_address}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm transition-transform group-hover/item:scale-110",
                      daysLeft <= 1
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    )}>
                      {daysLeft <= 0 ? "Urgent" : `${daysLeft}j restant`}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-emerald-200/50 shadow-lg shadow-emerald-900/5 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="px-5 py-4 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/80 to-transparent flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl shadow-inner">
                <Store className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 tracking-tight">Dernières inscriptions</h2>
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/80">Croissance en temps réel</p>
              </div>
            </div>
            <Link
              href="/admin/merchants"
              className="px-3 py-1 rounded-lg text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-colors border border-emerald-100/50"
            >
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-emerald-100/30 relative z-10">
            {recentMerchants.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm font-medium italic">En attente de nouvelles inscriptions</p>
            ) : (
              recentMerchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/admin/merchants/${merchant.id}`}
                  className="group/item flex items-center justify-between p-4 hover:bg-emerald-50/50 transition-all duration-300 ease-out active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover/item:scale-110 transition-transform">
                        {merchant.shop_name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover/item:text-emerald-700 transition-colors">{merchant.shop_name}</p>
                      <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        Inscrit le {formatDate(merchant.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover/item:bg-emerald-100 group-hover/item:text-emerald-600 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))
            )}
          </div>
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 h-24 resize-none"
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
// STAT CARD COMPONENT (Optimized - no heavy charts)
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
  color: 'emerald' | 'amber' | 'indigo' | 'pink';
}) {
  const themes = {
    emerald: 'from-emerald-50/60 via-emerald-50/40 to-white/40 border-emerald-500/10 text-emerald-700 hover:shadow-emerald-500/20',
    amber: 'from-amber-50/60 via-amber-50/40 to-white/40 border-amber-500/10 text-amber-700 hover:shadow-amber-500/20',
    indigo: 'from-indigo-50/60 via-indigo-50/40 to-white/40 border-indigo-500/10 text-indigo-700 hover:shadow-indigo-500/20',
    pink: 'from-pink-50/60 via-pink-50/40 to-white/40 border-pink-500/10 text-pink-700 hover:shadow-pink-500/20',
  };

  const iconGradients = {
    emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600',
    amber: 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600',
    indigo: 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600',
    pink: 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600',
  };

  return (
    <div className={cn(
      "group relative p-5 rounded-2xl border backdrop-blur-sm bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl",
      themes[color]
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex items-center justify-center w-11 h-11 rounded-full shadow-sm ring-4 ring-white/60 transition-transform duration-500 group-hover:rotate-12",
          iconGradients[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
        </div>
      </div>
    </div>
  );
}
