'use client';

import Link from 'next/link';

const DEMOS = [
  { slug: 'demo-onglerie', label: 'Onglerie', emoji: '💅' },
  { slug: 'demo-tatouage', label: 'Tatouage', emoji: '🖋️' },
  { slug: 'demo-coiffure', label: 'Coiffure', emoji: '✂️' },
];

export default function DemoNav({ current }: { current: string }) {
  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-center gap-1 px-3 py-2 max-w-lg mx-auto">
        {DEMOS.map((d) => {
          const active = d.slug === current;
          return (
            <Link
              key={d.slug}
              href={`/p/${d.slug}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <span>{d.emoji}</span>
              <span>{d.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
