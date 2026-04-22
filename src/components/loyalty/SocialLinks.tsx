'use client';

import type { Merchant } from '@/types';
import { useTranslations } from 'next-intl';
import { InstagramIcon, FacebookIcon, TikTokIcon, SnapchatIcon, WhatsAppIcon } from '@/components/icons/SocialIcons';

interface SocialLinksProps {
  merchant: Merchant;
}

const SOCIALS = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    field: 'instagram_url' as const,
    icon: InstagramIcon,
    bg: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    shadow: 'rgba(225,48,108,0.3)',
    iconClass: 'text-white',
  },
  {
    key: 'facebook' as const,
    label: 'Facebook',
    field: 'facebook_url' as const,
    icon: FacebookIcon,
    bg: '#1877F2',
    shadow: 'rgba(24,119,242,0.3)',
    iconClass: 'text-white',
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    field: 'tiktok_url' as const,
    icon: TikTokIcon,
    bg: '#000000',
    shadow: 'rgba(0,0,0,0.2)',
    iconClass: 'text-white',
  },
  {
    key: 'whatsapp' as const,
    label: 'WhatsApp',
    field: 'whatsapp_url' as const,
    icon: WhatsAppIcon,
    bg: '#25D366',
    shadow: 'rgba(37,211,102,0.3)',
    iconClass: 'text-white',
  },
  {
    key: 'snapchat' as const,
    label: 'Snapchat',
    field: 'snapchat_url' as const,
    icon: SnapchatIcon,
    bg: '#FFFC00',
    shadow: 'rgba(255,252,0,0.3)',
    iconClass: 'text-black',
  },
];

export default function SocialLinks({ merchant }: SocialLinksProps) {
  const t = useTranslations('common');
  const active = SOCIALS.filter((s) => {
    const val = merchant[s.field];
    return val && val.trim() !== '';
  });

  if (active.length === 0) return null;

  return (
    <div className="mt-2 mb-4">
      <div
        className="rounded-2xl px-5 py-4 bg-white/70 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100/80"
      >
        <p className="text-center text-[11px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-3">
          {t('findUsOn')}
        </p>

        <div className="flex items-center justify-center gap-5">
          {active.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.key}
                href={merchant[s.field]!}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-active:scale-95"
                  style={{
                    background: s.bg,
                    boxShadow: `0 4px 12px ${s.shadow}`,
                  }}
                >
                  <Icon className={`w-[22px] h-[22px] ${s.iconClass}`} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
