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
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import type { CustomerNote } from '@/types';
import { getTypeStyle } from '@/lib/note-styles';

const FLAG_TYPES = ['allergy', 'contraindication', 'preference'] as const;
type FlagType = (typeof FLAG_TYPES)[number];

const FREE_NOTE_TYPES = ['general', 'formula', 'observation'] as const;
const ALL_NOTE_TYPES_HINTS: Set<string> = new Set([...FLAG_TYPES, ...FREE_NOTE_TYPES]);

const FLAG_LABEL_MAX = 50;

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
  const [photosOpen, setPhotosOpen] = useState(false);

  // Add free-note form
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<string>('general');
  const [newPinned, setNewPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customTypes, setCustomTypes] = useState<string[]>([]);

  // Inline flag input (per flag type)
  const [flagInput, setFlagInput] = useState<Record<FlagType, string>>({
    allergy: '',
    contraindication: '',
    preference: '',
  });
  const [flagAddOpen, setFlagAddOpen] = useState<Record<FlagType, boolean>>({
    allergy: false,
    contraindication: false,
    preference: false,
  });
  const [flagSaving, setFlagSaving] = useState<FlagType | null>(null);

  // Edit free-note state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('general');

  const flagsByType = useMemo(() => {
    const out: Record<FlagType, CustomerNote[]> = { allergy: [], contraindication: [], preference: [] };
    for (const n of notes) {
      if ((FLAG_TYPES as readonly string[]).includes(n.note_type)) {
        out[n.note_type as FlagType].push(n);
      }
    }
    return out;
  }, [notes]);

  const freeNotes = useMemo(
    () => notes.filter(n => !(FLAG_TYPES as readonly string[]).includes(n.note_type)),
    [notes],
  );
  const pinnedFree = useMemo(() => freeNotes.filter(n => n.pinned), [freeNotes]);
  const unpinnedFree = useMemo(() => freeNotes.filter(n => !n.pinned), [freeNotes]);

  const freeNoteTypes = useMemo(() => {
    const set = new Set<string>(FREE_NOTE_TYPES);
    for (const note of freeNotes) {
      if (!(FLAG_TYPES as readonly string[]).includes(note.note_type)) set.add(note.note_type);
    }
    for (const ct of customTypes) set.add(ct);
    return [...set];
  }, [freeNotes, customTypes]);

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
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [customerId, merchantId]);

  useEffect(() => {
    if (photosOpen && resultPhotos.length === 0) fetchPhotos();
  }, [photosOpen]);

  const addFlag = async (type: FlagType) => {
    const content = flagInput[type].trim();
    if (!content || flagSaving) return;
    setFlagSaving(type);
    try {
      const res = await fetch('/api/customer-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          merchant_id: merchantId,
          content: content.slice(0, FLAG_LABEL_MAX),
          note_type: type,
          pinned: type !== 'preference', // allergies + contraindications épinglées par défaut (visibilité)
        }),
      });
      if (res.ok) {
        setFlagInput(s => ({ ...s, [type]: '' }));
        setFlagAddOpen(s => ({ ...s, [type]: false }));
        onSuccess(t(`flag_${type}_added` as 'flag_allergy_added'));
        await fetchNotes();
      }
    } finally {
      setFlagSaving(null);
    }
  };

  const removeFlag = async (noteId: string, type: FlagType) => {
    try {
      const res = await fetch('/api/customer-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, merchant_id: merchantId }),
      });
      if (res.ok) {
        onSuccess(t(`flag_${type}_removed` as 'flag_allergy_removed'));
        await fetchNotes();
      }
    } catch {
      // ignore
    }
  };

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
          pinned: newPinned,
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
    if (ALL_NOTE_TYPES_HINTS.has(type)) {
      return t(`type${type.charAt(0).toUpperCase() + type.slice(1)}` as 'typeGeneral');
    }
    return type;
  };

  const renderFlagSection = (type: FlagType) => {
    const items = flagsByType[type];
    const style = getTypeStyle(type);
    const Icon = style.icon;
    const isOpen = flagAddOpen[type];

    return (
      <div key={type}>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${style.color}`}>
          <Icon className="w-3 h-3" />
          {t(`section_${type}` as 'section_allergy')}
          {items.length > 0 && <span className="text-gray-400">· {items.length}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => (
            <span
              key={item.id}
              className={`group inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border ${style.pillBg} ${style.pillText} border-current/20`}
            >
              {item.content}
              <button
                onClick={() => removeFlag(item.id, type)}
                aria-label={t('remove')}
                className="p-0.5 rounded-full hover:bg-white/60 transition-colors"
              >
                <X className="w-3 h-3 opacity-60" />
              </button>
            </span>
          ))}
          {isOpen ? (
            <form
              onSubmit={(e) => { e.preventDefault(); addFlag(type); }}
              className="inline-flex items-center gap-1"
            >
              <input
                autoFocus
                value={flagInput[type]}
                onChange={(e) => setFlagInput(s => ({ ...s, [type]: e.target.value }))}
                placeholder={t(`placeholder_${type}` as 'placeholder_allergy')}
                maxLength={FLAG_LABEL_MAX}
                onBlur={() => {
                  if (!flagInput[type].trim()) setFlagAddOpen(s => ({ ...s, [type]: false }));
                }}
                className={`text-xs px-2 py-1 rounded-full border bg-white focus:outline-none focus:ring-2 ${style.pillText} border-current/30 focus:ring-current/20 placeholder:text-gray-400 w-44`}
              />
              <button
                type="submit"
                disabled={flagSaving === type || !flagInput[type].trim()}
                className={`p-1 rounded-full ${style.pillBg} ${style.pillText} disabled:opacity-40`}
                aria-label={t('save')}
              >
                {flagSaving === type ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setFlagAddOpen(s => ({ ...s, [type]: true }))}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-dashed transition-colors hover:bg-current/5 ${style.color} border-current/30`}
            >
              <Plus className="w-3 h-3" />
              {items.length > 0 ? t('addAnother') : t(`add_${type}` as 'add_allergy')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFreeNote = (note: CustomerNote) => {
    const style = getTypeStyle(note.note_type);
    const Icon = style.icon;
    const isEditing = editingId === note.id;
    return (
      <div key={note.id} className={`border rounded-xl p-3 ${note.pinned ? style.bgColor : 'border-gray-100 bg-white'}`}>
        <div className="flex items-start gap-2">
          <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${style.color}`} />
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
                  {freeNoteTypes.map(nt => {
                    const s = getTypeStyle(nt);
                    return (
                      <button key={nt} onClick={() => setEditType(nt)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${editType === nt ? `${s.pillBg} ${s.pillText} ring-1 ring-current` : 'bg-gray-100 text-gray-400'}`}
                      >{getTypeLabel(nt)}</button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={() => handleUpdate(note.id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">{t('save')}</button>
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
                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Profil sensible — chips structurées */}
      <section className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('sensitiveProfileTitle')}</p>
          <span className="text-[10px] text-gray-400">{t('sensitiveProfileHint')}</span>
        </div>
        {renderFlagSection('allergy')}
        {renderFlagSection('contraindication')}
        {renderFlagSection('preference')}
      </section>

      {/* Pinned free notes */}
      {pinnedFree.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('pinnedSection')}</p>
          {pinnedFree.map(renderFreeNote)}
        </div>
      )}

      {/* Add free note */}
      <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          className="input text-sm h-auto resize-none w-full"
          rows={2}
          maxLength={2000}
        />
        <div className="flex flex-wrap gap-1.5">
          {freeNoteTypes.map(nt => {
            const s = getTypeStyle(nt);
            return (
              <button key={nt} onClick={() => setNewType(nt)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${newType === nt ? `${s.pillBg} ${s.pillText} ring-1 ring-current` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >{getTypeLabel(nt)}</button>
            );
          })}
          <form onSubmit={(e) => { e.preventDefault(); const tag = customTag.trim().toLowerCase(); if (tag && !FLAG_TYPES.includes(tag as FlagType)) { if (!freeNoteTypes.includes(tag)) setCustomTypes(prev => [...prev, tag]); setNewType(tag); setCustomTag(''); } }} className="inline-flex">
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
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t('addNote')}
          </button>
        </div>
      </div>

      {/* All free notes */}
      {unpinnedFree.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('allNotes')}</p>
          {unpinnedFree.map(renderFreeNote)}
        </div>
      )}

      {freeNotes.length === 0 && pinnedFree.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-2">{t('noNotes')}</p>
      )}

      {/* Result photos gallery */}
      <div>
        <button onClick={() => setPhotosOpen(p => !p)} className="flex items-center gap-2 w-full">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('resultPhotos')}</p>
          {resultPhotos.length > 0 && <span className="text-xs text-gray-400">{resultPhotos.length}</span>}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${photosOpen ? 'rotate-180' : ''}`} />
        </button>
        {photosOpen && (
          resultPhotos.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
              {resultPhotos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img src={photo.url} alt="" className="w-full aspect-square object-cover rounded-xl" />
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.slot_date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">{t('noPhotos')}</p>
          )
        )}
      </div>
    </div>
  );
}
