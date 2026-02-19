import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: 'Qarte Pro',
    short_name: 'Qarte Pro',
    description: 'Tableau de bord commerçant Qarte',
    start_url: '/dashboard',
    scope: '/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#4f46e5',
    orientation: 'any',
    icons: [
      {
        src: '/icon-pro-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-pro-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-pro-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
