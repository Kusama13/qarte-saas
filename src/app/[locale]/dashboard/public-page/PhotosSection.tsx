'use client';

import { useState, useEffect } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { compressOfferImage } from '@/lib/image-compression';
import type { Merchant } from '@/types';

interface PhotosSectionProps {
  merchant: Merchant;
}

export default function PhotosSection({ merchant }: PhotosSectionProps) {
  const supabase = getSupabase();

  const [photos, setPhotos] = useState<Array<{ id: string; url: string; position: number }>>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const takenPositions = new Set(photos.map(p => p.position));
    const availablePositions = [1, 2, 3, 4, 5, 6].filter(p => !takenPositions.has(p));
    const filesToUpload = Array.from(files).slice(0, availablePositions.length);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const position = availablePositions[i];
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
      }
    }
    setUploadingPhoto(null);
    e.target.value = '';
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, merchantId: merchant.id }),
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      }
    } catch (error) {
      console.error('Photo delete error:', error);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-pink-500" />
        <span className="text-sm font-semibold text-gray-700">Mes r&eacute;alisations</span>
        <span className="text-xs text-gray-400">{photos.length}/6</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((position) => {
          const photo = photos.find(p => p.position === position);
          const isUploading = uploadingPhoto === position;
          return (
            <div key={position} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group">
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                </div>
              ) : photo ? (
                <>
                  <img src={photo.url} alt={`Réalisation ${position}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    type="button"
                    onClick={() => handlePhotoDelete(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-indigo-300 transition-colors">
                  <Plus className="w-5 h-5 text-gray-300" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
