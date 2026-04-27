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
import { getTypeStyle, NOTE_TYPES, NOTE_TYPE_GENERAL, isCriticalNoteType } from '@/lib/note-styles';
import { ROLES } from '@/lib/customer-modal-styles';
import { SectionHeader } from './customer-modal/SectionHeader';

const BUILTIN_TYPE_SET: Set<string> = new Set(NOTE_TYPES);

interface CustomerJournalTabProps {
  customerId: string;
  merchantId: string;
  /** Owned by the parent modal so the allergies banner stays in sync without a duplicate fetch. */
  notes: CustomerNote[];
  refetchNotes: () => Promise<void>;
  onSuccess: (message: string) => void;
}

export function CustomerJournalTab({ customerId, merchantId, notes, refetchNotes, onSuccess }: CustomerJournalTabProps) {
  const t = useTranslations('customerJournal');
  const locale = useLocale();

  const [resultPhotos, setResultPhotos] = useState<Array<{ url: string; slot_date: string }>>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);

  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<string>(NOTE_TYPE_GENERAL);
  const [newPinned, setNewPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customTypes, setCustomTypes] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<string>(NOTE_TYPE_GENERAL);

  const pinnedNotes = useMemo(() => notes.filter(n => n.pinned), [notes]);
  const unpinnedNotes = useMemo(() => notes.filter(n => !n.pinned), [notes]);

  // Liste des types disponibles (builtin + custom existants)
  const allTypes = useMemo(() => {
    const set = new Set<string>(NOTE_TYPES);
    for (const note of notes) set.add(note.note_type);
    for (const ct of customTypes) set.add(ct);
    return [...set];
  }, [notes, customTypes]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/planning?merchantId=${merchantId}&customerId=${customerId}&booked=true`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (controller.signal.aborted) return;
        const photos: Array<{ url: string; slot_date: string }> = [];
        for (const slot of data.slots || []) {
          for (const photo of slot.planning_slot_result_photos || []) {
            photos.push({ url: photo.url, slot_date: slot.slot_date });
          }
        }
        setResultPhotos(photos);
      } catch {
        // ignore (abort or network)
      } finally {
        if (!controller.signal.aborted) setPhotosLoaded(true);
      }
    })();
    return () => controller.abort();
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
          // Critical types (allergy, contraindication) auto-pinned: medical risk must always be visible.
          pinned: newPinned || isCriticalNoteType(newType),
        }),
      });
      if (res.ok) {
        setNewContent('');
        setNewType(NOTE_TYPE_GENERAL);
        setNewPinned(false);
        onSuccess(t('noteAdded'));
        await refetchNotes();
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
        await refetchNotes();
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
      await refetchNotes();
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
        await refetchNotes();
      }
    } catch {
      // ignore
    }
  };

  const formatNoteDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    if (BUILTIN_TYPE_SET.has(type)) {
      return t(`type${type.charAt(0).toUpperCase() + type.slice(1)}` as 'typeGeneral');
    }
    return type;
  };

  const renderNote = (note: CustomerNote) => {
    const style = getTypeStyle(note.note_type);
    const Icon = style.icon;
    const isEditing = editingId === note.id;

    return (
      <div key={note.id} className={`border rounded-xl p-3.5 sm:p-4 ${note.pinned ? style.bgColor : 'border-gray-100 bg-white'}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${style.color}`}>
                {getTypeLabel(note.note_type)}
              </span>
              {note.pinned && <Pin className="w-3 h-3 text-amber-500" />}
              <span className="text-[11px] text-gray-400 ml-auto">{formatNoteDate(note.created_at)}</span>
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
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
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
                <Trash2 className={`w-3.5 h-3.5 text-gray-400 ${ROLES.danger.hoverIcon}`} />
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
    <div className="space-y-5 sm:space-y-6">
      <div className="border border-dashed border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={placeholderForType(newType)}
          className="input text-sm sm:text-base h-auto resize-none w-full"
          rows={3}
          maxLength={2000}
        />
        <div className="flex flex-wrap gap-2">
          {allTypes.map(nt => {
            const s = getTypeStyle(nt);
            const active = newType === nt;
            return (
              <button
                key={nt}
                onClick={() => setNewType(nt)}
                className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                  active
                    ? `${s.pillBg} ${s.pillText} ring-1 ring-current`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {getTypeLabel(nt)}
              </button>
            );
          })}
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

      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <SectionHeader role="warning" label={t('pinnedSection')} count={pinnedNotes.length} />
          {pinnedNotes.map(renderNote)}
        </div>
      )}

      {unpinnedNotes.length > 0 && (
        <div className="space-y-2">
          <SectionHeader role="neutral" label={t('allNotes')} />
          {unpinnedNotes.map(renderNote)}
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-2">{t('noNotes')}</p>
      )}

      {photosLoaded && resultPhotos.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <SectionHeader role="premium" label={t('resultPhotos')} count={resultPhotos.length} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {resultPhotos.map((photo, i) => (
              <div key={i} className="relative group">
                <img
                  src={photo.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-square object-cover rounded-xl border border-gray-100 shadow-sm"
                />
                <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
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
