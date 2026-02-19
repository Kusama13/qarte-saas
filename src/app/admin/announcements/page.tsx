'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Eye,
  EyeOff,
  X,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  target_filter: 'all' | 'trial' | 'active' | 'pwa_installed';
  created_at: string;
  published_at: string | null;
  duration_days: number | null;
  expires_at: string | null;
  is_published: boolean;
  dismissal_count: number;
}

// ── Config ──

const TYPE_CONFIG = {
  info: { icon: Info, label: 'Info', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  warning: { icon: AlertTriangle, label: 'Attention', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  success: { icon: CheckCircle, label: 'Succès', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  urgent: { icon: AlertOctagon, label: 'Urgent', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
};

const TARGET_LABELS: Record<string, string> = {
  all: 'Tous',
  trial: 'En essai',
  active: 'Abonnés actifs',
  pwa_installed: 'PWA installée',
  admin: 'Admin (test)',
};

const DURATION_OPTIONS = [
  { value: 1, label: '1 jour' },
  { value: 3, label: '3 jours' },
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
  { value: 0, label: 'Illimité' },
];

function getStatus(a: Announcement): 'draft' | 'active' | 'expired' | 'disabled' {
  if (!a.is_published && !a.published_at) return 'draft';
  if (!a.is_published && a.published_at) return 'disabled';
  if (a.is_published && a.expires_at && new Date(a.expires_at) < new Date()) return 'expired';
  return 'active';
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  expired: { label: 'Expirée', className: 'bg-amber-100 text-amber-700' },
  disabled: { label: 'Désactivée', className: 'bg-gray-100 text-gray-500' },
};

// ── Component ──

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<Announcement['type']>('info');
  const [targetFilter, setTargetFilter] = useState<Announcement['target_filter']>('all');
  const [durationDays, setDurationDays] = useState<number>(7);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {
      setError('Impossible de charger les annonces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          target_filter: targetFilter,
          duration_days: durationDays === 0 ? null : durationDays,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création');
      }
      // Reset form
      setTitle('');
      setBody('');
      setType('info');
      setTargetFilter('all');
      setDurationDays(7);
      setShowForm(false);
      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: announcement.id,
          is_published: !announcement.is_published,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur mise à jour');
      }
      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur suppression');
      }
      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#5167fc] animate-spin" />
      </div>
    );
  }

  const activeCount = announcements.filter((a) => getStatus(a) === 'active').length;
  const draftCount = announcements.filter((a) => getStatus(a) === 'draft').length;

  return (
    <div className="max-w-4xl mx-auto pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#5167fc]" />
            Annonces
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active{activeCount > 1 ? 's' : ''} · {draftCount} brouillon{draftCount > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all',
            showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-[#5167fc] text-white hover:bg-[#4058e8] shadow-md shadow-[#5167fc]/20'
          )}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Annuler' : 'Nouvelle annonce'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Créer une annonce</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nouvelle fonctionnalité disponible"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5167fc]/20 focus:border-[#5167fc]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Décrivez votre annonce..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5167fc]/20 focus:border-[#5167fc] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(TYPE_CONFIG) as Announcement['type'][]).map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          type === t
                            ? `${cfg.badge} ${cfg.border} ring-2 ring-offset-1 ring-current/20`
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cible</label>
                <select
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value as Announcement['target_filter'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5167fc]/20 focus:border-[#5167fc]"
                >
                  <option value="all">Tous les merchants</option>
                  <option value="trial">En essai</option>
                  <option value="active">Abonnés actifs</option>
                  <option value="pwa_installed">PWA installée</option>
                  <option value="admin">Admin (test)</option>
                </select>
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5167fc]/20 focus:border-[#5167fc]"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !title.trim() || !body.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#5167fc] text-white text-sm font-semibold rounded-xl hover:bg-[#4058e8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#5167fc]/20"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune annonce</p>
          <p className="text-sm mt-1">Créez votre première annonce pour communiquer avec vos merchants</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const status = getStatus(a);
            const statusCfg = STATUS_CONFIG[status];
            const typeCfg = TYPE_CONFIG[a.type];
            const TypeIcon = typeCfg.icon;

            return (
              <div
                key={a.id}
                className={cn(
                  'bg-white border rounded-2xl p-4 transition-all hover:shadow-sm',
                  a.is_published ? typeCfg.border : 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', typeCfg.bg)}>
                    <TypeIcon className={cn('w-4.5 h-4.5', typeCfg.text)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                      <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full', statusCfg.className)}>
                        {statusCfg.label}
                      </span>
                      <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full', typeCfg.badge)}>
                        {typeCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Cible : {TARGET_LABELS[a.target_filter]}</span>
                      <span>·</span>
                      <span>
                        Durée : {a.duration_days ? `${a.duration_days}j` : 'Illimitée'}
                      </span>
                      {a.published_at && (
                        <>
                          <span>·</span>
                          <span>
                            Publiée le {new Date(a.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </>
                      )}
                      {a.expires_at && (
                        <>
                          <span>·</span>
                          <span>
                            Expire le {new Date(a.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </>
                      )}
                      {a.dismissal_count > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />
                            {a.dismissal_count} dismiss
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(a)}
                      disabled={saving}
                      title={a.is_published ? 'Désactiver' : 'Publier'}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        a.is_published
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-green-600 hover:bg-green-50'
                      )}
                    >
                      {a.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {!a.is_published && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={saving}
                        title="Supprimer"
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
