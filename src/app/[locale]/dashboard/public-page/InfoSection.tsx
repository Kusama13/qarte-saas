'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Instagram,
  Facebook,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { getSupabase } from '@/lib/supabase';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { formatPhoneNumber } from '@/lib/utils';
import type { Merchant, MerchantCountry } from '@/types';

interface InfoSectionProps {
  merchant: Merchant;
  refetch: () => Promise<void>;
}

export default function InfoSection({ merchant, refetch }: InfoSectionProps) {
  const supabase = getSupabase();
  const { saving, saved, save } = useDashboardSave();
  const t = useTranslations('publicPage');

  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [snapchatUrl, setSnapchatUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; break_start?: string; break_end?: string } | null>>({
    '1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null,
  });

  const hasHours = Object.values(openingHours).some(Boolean);
  const [hoursEnabled, setHoursEnabled] = useState(hasHours);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [socialsOpen, setSocialsOpen] = useState(false);

  useEffect(() => {
    setShopName(merchant.shop_name || '');
    setAddress(merchant.shop_address || '');
    setBio(merchant.bio || '');
    if (merchant.opening_hours) {
      setOpeningHours(merchant.opening_hours as Record<string, { open: string; close: string; break_start?: string; break_end?: string } | null>);
      setHoursEnabled(Object.values(merchant.opening_hours as Record<string, unknown>).some(Boolean));
    } else {
      setHoursEnabled(false);
    }
    setBookingUrl(merchant.booking_url || '');
    setInstagramUrl(merchant.instagram_url || '');
    setFacebookUrl(merchant.facebook_url || '');
    setTiktokUrl(merchant.tiktok_url || '');
    setSnapchatUrl(merchant.snapchat_url || '');
    setWhatsappUrl(merchant.whatsapp_url || '');
  }, [merchant]);

  const normalizeSocialUrl = (value: string, platform: 'instagram' | 'facebook' | 'tiktok' | 'snapchat' | 'whatsapp') => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const username = trimmed.replace(/^@/, '');
    switch (platform) {
      case 'instagram': return `https://instagram.com/${username}`;
      case 'facebook': return `https://facebook.com/${username}`;
      case 'tiktok': return `https://tiktok.com/@${username}`;
      case 'snapchat': return `https://snapchat.com/add/${username}`;
      case 'whatsapp': {
        // Accept phone number in any format (local 06xx, international 336xx, +33, etc.)
        // formatPhoneNumber converts to E.164 without + based on merchant country
        const e164 = formatPhoneNumber(trimmed, (merchant.country as MerchantCountry) || 'FR');
        return `https://wa.me/${e164}`;
      }
    }
  };

  const handleSave = () => {
    save(async () => {
      const normalizedUrl = bookingUrl.trim()
        ? (/^https?:\/\//i.test(bookingUrl.trim()) ? bookingUrl.trim() : `https://${bookingUrl.trim()}`)
        : null;

      const { error } = await supabase
        .from('merchants')
        .update({
          shop_name: shopName.trim() || null,
          shop_address: address.trim() || null,
          bio: bio.trim() || null,
          opening_hours: hoursEnabled && Object.values(openingHours).some(Boolean) ? openingHours : null,
          booking_url: normalizedUrl,
          instagram_url: normalizeSocialUrl(instagramUrl, 'instagram') || null,
          facebook_url: normalizeSocialUrl(facebookUrl, 'facebook') || null,
          tiktok_url: normalizeSocialUrl(tiktokUrl, 'tiktok') || null,
          snapchat_url: normalizeSocialUrl(snapchatUrl, 'snapchat') || null,
          whatsapp_url: normalizeSocialUrl(whatsappUrl, 'whatsapp') || null,
        })
        .eq('id', merchant.id);

      if (error) throw error;
      refetch().catch(() => {});
    });
  };

  const dayKeys = ['infoDayMon', 'infoDayTue', 'infoDayWed', 'infoDayThu', 'infoDayFri', 'infoDaySat', 'infoDaySun'] as const;

  return (
    <div className="divide-y divide-gray-100">
      {/* ── Infos ── */}
      <div className="pb-5">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t('infoShopName')}</label>
            <Input
              placeholder={t('infoShopNamePlaceholder')}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t('infoAddress')}</label>
            <AddressAutocomplete
              placeholder={t('infoAddressPlaceholder')}
              value={address}
              onChange={(v) => setAddress(v)}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t('infoBio')}</label>
            <textarea
              placeholder={t('infoBioPlaceholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={2}
              className="input h-auto resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/160</p>
          </div>
        </div>
      </div>

      {/* ── Horaires ── */}
      <div className="py-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { if (hoursEnabled) setHoursOpen(prev => !prev); }}
            className="flex items-center gap-2 text-left"
          >
            <span className="text-sm font-semibold text-gray-700">{t('infoOpeningHours')}</span>
            {hoursEnabled && (
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${hoursOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setHoursEnabled(prev => {
                if (prev) setHoursOpen(false);
                else setHoursOpen(true);
                return !prev;
              });
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${hoursEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hoursEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {hoursEnabled && hoursOpen && (
          <div className="mt-3 space-y-1.5">
            {dayKeys.map((dayKey, i) => {
              const key = String(i + 1);
              const slot = openingHours[key];
              const isOpen = slot !== null;
              const hasBreak = isOpen && !!slot.break_start && !!slot.break_end;
              return (
                <div key={key} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setOpeningHours(prev => ({
                      ...prev,
                      [key]: isOpen ? null : { open: '09:00', close: '18:00' },
                    }))}
                    className={`w-[68px] sm:w-[82px] text-left text-[12px] sm:text-[13px] font-medium py-1.5 px-1.5 sm:px-2 rounded-lg transition-colors shrink-0 ${
                      isOpen ? 'text-gray-800 bg-gray-50' : 'text-gray-400 bg-gray-50/50 line-through'
                    }`}
                  >
                    {t(dayKey)}
                  </button>
                  {isOpen ? (
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <input type="time" value={slot.open}
                          onChange={(e) => setOpeningHours(prev => ({ ...prev, [key]: { ...prev[key]!, open: e.target.value } }))}
                          className="input h-8 text-xs w-[100px]" />
                        <span className="text-gray-400 text-xs">&mdash;</span>
                        <input type="time" value={hasBreak ? slot.break_start! : slot.close}
                          onChange={(e) => setOpeningHours(prev => ({
                            ...prev,
                            [key]: { ...prev[key]!, ...(hasBreak ? { break_start: e.target.value } : { close: e.target.value }) },
                          }))}
                          className="input h-8 text-xs w-[100px]" />
                        {!hasBreak && (
                          <button type="button"
                            onClick={() => setOpeningHours(prev => ({ ...prev, [key]: { ...prev[key]!, break_start: '12:00', break_end: '14:00' } }))}
                            className="text-indigo-500 hover:text-indigo-700 text-[10px] font-semibold transition-colors whitespace-nowrap">
                            + {t('infoBreak')}
                          </button>
                        )}
                      </div>
                      {hasBreak && (
                        <div className="flex items-center gap-1.5">
                          <input type="time" value={slot.break_end}
                            onChange={(e) => setOpeningHours(prev => ({ ...prev, [key]: { ...prev[key]!, break_end: e.target.value } }))}
                            className="input h-8 text-xs w-[100px]" />
                          <span className="text-gray-400 text-xs">&mdash;</span>
                          <input type="time" value={slot.close}
                            onChange={(e) => setOpeningHours(prev => ({ ...prev, [key]: { ...prev[key]!, close: e.target.value } }))}
                            className="input h-8 text-xs w-[100px]" />
                          <button type="button"
                            onClick={() => setOpeningHours(prev => {
                              const { break_start, break_end, ...rest } = prev[key]!;
                              return { ...prev, [key]: rest };
                            })}
                            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[13px] text-gray-400 italic py-1.5">{t('infoDayClosed')}</span>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-gray-400 mt-1">{t('infoDayToggleHint')}</p>
          </div>
        )}
      </div>

      {/* ── Réservation ── */}
      <div className="py-5">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-700">{t('infoBooking')}</span>
        </div>
        <Input
          placeholder={t('infoBookingPlaceholder')}
          value={bookingUrl}
          onChange={(e) => setBookingUrl(e.target.value)}
          className="h-10 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">{t('infoBookingHint')}</p>
      </div>

      {/* ── Réseaux sociaux ── */}
      <div className="pt-5">
        <button
          type="button"
          onClick={() => setSocialsOpen(prev => !prev)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-semibold text-gray-700">{t('infoSocials')}</span>
            <span className="text-xs text-gray-400">
              {(() => {
                const count = [instagramUrl, facebookUrl, tiktokUrl, snapchatUrl, whatsappUrl].filter(Boolean).length;
                return count > 0 ? `${count}/5` : '';
              })()}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${socialsOpen ? 'rotate-180' : ''}`} />
        </button>

        {socialsOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Instagram className="w-4 h-4 text-pink-500" />
              </div>
              <Input type="text" className="h-10 text-sm pl-10" placeholder="Instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Facebook className="w-4 h-4 text-blue-600" />
              </div>
              <Input type="text" className="h-10 text-sm pl-10" placeholder="Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.17V12a4.85 4.85 0 01-5.58-2.17V2h3.45a4.83 4.83 0 003.77 4.25V9.7a8.16 8.16 0 01-5.58-2.17v6.56" />
                </svg>
              </div>
              <Input type="text" className="h-10 text-sm pl-10" placeholder="TikTok" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.07 2c3.33 0 5.58 2.09 5.97 5.39.1.87.04 1.79-.06 2.6h.01c.35.15.72.24 1.04.24.17 0 .36-.03.52-.1.24-.1.42-.16.6-.16.3 0 .52.14.62.4.16.39-.12.73-.56.97-.12.07-.27.13-.43.19-.56.22-1.33.52-1.53 1.2-.06.2-.04.42.06.7.02.04.04.09.06.14.48 1.12 1.13 2.1 1.95 2.87.26.24.54.46.85.64.37.21.58.43.58.7 0 .34-.37.63-.98.82-.36.11-.78.2-1.25.27-.07.01-.12.07-.14.14-.03.12-.07.29-.17.45-.14.22-.35.34-.72.34-.2 0-.44-.04-.73-.12a5.5 5.5 0 00-1.17-.17c-.24 0-.47.02-.7.07-.53.1-.98.38-1.49.7-.7.42-1.48.9-2.68.9h-.07c-1.2 0-1.99-.48-2.68-.9-.51-.32-.96-.6-1.49-.7a3.75 3.75 0 00-.7-.07c-.41 0-.8.06-1.17.17-.29.08-.53.12-.73.12-.42 0-.6-.16-.72-.34-.1-.16-.14-.33-.17-.45-.02-.07-.07-.13-.14-.14a7.54 7.54 0 01-1.25-.27c-.61-.19-.98-.48-.98-.82 0-.27.21-.49.58-.7.31-.18.6-.4.85-.64.82-.78 1.47-1.75 1.95-2.87l.06-.14c.1-.28.12-.5.06-.7-.2-.68-.97-.98-1.53-1.2a3.02 3.02 0 01-.43-.19c-.44-.24-.72-.58-.56-.97.1-.26.32-.4.62-.4.18 0 .36.06.6.16.16.07.35.1.52.1.32 0 .69-.09 1.04-.24h.01c-.1-.81-.17-1.73-.06-2.6C6.49 4.09 8.74 2 12.07 2z" />
                </svg>
              </div>
              <Input type="text" className="h-10 text-sm pl-10" placeholder="Snapchat" value={snapchatUrl} onChange={(e) => setSnapchatUrl(e.target.value)} />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <Input type="text" className="h-10 text-sm pl-10" placeholder="WhatsApp (ex: 33612345678)" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Save button ── */}
      <div className="pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? t('infoSaving') : saved ? t('infoSaved') : t('infoSave')}
        </button>
      </div>
    </div>
  );
}
