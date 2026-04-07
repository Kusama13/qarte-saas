'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Plus,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Users,
  UserCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';

// --- Types ---

interface AffiliateMerchant {
  id: string;
  shopName: string;
  status: string;
  createdAt: string;
  trialEndsAt: string | null;
}

interface AffiliateLink {
  id: string;
  name: string;
  slug: string;
  commission_percent: number;
  notes: string | null;
  active: boolean;
  created_at: string;
  stats: {
    total: number;
    trialing: number;
    active: number;
    canceled: number;
    expired: number;
  };
  merchants: AffiliateMerchant[];
}

// --- Helpers ---

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Abonne', className: 'bg-emerald-100 text-emerald-700' },
    trial: { label: 'Essai', className: 'bg-amber-100 text-amber-700' },
    canceled: { label: 'Annule', className: 'bg-red-100 text-red-700' },
    canceling: { label: 'En cours', className: 'bg-orange-100 text-orange-700' },
    past_due: { label: 'Impaye', className: 'bg-red-100 text-red-600' },
  };
  const b = map[status] || { label: status, className: 'bg-gray-100 text-gray-500' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b.className}`}>{b.label}</span>;
}

// --- Component ---

export default function AffiliationPage() {
  const supabase = getSupabase();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCommission, setFormCommission] = useState(20);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/affiliation', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Failed to fetch affiliate links:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const openCreate = () => {
    setEditingLink(null);
    setFormName('');
    setFormSlug('');
    setFormCommission(20);
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (link: AffiliateLink) => {
    setEditingLink(link);
    setFormName(link.name);
    setFormSlug(link.slug);
    setFormCommission(link.commission_percent);
    setFormNotes(link.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingLink) {
      setFormSlug(generateSlug(name).slice(0, 50));
    }
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      setFormError('Nom et slug requis');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(formSlug)) {
      setFormError('Slug invalide (lettres minuscules, chiffres, tirets)');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingLink
        ? `/api/admin/affiliation/${editingLink.id}`
        : '/api/admin/affiliation';

      const res = await fetch(url, {
        method: editingLink ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formName.trim(),
          ...(!editingLink && { slug: formSlug.trim() }),
          commission_percent: formCommission,
          notes: formNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Erreur');
        return;
      }

      setShowModal(false);
      await fetchLinks();
    } catch {
      setFormError('Erreur reseau');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (link: AffiliateLink) => {
    if (!confirm(`Supprimer le lien "${link.name}" ?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/admin/affiliation/${link.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      await fetchLinks();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleToggleActive = async (link: AffiliateLink) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/admin/affiliation/${link.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ active: !link.active }),
      });
      await fetchLinks();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const copyLink = (slug: string, id: string, type: 'signup' | 'home' = 'signup') => {
    const url = type === 'home'
      ? `https://getqarte.com/?ref=${slug}`
      : `https://getqarte.com/auth/merchant/signup?ref=${slug}`;
    const copyKey = `${id}_${type}`;
    navigator.clipboard.writeText(url);
    setCopiedId(copyKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Affiliation</h1>
          <p className="text-sm text-gray-500 mt-1">Liens partenaires et suivi des commissions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5167fc] text-white font-semibold text-sm rounded-xl hover:bg-[#4358e0] transition-colors shadow-md shadow-[#5167fc]/20"
        >
          <Plus className="w-4 h-4" />
          Nouveau lien
        </button>
      </div>

      {/* Links list */}
      {links.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="p-4 rounded-2xl bg-gray-50 inline-block mb-4">
            <Link2 className="w-10 h-10 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-900">Aucun lien d&apos;affiliation</p>
          <p className="text-sm text-gray-500 mt-1">Cree ton premier lien pour commencer a suivre les inscriptions partenaires.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link) => {
            const isExpanded = expandedId === link.id;
            const fullUrl = `https://getqarte.com/auth/merchant/signup?ref=${link.slug}`;

            return (
              <div
                key={link.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  link.active ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#5167fc]/10">
                        <Link2 className="w-5 h-5 text-[#5167fc]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{link.name}</h3>
                        <span className="text-xs font-semibold text-[#5167fc] bg-[#5167fc]/10 px-2 py-0.5 rounded-full">
                          {link.commission_percent}% commission
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(link)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(link)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          link.active
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {link.active ? 'Actif' : 'Inactif'}
                      </button>
                      <button
                        onClick={() => handleDelete(link)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Link URLs */}
                  <div className="space-y-2 mb-4">
                    {/* Signup link */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase w-12 shrink-0">Signup</span>
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono truncate">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{fullUrl}</span>
                      </div>
                      <button
                        onClick={() => copyLink(link.slug, link.id, 'signup')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                          copiedId === `${link.id}_signup`
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copiedId === `${link.id}_signup` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {/* Home link */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase w-12 shrink-0">Home</span>
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono truncate">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{`https://getqarte.com/?ref=${link.slug}`}</span>
                      </div>
                      <button
                        onClick={() => copyLink(link.slug, link.id, 'home')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                          copiedId === `${link.id}_home`
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copiedId === `${link.id}_home` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-lg font-bold text-gray-900">{link.stats.total}</p>
                        <p className="text-[11px] text-gray-500">Inscrits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-lg font-bold text-emerald-700">{link.stats.active}</p>
                        <p className="text-[11px] text-emerald-600">Abonnes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-lg font-bold text-amber-700">{link.stats.trialing}</p>
                        <p className="text-[11px] text-amber-600">En essai</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-lg font-bold text-red-600">{link.stats.canceled + link.stats.expired}</p>
                        <p className="text-[11px] text-red-500">Perdus</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {link.notes && (
                    <p className="text-xs text-gray-400 italic mb-3">{link.notes}</p>
                  )}

                  {/* Expand toggle */}
                  {link.stats.total > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : link.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#5167fc] hover:text-[#4358e0] transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Masquer' : `Voir les ${link.stats.total} inscrits`}
                    </button>
                  )}
                </div>

                {/* Expanded merchants list */}
                {isExpanded && link.merchants.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <div className="space-y-2">
                      {link.merchants.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50/80">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5167fc] to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                              {m.shopName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{m.shopName || 'Sans nom'}</p>
                              <p className="text-[11px] text-gray-400">
                                {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          {statusBadge(m.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingLink ? 'Modifier le lien' : 'Nouveau lien d\'affiliation'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nom du partenaire
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Sophie Instagram"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5167fc]/30 focus:border-[#5167fc]"
                  maxLength={100}
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Slug (dans l&apos;URL)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">?ref=</span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="sophie-insta"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5167fc]/30 focus:border-[#5167fc]"
                    maxLength={50}
                    disabled={!!editingLink}
                  />
                </div>
              </div>

              {/* Commission */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Commission (%)
                </label>
                <input
                  type="number"
                  value={formCommission}
                  onChange={(e) => setFormCommission(Math.max(0, Math.min(100, Number(e.target.value))))}
                  min={0}
                  max={100}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5167fc]/30 focus:border-[#5167fc]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notes <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes internes..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5167fc]/30 focus:border-[#5167fc]"
                  maxLength={500}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 font-medium">{formError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#5167fc] text-white font-semibold hover:bg-[#4358e0] transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingLink ? 'Enregistrer' : 'Creer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
