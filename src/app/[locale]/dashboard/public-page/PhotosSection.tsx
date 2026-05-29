'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { compressOfferImage } from '@/lib/image-compression';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import type { Merchant } from '@/types';

interface PhotosSectionProps {
  merchant: Merchant;
}

type Photo = { id: string; url: string; position: number };

export default function PhotosSection({ merchant }: PhotosSectionProps) {
  const t = useTranslations('publicPage');
  const supabase = getSupabase();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [menuPhoto, setMenuPhoto] = useState<Photo | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replacePositionRef = useRef<number | null>(null);

  useBodyScrollLock(!!menuPhoto);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from('merchant_photos')
        .select('id, url, position')
        .eq('merchant_id', merchant.id)
        .order('position');
      if (data) setPhotos(data);
    };
    fetchPhotos();
  }, [merchant, supabase]);

  useEffect(() => {
    if (!menuPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuPhoto(null);
        setConfirmingDelete(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuPhoto]);

  const closeMenu = () => {
    setMenuPhoto(null);
    setConfirmingDelete(false);
  };

  const uploadToPosition = async (file: File, position: number) => {
    setUploadingPhoto(position);
    try {
      const compressed = await compressOfferImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('merchantId', merchant.id);
      formData.append('position', String(position));

      const res = await fetch('/api/photos', { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok && result.photo) {
        setPhotos(prev => [...prev.filter(p => p.position !== position), result.photo].sort((a, b) => a.position - b.position));
      }
    } catch (error) {
      console.error('Photo upload error:', error);
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const takenPositions = new Set(photos.map(p => p.position));
    const availablePositions = [1, 2, 3, 4, 5, 6].filter(p => !takenPositions.has(p));
    const filesToUpload = Array.from(files).slice(0, availablePositions.length);

    for (let i = 0; i < filesToUpload.length; i++) {
      await uploadToPosition(filesToUpload[i], availablePositions[i]);
    }
    e.target.value = '';
  };

  const startReplace = (position: number) => {
    closeMenu();
    replacePositionRef.current = position;
    replaceInputRef.current?.click();
  };

  const handleReplacePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const position = replacePositionRef.current;
    e.target.value = '';
    replacePositionRef.current = null;
    if (file && position != null) {
      void uploadToPosition(file, position);
    }
  };

  const handlePhotoDelete = async (photo: Photo) => {
    setDeleting(true);
    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, merchantId: merchant.id }),
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        closeMenu();
      }
    } catch (error) {
      console.error('Photo delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-pink-500" />
        <span className="text-sm font-semibold text-gray-700">{t('photosLabel')}</span>
        <span className="text-xs text-gray-400">{photos.length}/6</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((position) => {
          const photo = photos.find(p => p.position === position);
          const isUploading = uploadingPhoto === position;

          if (isUploading) {
            return (
              <div key={position} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                </div>
              </div>
            );
          }

          if (photo) {
            return (
              <button
                key={position}
                type="button"
                onClick={() => setMenuPhoto(photo)}
                aria-label={t('photosEditAria', { position })}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <img src={photo.url} alt={t('photosAlt', { position })} className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-[11px] font-medium">
                  <Pencil className="w-3 h-3" />
                  {t('photosEdit')}
                </span>
              </button>
            );
          }

          return (
            <label key={position} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-indigo-300 transition-colors">
              <Plus className="w-5 h-5 text-gray-300" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          );
        })}
      </div>

      <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplacePick} />

      {menuPhoto && (
        <Modal isOpen onClose={closeMenu} size="sm">
          <div className="flex items-center gap-3 mb-4">
            <img src={menuPhoto.url} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{t('photosMenuTitle')}</p>
              <p className="text-xs text-gray-400">{t('photosMenuPosition', { position: menuPhoto.position })}</p>
            </div>
          </div>

          {confirmingDelete ? (
              <div className="space-y-2.5">
                <p className="text-sm text-gray-600">{t('photosDeleteConfirmText')}</p>
                <button
                  type="button"
                  onClick={() => handlePhotoDelete(menuPhoto)}
                  disabled={deleting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t('photosDeleteConfirmAction')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {t('photosCancel')}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => startReplace(menuPhoto.position)}
                  className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-500" />
                  {t('photosChangeAction')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('photosDeleteAction')}
                </button>
              </div>
            )}
        </Modal>
      )}
    </div>
  );
}
