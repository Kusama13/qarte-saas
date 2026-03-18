'use client';

import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, Trash2, Check, Loader2, AlertTriangle, Clock, ImagePlus, Instagram } from 'lucide-react';
import { TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { useTranslations } from 'next-intl';
import type { PlanningSlot, CustomerSearchResult } from '@/types';
import { formatTime, formatCurrency } from '@/lib/utils';
import { compressOfferImage } from '@/lib/image-compression';
import { timeToMinutes, minutesToTime, roundUp5, formatDuration } from './utils';
import type { BookingDraft, ServiceWithDuration } from './usePlanningState';

interface BookingDetailsModalProps {
  slot: PlanningSlot;
  customer: CustomerSearchResult | null;
  draft: BookingDraft;
  services: ServiceWithDuration[];
  slotsByDate: Map<string, PlanningSlot[]>;
  merchantId: string;
  merchantCountry: string;
  saving: boolean;
  locale: string;
  onDraftChange: (partial: Partial<BookingDraft>) => void;
  onSave: (slotId: string, data: {
    client_name: string | null;
    client_phone: string | null;
    customer_id: string | null;
    service_ids: string[];
    notes: string | null;
  }) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
  onShiftSlot: (slotId: string, newTime: string) => Promise<void>;
  onRefreshSlots: () => Promise<void>;
  onGoBack: () => void;
  onClose: () => void;
}

export default function BookingDetailsModal({
  slot,
  customer,
  draft,
  services,
  slotsByDate,
  merchantId,
  merchantCountry,
  saving,
  locale,
  onDraftChange,
  onSave,
  onDelete,
  onShiftSlot,
  onRefreshSlots,
  onGoBack,
  onClose,
}: BookingDetailsModalProps) {
  const t = useTranslations('planning');
  const [localPhotos, setLocalPhotos] = useState(slot.planning_slot_photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute total duration
  const totalMinutes = useMemo(() => {
    let total = 0;
    let hasUnknown = false;
    for (const sid of draft.serviceIds) {
      const svc = services.find(s => s.id === sid);
      if (svc?.duration) total += svc.duration;
      else hasUnknown = true;
    }
    return { total, hasUnknown };
  }, [draft.serviceIds, services]);

  // Format duration
  const durationLabel = useMemo(() => {
    if (draft.serviceIds.length === 0) return null;
    if (totalMinutes.total === 0 && totalMinutes.hasUnknown) return t('durationUnknown');
    return t('totalDuration', { duration: formatDuration(totalMinutes.total) });
  }, [draft.serviceIds.length, totalMinutes, t]);

  // Compute total price
  const totalPrice = useMemo(() => {
    if (draft.serviceIds.length === 0) return null;
    let total = 0;
    for (const sid of draft.serviceIds) {
      const svc = services.find(s => s.id === sid);
      if (svc?.price) total += svc.price;
    }
    return total > 0 ? total : null;
  }, [draft.serviceIds, services]);

  // Overlap detection
  const overlap = useMemo(() => {
    if (draft.serviceIds.length === 0 || totalMinutes.total === 0) return null;
    const daySlots = slotsByDate.get(slot.slot_date) || [];
    const slotIndex = daySlots.findIndex(s => s.id === slot.id);
    if (slotIndex === -1 || slotIndex === daySlots.length - 1) return null;

    const nextSlot = daySlots[slotIndex + 1];
    const startMins = timeToMinutes(slot.start_time);
    const endMins = startMins + totalMinutes.total;
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
    });
  };

  const handleClearSlot = () => {
    onSave(slot.id, {
      client_name: null,
      client_phone: null,
      customer_id: null,
      service_ids: [],
      notes: null,
    });
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
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

        <div className="p-4 space-y-4">
          {/* Social links (if customer has them) */}
          {customer && (customer.instagram_handle || customer.tiktok_handle || customer.facebook_url) && (
            <div className="flex items-center gap-2">
              {customer.instagram_handle && (
                <a
                  href={`https://instagram.com/${customer.instagram_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  {customer.instagram_handle}
                </a>
              )}
              {customer.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${customer.tiktok_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  <TikTokIcon className="w-3.5 h-3.5" />
                  {customer.tiktok_handle}
                </a>
              )}
              {customer.facebook_url && (
                <a
                  href={customer.facebook_url.startsWith('http') ? customer.facebook_url : `https://${customer.facebook_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                  Facebook
                </a>
              )}
            </div>
          )}

          {/* Services multi-select */}
          {services.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('servicesLabel')}</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {services.map(svc => {
                  const isChecked = draft.serviceIds.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all text-sm ${
                        isChecked
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {svc.price > 0 && (
                          <span>{formatCurrency(svc.price, merchantCountry, locale)}</span>
                        )}
                        {svc.duration && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {svc.duration}min
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Duration + Price display */}
              {(durationLabel || totalPrice) && (
                <div className="mt-2 flex items-center gap-3">
                  {durationLabel && (
                    <p className={`text-xs font-medium ${totalMinutes.hasUnknown ? 'text-amber-600' : 'text-indigo-600'}`}>
                      {durationLabel}
                    </p>
                  )}
                  {totalPrice !== null && (
                    <p className="text-xs font-medium text-emerald-600">
                      {t('totalPrice', { price: formatCurrency(totalPrice, merchantCountry, locale) })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
                <button
                  onClick={() => onShiftSlot(overlap.nextSlot.id, overlap.suggestedTime)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {t('shiftNextSlot', { newTime: formatTime(overlap.suggestedTime, locale) })}
                </button>
                <button
                  onClick={() => onDelete(overlap.nextSlot.id)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {t('deleteNextSlot')}
                </button>
              </div>
            </div>
          )}

          {/* Inspiration photos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-semibold text-gray-600">{t('inspirationPhotos')}</label>
              {photoSuccess && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t('photoUploaded')}</span>
              )}
            </div>
            <div className="flex gap-2">
              {localPhotos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {localPhotos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-5 h-5" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('notesLabel')}</label>
            <textarea
              value={draft.notes}
              onChange={(e) => onDraftChange({ notes: e.target.value })}
              placeholder={t('notesPlaceholder')}
              maxLength={300}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('save')}
            </button>
            <button
              onClick={() => onDelete(slot.id)}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {slot.client_name && (
            <button
              onClick={handleClearSlot}
              disabled={saving}
              className="w-full py-2 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
            >
              {t('clearSlot')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
