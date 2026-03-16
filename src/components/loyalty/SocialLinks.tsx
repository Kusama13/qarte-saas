'use client';

import type { Merchant } from '@/types';
import { useTranslations } from 'next-intl';

interface SocialLinksProps {
  merchant: Merchant;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function SnapchatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.953-.268.18-.088.33-.12.48-.12.36 0 .659.211.659.51a.685.685 0 01-.315.614c-.21.12-1.11.57-1.725.676-.18.03-.36.074-.54.074-.18 0-.36-.03-.54-.074a4.14 4.14 0 00-.315-.044c-.209 0-.375.06-.504.18-.09.088-.15.195-.195.315-.045.12-.06.255-.06.39 0 .24.015.465.045.69.105.63.33 1.065.614 1.395.24.27.54.48.87.63.27.12.57.21.87.255.12.015.24.03.36.06a.685.685 0 01.555.66c0 .33-.24.63-.735.795-.57.195-1.32.3-2.1.33-.24.015-.39.21-.54.45-.195.315-.42.69-1.005.69-.06 0-.12 0-.195-.015-.42-.045-.765-.18-1.17-.33-.6-.21-1.275-.45-2.34-.45s-1.74.24-2.34.45c-.405.15-.75.285-1.17.33-.075.015-.135.015-.195.015-.585 0-.81-.375-1.005-.69-.15-.24-.3-.435-.54-.45-.78-.03-1.53-.135-2.1-.33C1.32 16.5 1.08 16.2 1.08 15.87c0-.33.21-.6.555-.66.12-.03.24-.045.36-.06.3-.045.6-.135.87-.255.33-.15.63-.36.87-.63.285-.33.51-.765.614-1.395.03-.225.045-.45.045-.69 0-.135-.015-.27-.06-.39a.753.753 0 00-.195-.315c-.13-.12-.295-.18-.504-.18a4.14 4.14 0 00-.315.044c-.18.044-.36.074-.54.074s-.36-.044-.54-.074c-.615-.106-1.515-.556-1.725-.676A.685.685 0 01.2 10.007c0-.3.3-.51.659-.51.15 0 .3.032.48.12.294.148.653.252.953.268.198 0 .326-.045.401-.09a6.21 6.21 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C4.647 1.07 8.004.793 8.994.793h.12z" />
    </svg>
  );
}

const SOCIALS = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    field: 'instagram_url' as const,
    icon: InstagramIcon,
    bg: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    shadow: 'rgba(225,48,108,0.3)',
  },
  {
    key: 'facebook' as const,
    label: 'Facebook',
    field: 'facebook_url' as const,
    icon: FacebookIcon,
    bg: '#1877F2',
    shadow: 'rgba(24,119,242,0.3)',
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    field: 'tiktok_url' as const,
    icon: TikTokIcon,
    bg: '#000000',
    shadow: 'rgba(0,0,0,0.2)',
  },
  {
    key: 'snapchat' as const,
    label: 'Snapchat',
    field: 'snapchat_url' as const,
    icon: SnapchatIcon,
    bg: '#FFFC00',
    shadow: 'rgba(255,252,0,0.3)',
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
                  <Icon className="w-[22px] h-[22px] text-white" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
