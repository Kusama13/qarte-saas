'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, Trash2, Check, Loader2, AlertTriangle, Clock, ImagePlus, Instagram, History, BookOpen, ChevronDown, Camera, StickyNote, CalendarClock, MessageSquare } from 'lucide-react';
import { getTypeStyle } from '@/lib/note-styles';
import { TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { useTranslations } from 'next-intl';
import type { PlanningSlot, CustomerSearchResult } from '@/types';
import { formatTime, formatCurrency, toBCP47 } from '@/lib/utils';
import { compressOfferImage } from '@/lib/image-compression';
import { timeToMinutes, minutesToTime, roundUp5, formatDuration, getSlotServiceIds, colorBorderStyle, computeDepositAmount } from './utils';
import type { BookingDraft, ServiceWithDuration } from './usePlanningState';

interface BookingDetailsModalProps {
  slot: PlanningSlot;
  customer: CustomerSearchResult | null;
  draft: BookingDraft;
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  slotsByDate: Map<string, PlanningSlot[]>;
  merchantId: string;
  merchantCountry: string;
  saving: boolean;
  locale: string;
  depositPercent?: number | null;
  depositAmount?: number | null;
  subscriptionStatus?: string | null;
  onDraftChange: (partial: Partial<BookingDraft>) => void;
  onSave: (slotId: string, data: {
    client_name: string | null;
    client_phone: string | null;
    customer_id: string | null;
    service_ids: string[];
    notes: string | null;
    send_sms?: boolean;
    send_sms_cancel?: boolean;
  }) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
  onShiftSlot: (slotId: string, newTime: string, newDate?: string, force?: boolean, sendSms?: boolean) => Promise<{ success: boolean; error?: string }>;
  onRefreshSlots: () => Promise<void>;
  onConfirmDeposit?: (slot: PlanningSlot) => void;
  onCancelDeposit?: (slot: PlanningSlot) => void;
  onGoBack: () => void;
  onClose: () => void;
  onFetchClientHistory: (customerId: string) => Promise<PlanningSlot[]>;
}

export default function BookingDetailsModal({
  slot,
  customer,
  draft,
  services,
  serviceColorMap,
  slotsByDate,
  merchantId,
  merchantCountry,
  saving,
  locale,
  depositPercent,
  depositAmount: depositFixed,
  subscriptionStatus,
  onDraftChange,
  onSave,
  onDelete,
  onShiftSlot,
  onRefreshSlots,
  onConfirmDeposit,
  onCancelDeposit,
  onGoBack,
  onClose,
  onFetchClientHistory,
}: BookingDetailsModalProps) {
  const t = useTranslations('planning');
  const [showPhotos, setShowPhotos] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [localPhotos, setLocalPhotos] = useState(slot.planning_slot_photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result photos state
  const [localResultPhotos, setLocalResultPhotos] = useState(slot.planning_slot_result_photos || []);
  const [uploadingResultPhoto, setUploadingResultPhoto] = useState(false);
  const [resultPhotoSuccess, setResultPhotoSuccess] = useState(false);
  const resultFileInputRef = useRef<HTMLInputElement>(null);

  // Client history
  const [clientHistory, setClientHistory] = useState<PlanningSlot[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const historyFetchedFor = useRef<string | null>(null);

  // Client memo (pinned notes)
  const [pinnedNotes, setPinnedNotes] = useState<Array<{ id: string; content: string; note_type: string }>>([]);
  const pinnedFetchedFor = useRef<string | null>(null);

  const isPaid = subscriptionStatus === 'active' || subscriptionStatus === 'canceling' || subscriptionStatus === 'past_due';
  const [sendSms, setSendSms] = useState(false);

  const [showAllServices, setShowAllServices] = useState(false);
  const [moveSendSms, setMoveSendSms] = useState(false);
  const [cancelSendSms, setCancelSendSms] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [moveDate, setMoveDate] = useState(slot.slot_date);
  const [moveTime, setMoveTime] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  // Fetch client history when toggled
  useEffect(() => {
    if (showHistory && draft.customerId && historyFetchedFor.current !== draft.customerId) {
      historyFetchedFor.current = draft.customerId;
      setHistoryLoading(true);
      onFetchClientHistory(draft.customerId).then(slots => {
        setClientHistory(slots.filter(s => s.id !== slot.id).sort((a, b) =>
          b.slot_date.localeCompare(a.slot_date) || b.start_time.localeCompare(a.start_time)
        ).slice(0, 10));
      }).catch(() => {}).finally(() => setHistoryLoading(false));
    }
  }, [showHistory, draft.customerId, slot.id, onFetchClientHistory]);

  // Fetch pinned notes for client memo
  useEffect(() => {
    if (draft.customerId && pinnedFetchedFor.current !== draft.customerId) {
      pinnedFetchedFor.current = draft.customerId;
      fetch(`/api/customer-notes?customerId=${draft.customerId}&merchantId=${merchantId}&pinned=true`)
        .then(r => r.ok ? r.json() : { notes: [] })
        .then(data => setPinnedNotes(data.notes || []))
        .catch(() => {});
    }
  }, [draft.customerId, merchantId]);

  // Service map for history display
  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceWithDuration>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  // Compute total duration + price in a single pass using serviceMap (O(1) lookups)
  const { totalMinutes, totalPrice } = useMemo(() => {
    let durationTotal = 0;
    let hasUnknown = false;
    let priceTotal = 0;
    for (const sid of draft.serviceIds) {
      const svc = serviceMap.get(sid);
      if (svc?.duration) durationTotal += svc.duration;
      else hasUnknown = true;
      if (svc?.price) priceTotal += svc.price;
    }
    return {
      totalMinutes: { total: durationTotal, hasUnknown },
      totalPrice: draft.serviceIds.length > 0 && priceTotal > 0 ? priceTotal : null,
    };
  }, [draft.serviceIds, serviceMap]);

  // Format duration
  const durationLabel = useMemo(() => {
    if (draft.serviceIds.length === 0) return null;
    if (totalMinutes.total === 0 && totalMinutes.hasUnknown) return t('durationUnknown');
    return t('totalDuration', { duration: formatDuration(totalMinutes.total) });
  }, [draft.serviceIds.length, totalMinutes, t]);

  // Overlap detection — skip filler slots belonging to same booking
  const overlap = useMemo(() => {
    if (draft.serviceIds.length === 0 || totalMinutes.total === 0) return null;
    const daySlots = slotsByDate.get(slot.slot_date) || [];
    const slotIndex = daySlots.findIndex(s => s.id === slot.id);
    if (slotIndex === -1) return null;

    const startMins = timeToMinutes(slot.start_time);
    const endMins = startMins + totalMinutes.total;

    // Find the next slot that is NOT a filler of this booking
    let nextSlot: PlanningSlot | null = null;
    for (let i = slotIndex + 1; i < daySlots.length; i++) {
      const candidate = daySlots[i];
      if (candidate.primary_slot_id !== slot.id) {
        nextSlot = candidate;
        break;
      }
    }
    if (!nextSlot) return null;

    const nextMins = timeToMinutes(nextSlot.start_time);
    if (endMins > nextMins) {
      const suggestedTime = minutesToTime(roundUp5(endMins));
      return { nextSlot, endTime: minutesToTime(endMins), suggestedTime };
    }
    return null;
  }, [draft.serviceIds, totalMinutes.total, slotsByDate, slot]);

  const toggleService = (serviceId: string) => {
    const current = draft.serviceIds;
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    onDraftChange({ serviceIds: updated });
  };

  const handleSave = () => {
    onSave(slot.id, {
      client_name: draft.clientName.trim() || null,
      client_phone: draft.clientPhone.trim() || null,
      customer_id: draft.customerId,
      service_ids: draft.serviceIds,
      notes: draft.notes.trim() || null,
      ...(draft.phoneCountry && { phone_country: draft.phoneCountry }),
      ...(sendSms && { send_sms: true }),
    });
  };

  const handleClearSlot = () => {
    onSave(slot.id, {
      client_name: null,
      client_phone: null,
      customer_id: null,
      service_ids: [],
      notes: null,
      ...(cancelSendSms && { send_sms_cancel: true }),
    });
  };

  const moveDateFreeSlots = useMemo(() => {
    if (!moveMode) return [];
    const daySlots = slotsByDate.get(moveDate) || [];
    return daySlots
      .filter(s => s.id !== slot.id && !s.client_name && !s.primary_slot_id)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [moveMode, moveDate, slotsByDate, slot.id]);

  const handleMoveConfirm = async () => {
    if (!moveTime) {
      setMoveError(t('moveSelectTime'));
      return;
    }
    setMoveError(null);
    setMoving(true);
    const result = await onShiftSlot(slot.id, moveTime, moveDate !== slot.slot_date ? moveDate : undefined, true, moveSendSms);
    setMoving(false);
    if (result.success) {
      setMoveMode(false);
      onClose();
    } else {
      setMoveError(result.error || t('moveError'));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const position = localPhotos.length + 1;
    if (position > 3) return;

    setUploadingPhoto(true);
    setPhotoSuccess(false);
    try {
      const compressed = await compressOfferImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('merchantId', merchantId);
      formData.append('slotId', slot.id);
      formData.append('position', String(position));

      const res = await fetch('/api/planning/photos', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photo) {
        setLocalPhotos(prev => [...prev, { id: data.photo.id, url: data.photo.url, position: data.photo.position }]);
        setPhotoSuccess(true);
        setTimeout(() => setPhotoSuccess(false), 2000);
      }
      onRefreshSlots();
    } catch { /* */ }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId: string) => {
    setLocalPhotos(prev => prev.filter(p => p.id !== photoId));
    try {
      await fetch('/api/planning/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, merchantId }),
      });
      onRefreshSlots();
    } catch { /* */ }
  };

  // Result photo handlers
  const handleResultPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const position = localResultPhotos.length + 1;
    if (position > 3) return;

    setUploadingResultPhoto(true);
    setResultPhotoSuccess(false);
    try {
      const compressed = await compressOfferImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('merchantId', merchantId);
      formData.append('slotId', slot.id);
      formData.append('position', String(position));

      const res = await fetch('/api/planning/result-photos', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photo) {
        setLocalResultPhotos(prev => [...prev, { id: data.photo.id, url: data.photo.url, position: data.photo.position }]);
        setResultPhotoSuccess(true);
        setTimeout(() => setResultPhotoSuccess(false), 2000);
      }
      onRefreshSlots();
    } catch { /* */ }
    setUploadingResultPhoto(false);
    if (resultFileInputRef.current) resultFileInputRef.current.value = '';
  };

  const handleDeleteResultPhoto = async (photoId: string) => {
    setLocalResultPhotos(prev => prev.filter(p => p.id !== photoId));
    try {
      await fetch('/api/planning/result-photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, merchantId }),
      });
      onRefreshSlots();
    } catch { /* */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={onGoBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {formatTime(slot.start_time, locale)}
                </span>
                <span className="text-xs text-gray-400">{slot.slot_date}</span>
              </div>
              {draft.clientName && (
                <p className="text-xs text-gray-500">
                  {draft.clientName}
                  <button onClick={onGoBack} className="ml-1.5 text-indigo-600 font-medium hover:underline">
                    {t('changeClient')}
                  </button>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* ── Client info: social + memo ── */}
          {customer && (customer.instagram_handle || customer.tiktok_handle || customer.facebook_url) && (
            <div className="flex items-center gap-2 flex-wrap">
              {customer.instagram_handle && (
                <a href={`https://instagram.com/${customer.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors">
                  <Instagram className="w-3.5 h-3.5" />{customer.instagram_handle}
                </a>
              )}
              {customer.tiktok_handle && (
                <a href={`https://tiktok.com/@${customer.tiktok_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                  <TikTokIcon className="w-3.5 h-3.5" />{customer.tiktok_handle}
                </a>
              )}
              {customer.facebook_url && (
                <a href={customer.facebook_url.startsWith('http') ? customer.facebook_url : `https://${customer.facebook_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                  <FacebookIcon className="w-3.5 h-3.5" />Facebook
                </a>
              )}
            </div>
          )}

          {pinnedNotes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />{t('clientMemo')}
              </p>
              {pinnedNotes.map(note => {
                const style = getTypeStyle(note.note_type);
                return (
                  <div key={note.id} className="flex items-start gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${style.pillBg} ${style.pillText}`}>{note.note_type}</span>
                    <p className="text-xs text-gray-700">{note.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Prestations ── */}
          {services.length > 0 && (() => {
            const selected = services.filter(s => draft.serviceIds.includes(s.id));
            const unselected = services.filter(s => !draft.serviceIds.includes(s.id));
            const VISIBLE_UNSELECTED = 4;
            const hiddenCount = unselected.length - VISIBLE_UNSELECTED;
            const visibleUnselected = showAllServices ? unselected : unselected.slice(0, VISIBLE_UNSELECTED);

            const ServiceRow = ({ svc, isChecked }: { svc: ServiceWithDuration; isChecked: boolean }) => {
              const svcColor = serviceColorMap.get(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all text-[13px] ${isChecked ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  style={colorBorderStyle(svcColor)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="font-medium truncate">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0 ml-2">
                    {svc.price > 0 && <span>{formatCurrency(svc.price, merchantCountry, locale)}</span>}
                    {svc.duration && (
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{svc.duration}</span>
                    )}
                  </div>
                </button>
              );
            };

            return (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{t('servicesLabel')}</label>

              {/* Selected services — always visible */}
              {selected.length > 0 && (
                <div className="space-y-1 mb-2">
                  {selected.map(svc => <ServiceRow key={svc.id} svc={svc} isChecked />)}
                </div>
              )}

              {/* Unselected services */}
              {unselected.length > 0 && (
                <div className="space-y-1">
                  {visibleUnselected.map(svc => <ServiceRow key={svc.id} svc={svc} isChecked={false} />)}
                  {hiddenCount > 0 && !showAllServices && (
                    <button
                      type="button"
                      onClick={() => setShowAllServices(true)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      {t('showMoreServices', { count: hiddenCount })}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                  {showAllServices && hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllServices(false)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      {t('showLessServices')}
                      <ChevronDown className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              )}

              {(durationLabel || totalPrice) && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-3">
                    {durationLabel && <p className={`text-xs font-medium ${totalMinutes.hasUnknown ? 'text-amber-600' : 'text-indigo-600'}`}>{durationLabel}</p>}
                    {totalPrice !== null && <p className="text-xs font-medium text-emerald-600">{t('totalPrice', { price: formatCurrency(totalPrice, merchantCountry, locale) })}</p>}
                  </div>
                  {slot.deposit_confirmed !== null && totalPrice !== null && (() => {
                    const depAmt = computeDepositAmount(totalPrice, depositFixed, depositPercent);
                    return depAmt ? (
                      <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-[11px] text-amber-700 font-medium">
                          {t('depositRecap', { deposit: formatCurrency(depAmt, merchantCountry, locale), remaining: formatCurrency(totalPrice - depAmt, merchantCountry, locale) })}
                        </p>
                        {slot.deposit_confirmed === false && (
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{t('depositPending')}</span>
                            {slot.deposit_deadline_at && (
                              <span className="text-[10px] text-gray-400">
                                {t('depositDeadlineBefore', { date: new Date(slot.deposit_deadline_at).toLocaleString(toBCP47(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}
                              </span>
                            )}
                          </div>
                        )}
                        {slot.deposit_confirmed === true && <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t('depositConfirmed')}</span>}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            );
          })()}

          {/* Overlap warning */}
          {overlap && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  {t('overlapWarning', { endTime: overlap.endTime, nextTime: formatTime(overlap.nextSlot.start_time, locale) })}
                </p>
              </div>
              <div className="flex gap-2 ml-6">
                <button onClick={() => onShiftSlot(overlap.nextSlot.id, overlap.suggestedTime)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50">
                  {t('shiftNextSlot', { newTime: formatTime(overlap.suggestedTime, locale) })}
                </button>
                <button onClick={() => onDelete(overlap.nextSlot.id)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50">
                  {t('deleteNextSlot')}
                </button>
              </div>
            </div>
          )}

          {/* ── Collapsible: Photos avant / apres ── */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">{t('photosSection')}</span>
                {(localPhotos.length + localResultPhotos.length) > 0 && (
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {localPhotos.length + localResultPhotos.length}
                  </span>
                )}
                {(photoSuccess || resultPhotoSuccess) && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t('photoUploaded')}</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${showPhotos ? 'rotate-180' : ''}`} />
            </button>
            {showPhotos && (
              <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
                {/* Inspiration photos */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('inspirationPhotos')}</p>
                  <div className="flex gap-2">
                    {localPhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img src={photo.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" loading="lazy" />
                        <button onClick={() => handleDeletePhoto(photo.id)} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {localPhotos.length < 3 && (
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors disabled:opacity-50">
                        {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </div>
                </div>
                {/* Result photos */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('resultPhotos')}</p>
                  <div className="flex gap-2">
                    {localResultPhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img src={photo.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" loading="lazy" />
                        <button onClick={() => handleDeleteResultPhoto(photo.id)} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {localResultPhotos.length < 3 && (
                      <button onClick={() => resultFileInputRef.current?.click()} disabled={uploadingResultPhoto} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors disabled:opacity-50">
                        {uploadingResultPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                      </button>
                    )}
                    <input ref={resultFileInputRef} type="file" accept="image/*" onChange={handleResultPhotoUpload} className="hidden" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Collapsible: Notes ── */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">{t('notesLabel')}</span>
                {draft.notes && <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{draft.notes}</span>}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
            </button>
            {showNotes && (
              <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                <textarea
                  value={draft.notes}
                  onChange={(e) => onDraftChange({ notes: e.target.value })}
                  placeholder={t('notesPlaceholder')}
                  maxLength={300}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                />
              </div>
            )}
          </div>

          {/* ── Collapsible: Historique client ── */}
          {draft.customerId && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">{t('clientHistory')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              {showHistory && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                  ) : clientHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">{t('noHistory')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {clientHistory.map(h => {
                        const svcIds = getSlotServiceIds(h);
                        const svcNames = svcIds.map(id => serviceMap.get(id)?.name).filter(Boolean).join(', ');
                        const histDate = new Date(h.slot_date + 'T12:00:00');
                        const histResultPhotos = h.planning_slot_result_photos || [];
                        return (
                          <div key={h.id} className="px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-700">{histDate.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}</span>
                                  <span className="text-[11px] text-gray-400">{formatTime(h.start_time, locale)}</span>
                                </div>
                                {svcNames && <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{svcNames}</p>}
                              </div>
                              {svcIds.length > 0 && (
                                <div className="flex gap-0.5">
                                  {svcIds.slice(0, 3).map(id => {
                                    const color = serviceColorMap.get(id);
                                    return color ? <div key={id} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> : null;
                                  })}
                                </div>
                              )}
                            </div>
                            {histResultPhotos.length > 0 && (
                              <div className="flex gap-1.5 mt-1.5">
                                {histResultPhotos.map(p => (
                                  <img key={p.id} src={p.url} alt="" className="w-8 h-8 object-cover rounded-lg border border-gray-200" loading="lazy" />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {/* SMS confirmation toggle — only for new bookings (slot not yet assigned) */}
          {!slot.client_name && draft.clientPhone.trim() && (
            <button
              type="button"
              onClick={() => isPaid && setSendSms(s => !s)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                !isPaid
                  ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                  : sendSms
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                sendSms ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                <MessageSquare className={`w-4 h-4 ${sendSms ? 'text-indigo-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-xs font-semibold ${sendSms ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {t('sendSmsConfirmation')}
                </p>
                {!isPaid && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{t('sendSmsTrialHint')}</p>
                )}
              </div>
              {isPaid ? (
                <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                  sendSms ? 'bg-indigo-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    sendSms ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </div>
              ) : (
                <span className="shrink-0 text-[9px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Pro</span>
              )}
            </button>
          )}

          {/* Confirm / cancel deposit */}
          {slot.deposit_confirmed === false && onConfirmDeposit && (
            <div className="flex justify-center">
              <button
                onClick={() => { onConfirmDeposit(slot); onClose(); }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {t('confirmDeposit')}
              </button>
            </div>
          )}
          {slot.deposit_confirmed === true && onCancelDeposit && (
            <div className="flex justify-center">
              <button
                onClick={() => { onCancelDeposit(slot); onClose(); }}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {t('cancelDeposit')}
              </button>
            </div>
          )}
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('save')}
            </button>
            {slot.client_name && (
              <button
                onClick={() => { setMoveDate(slot.slot_date); setMoveTime(''); setMoveError(null); setMoveMode(true); }}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                <CalendarClock className="w-4 h-4" />
                {t('moveBooking')}
              </button>
            )}
            <button
              onClick={() => slot.client_name ? setCancelMode(true) : onDelete(slot.id)}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {slot.client_name && (
            <button
              onClick={() => setCancelMode(true)}
              disabled={saving}
              className="w-full py-2 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
            >
              {t('clearSlot')}
            </button>
          )}
        </div>

        {/* Move booking overlay */}
        {moveMode && (
          <div className="absolute inset-0 z-20 bg-white rounded-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-gray-900">{t('moveBookingTitle')}</h3>
              </div>
              <button onClick={() => setMoveMode(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-[11px] text-gray-500">
                {t('moveBookingCurrent', { date: slot.slot_date, time: formatTime(slot.start_time, locale) })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('moveBookingDate')}</label>
                <input
                  type="date"
                  value={moveDate}
                  onChange={(e) => { setMoveDate(e.target.value); setMoveTime(''); setMoveError(null); }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('moveBookingTime')}</label>
                {moveDateFreeSlots.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('moveBookingFreeSlots')}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {moveDateFreeSlots.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setMoveTime(s.start_time); setMoveError(null); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${moveTime === s.start_time ? 'bg-violet-600 text-white shadow-sm shadow-violet-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {formatTime(s.start_time, locale)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('moveBookingCustomTime')}</p>
                <input
                  type="time"
                  value={moveTime}
                  onChange={(e) => { setMoveTime(e.target.value); setMoveError(null); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
                {moveDateFreeSlots.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-1.5">{t('moveBookingNoFreeSlot')}</p>
                )}
              </div>

              {moveError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 font-medium">{moveError}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              {slot.client_phone && (
                <button
                  type="button"
                  onClick={() => isPaid && setMoveSendSms(s => !s)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                    !isPaid
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      : moveSendSms
                        ? 'border-violet-200 bg-violet-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${moveSendSms ? 'bg-violet-100' : 'bg-gray-100'}`}>
                    <MessageSquare className={`w-3.5 h-3.5 ${moveSendSms ? 'text-violet-600' : 'text-gray-400'}`} />
                  </div>
                  <p className={`flex-1 text-left text-xs font-semibold ${moveSendSms ? 'text-violet-700' : 'text-gray-700'}`}>
                    {t('sendSmsMove')}
                  </p>
                  {isPaid ? (
                    <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${moveSendSms ? 'bg-violet-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${moveSendSms ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  ) : (
                    <span className="shrink-0 text-[9px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Pro</span>
                  )}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setMoveMode(false)}
                  disabled={moving}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleMoveConfirm}
                  disabled={moving || !moveTime}
                  className="flex-[2] py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                  {t('moveBookingConfirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel booking overlay */}
        {cancelMode && (
          <div className="absolute inset-0 z-20 bg-white rounded-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">{t('cancelBookingTitle')}</h3>
              </div>
              <button onClick={() => { setCancelMode(false); setCancelSendSms(false); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{t('cancelBookingMessage')}</p>
                <p className="text-xs text-gray-500">
                  {draft.clientName} — {slot.slot_date} {t('at')} {formatTime(slot.start_time, locale)}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              {slot.client_phone && (
                <button
                  type="button"
                  onClick={() => isPaid && setCancelSendSms(s => !s)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                    !isPaid
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      : cancelSendSms
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${cancelSendSms ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <MessageSquare className={`w-3.5 h-3.5 ${cancelSendSms ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <p className={`flex-1 text-left text-xs font-semibold ${cancelSendSms ? 'text-red-700' : 'text-gray-700'}`}>
                    {t('sendSmsCancel')}
                  </p>
                  {isPaid ? (
                    <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${cancelSendSms ? 'bg-red-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${cancelSendSms ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  ) : (
                    <span className="shrink-0 text-[9px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Pro</span>
                  )}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setCancelMode(false); setCancelSendSms(false); }}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('cancelBookingKeep')}
                </button>
                <button
                  onClick={() => { handleClearSlot(); setCancelMode(false); }}
                  disabled={saving}
                  className="flex-[2] py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t('cancelBookingConfirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
