'use client';

const JOINED_TODAY_ESTABLISHMENTS = [
  'Lunzia Studio',
  'La Canopée des Sens',
  'Lylabella',
  'Doux Regard',
  'Nour Beauté',
  'Autres Regards',
  'Le Comptoir du Visage',
];

export function JoinedTodayMarquee() {
  return (
    <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border-y border-rose-100 py-3 overflow-hidden">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-rose-500 mb-2">
        Ils nous ont rejoint
      </p>
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {[...JOINED_TODAY_ESTABLISHMENTS, ...JOINED_TODAY_ESTABLISHMENTS].map((name, i) => (
          <div key={i} className="flex items-center mx-6">
            <span className="font-playfair text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">
              {name}
            </span>
            <span className="mx-6 text-rose-300">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
