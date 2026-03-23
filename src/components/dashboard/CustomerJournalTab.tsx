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
} from 'lucide-react';
import type { CustomerNote } from '@/types';
import { getTypeStyle } from '@/lib/note-styles';

const BUILTIN_TYPES = ['general', 'allergy', 'preference', 'formula', 'observation'] as const;

interface CustomerJournalTabProps {
  customerId: string;
  merchantId: string;
  onSuccess: (message: string) => void;
}

export function CustomerJournalTab({ customerId, merchantId, onSuccess }: CustomerJournalTabProps) {
  const t = useTranslations('customerJournal');

  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultPhotos, setResultPhotos] = useState<Array<{ url: string; slot_date: string }>>([]);
  const [photosOpen, setPhotosOpen] = useState(false);

  // Add note form
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('general');
  const [newPinned, setNewPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('general');

  const pinnedNotes = useMemo(() => notes.filter(n => n.pinned), [notes]);
  const unpinnedNotes = useMemo(() => notes.filter(n => !n.pinned), [notes]);

  const [customTypes, setCustomTypes] = useState<string[]>([]);

  // All available type pills: builtin + custom tags from existing notes + session customs
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
    } catch {
      // ignore
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

  // Lazy-load photos only when section is opened
  useEffect(() => {
    if (photosOpen && resultPhotos.length === 0) fetchPhotos();
  }, [photosOpen]);

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
    } catch {
      // ignore
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
        body: JSON.stringify({
          note_id: noteId,
          merchant_id: merchantId,
          content: editContent,
          note_type: editType,
        }),
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
        body: JSON.stringify({
          note_id: note.id,
          merchant_id: merchantId,
          pinned: !note.pinned,
        }),
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

  const locale = useLocale();
  const formatNoteDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const placeholder = t('contentPlaceholder');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const I18N_TYPES: Set<string> = new Set(BUILTIN_TYPES);
  const getTypeLabel = (type: string) => {
    if (I18N_TYPES.has(type)) {
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
              <button
                onClick={() => handleTogglePin(note)}
                className="p-1 rounded hover:bg-gray-100"
                title={note.pinned ? t('unpin') : t('pin')}
              >
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
    <div className="space-y-4">
      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('pinnedSection')}</p>
          {pinnedNotes.map(renderNote)}
        </div>
      )}

      {/* Add note form */}
      <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={placeholder}
          className="input text-sm h-auto resize-none w-full"
          rows={2}
          maxLength={2000}
        />
        {/* Type pills */}
        <div className="flex flex-wrap gap-1.5">
          {allTypes.map(nt => {
            const s = getTypeStyle(nt);
            return (
              <button key={nt} onClick={() => setNewType(nt)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${newType === nt ? `${s.pillBg} ${s.pillText} ring-1 ring-current` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >{getTypeLabel(nt)}</button>
            );
          })}
          {/* Custom tag input */}
          <form onSubmit={(e) => { e.preventDefault(); const tag = customTag.trim().toLowerCase(); if (tag) { if (!allTypes.includes(tag)) setCustomTypes(prev => [...prev, tag]); setNewType(tag); setCustomTag(''); } }} className="inline-flex">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="+ tag"
              className="text-[10px] w-16 px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-500 focus:outline-none focus:border-teal-400 placeholder:text-gray-300"
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
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t('addNote')}
          </button>
        </div>
      </div>

      {/* All notes */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('allNotes')}</p>
          {unpinnedNotes.map(renderNote)}
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">{t('noNotes')}</p>
      )}

      {/* Result photos gallery (lazy-loaded on open) */}
      <div>
        <button
          onClick={() => setPhotosOpen(p => !p)}
          className="flex items-center gap-2 w-full"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('resultPhotos')}</p>
          {resultPhotos.length > 0 && <span className="text-xs text-gray-400">{resultPhotos.length}</span>}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${photosOpen ? 'rotate-180' : ''}`} />
        </button>
        {photosOpen && (
          resultPhotos.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
              {resultPhotos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full aspect-square object-cover rounded-xl"
                  />
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
