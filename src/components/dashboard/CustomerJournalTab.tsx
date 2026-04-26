'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Pin,
  PinOff,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { CustomerNote } from '@/types';
import { getTypeStyle } from '@/lib/note-styles';
import { ROLES } from '@/lib/customer-modal-styles';

const BUILTIN_TYPES = ['allergy', 'contraindication', 'preference', 'formula', 'observation', 'general'] as const;
const ALL_BUILTIN_HINTS: Set<string> = new Set(BUILTIN_TYPES);

interface CustomerJournalTabProps {
  customerId: string;
  merchantId: string;
  onSuccess: (message: string) => void;
}

export function CustomerJournalTab({ customerId, merchantId, onSuccess }: CustomerJournalTabProps) {
  const t = useTranslations('customerJournal');
  const locale = useLocale();

  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultPhotos, setResultPhotos] = useState<Array<{ url: string; slot_date: string }>>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);

  // Add note form
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<string>('general');
  const [newPinned, setNewPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customTypes, setCustomTypes] = useState<string[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('general');

  const pinnedNotes = useMemo(() => notes.filter(n => n.pinned), [notes]);
  const unpinnedNotes = useMemo(() => notes.filter(n => !n.pinned), [notes]);

  // Liste des types disponibles (builtin + custom existants)
  const allTypes = useMemo(() => {
    const set = new Set<string>(BUILTIN_TYPES);
    for (const note of notes) set.add(note.note_type);
    for (const ct of customTypes) set.add(ct);
    return [...set];
  }, [notes, customTypes]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/customer-notes?customerId=${customerId}&merchantId=${merchantId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/planning?merchantId=${merchantId}&customerId=${customerId}&booked=true`);
      if (res.ok) {
        const data = await res.json();
        const photos: Array<{ url: string; slot_date: string }> = [];
        for (const slot of data.slots || []) {
          for (const photo of slot.planning_slot_result_photos || []) {
            photos.push({ url: photo.url, slot_date: slot.slot_date });
          }
        }
        setResultPhotos(photos);
      }
    } finally {
      setPhotosLoaded(true);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchPhotos();
  }, [customerId, merchantId]);

  const handleAdd = async () => {
    if (!newContent.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/customer-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          merchant_id: merchantId,
          content: newContent,
          note_type: newType,
          // Allergies + contre-indications épinglées par défaut (visibilité critique)
          pinned: newPinned || newType === 'allergy' || newType === 'contraindication',
        }),
      });
      if (res.ok) {
        setNewContent('');
        setNewType('general');
        setNewPinned(false);
        onSuccess(t('noteAdded'));
        await fetchNotes();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch('/api/customer-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, merchant_id: merchantId, content: editContent, note_type: editType }),
      });
      if (res.ok) {
        setEditingId(null);
        onSuccess(t('noteUpdated'));
        await fetchNotes();
      }
    } catch {
      // ignore
    }
  };

  const handleTogglePin = async (note: CustomerNote) => {
    try {
      await fetch('/api/customer-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: note.id, merchant_id: merchantId, pinned: !note.pinned }),
      });
      await fetchNotes();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch('/api/customer-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, merchant_id: merchantId }),
      });
      if (res.ok) {
        onSuccess(t('noteDeleted'));
        await fetchNotes();
      }
    } catch {
      // ignore
    }
  };

  const formatNoteDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    if (ALL_BUILTIN_HINTS.has(type)) {
      return t(`type${type.charAt(0).toUpperCase() + type.slice(1)}` as 'typeGeneral');
    }
    return type;
  };

  const renderNote = (note: CustomerNote) => {
    const style = getTypeStyle(note.note_type);
    const Icon = style.icon;
    const isEditing = editingId === note.id;

    return (
      <div key={note.id} className={`border rounded-xl p-3 ${note.pinned ? style.bgColor : 'border-gray-100 bg-white'}`}>
        <div className="flex items-start gap-2.5">
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
                {getTypeLabel(note.note_type)}
              </span>
              {note.pinned && <Pin className="w-3 h-3 text-amber-500" />}
              <span className="text-[10px] text-gray-400 ml-auto">{formatNoteDate(note.created_at)}</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="input text-sm h-auto resize-none w-full"
                  rows={2}
                  maxLength={2000}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allTypes.map(nt => {
                    const s = getTypeStyle(nt);
                    return (
                      <button key={nt} onClick={() => setEditType(nt)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${editType === nt ? `${s.pillBg} ${s.pillText} ring-1 ring-current` : 'bg-gray-100 text-gray-400'}`}
                      >{getTypeLabel(nt)}</button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={() => handleUpdate(note.id)} className={`text-xs font-semibold ${ROLES.success.text} hover:opacity-80`}>{t('save')}</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">{t('cancel')}</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => handleTogglePin(note)} className="p-1 rounded hover:bg-gray-100" title={note.pinned ? t('unpin') : t('pin')}>
                {note.pinned ? <PinOff className="w-3.5 h-3.5 text-gray-400" /> : <Pin className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              <button
                onClick={() => { setEditingId(note.id); setEditContent(note.content); setEditType(note.note_type); }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => { if (confirm(t('deleteConfirm'))) handleDelete(note.id); }}
                className="p-1 rounded hover:bg-red-50"
              >
                <Trash2 className={`w-3.5 h-3.5 text-gray-400 hover:${ROLES.danger.icon}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Hint adapté au type sélectionné (placeholder du textarea)
  const placeholderForType = (type: string): string => {
    if (type === 'allergy') return t('placeholder_allergy');
    if (type === 'contraindication') return t('placeholder_contraindication');
    if (type === 'preference') return t('placeholder_preference');
    return t('contentPlaceholder');
  };

  return (
    <div className="space-y-4">
      {/* ── Add note form (en haut, action principale) ── */}
      <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2.5">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={placeholderForType(newType)}
          className="input text-sm h-auto resize-none w-full"
          rows={2}
          maxLength={2000}
        />
        {/* Palette colorée des types */}
        <div className="flex flex-wrap gap-1.5">
          {allTypes.map(nt => {
            const s = getTypeStyle(nt);
            const active = newType === nt;
            return (
              <button
                key={nt}
                onClick={() => setNewType(nt)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                  active
                    ? `${s.pillBg} ${s.pillText} ring-1 ring-current`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {getTypeLabel(nt)}
              </button>
            );
          })}
          {/* Custom tag input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const tag = customTag.trim().toLowerCase();
              if (tag && !allTypes.includes(tag)) {
                setCustomTypes(prev => [...prev, tag]);
                setNewType(tag);
                setCustomTag('');
              }
            }}
            className="inline-flex"
          >
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder={t('customTagPlaceholder')}
              className="text-[10px] w-20 px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-500 focus:outline-none focus:border-teal-400 placeholder:text-gray-300"
              maxLength={30}
            />
          </form>
        </div>
        {/* Actions row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewPinned(p => !p)}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${newPinned ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-gray-200 text-gray-400'}`}
            title={newPinned ? t('unpin') : t('pin')}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleAdd}
            disabled={!newContent.trim() || saving}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 ${ROLES.primary.solid} text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shrink-0`}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t('addNote')}
          </button>
        </div>
      </div>

      {/* ── Notes pinned (allergies/contre-indic auto-pinned + manuel) ── */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className={`w-1 h-3 rounded-full ${ROLES.warning.bar}`} />
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{t('pinnedSection')}</p>
            <span className={`text-[10px] font-bold ${ROLES.warning.text} ${ROLES.warning.bg} px-1.5 py-0.5 rounded-full`}>{pinnedNotes.length}</span>
          </div>
          {pinnedNotes.map(renderNote)}
        </div>
      )}

      {/* ── Toutes les autres notes ── */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className={`w-1 h-3 rounded-full ${ROLES.neutral.bar}`} />
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{t('allNotes')}</p>
          </div>
          {unpinnedNotes.map(renderNote)}
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-2">{t('noNotes')}</p>
      )}

      {/* ── Photos résultats — toujours visibles (pas d'accordéon) si présentes ── */}
      {photosLoaded && resultPhotos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 px-1">
            <span className={`w-1 h-3 rounded-full ${ROLES.premium.bar}`} />
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{t('resultPhotos')}</p>
            <span className={`text-[10px] font-bold ${ROLES.premium.text} ${ROLES.premium.bg} px-1.5 py-0.5 rounded-full`}>{resultPhotos.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {resultPhotos.map((photo, i) => (
              <div key={i} className="relative group">
                <img
                  src={photo.url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-xl border border-gray-100"
                />
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.slot_date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
