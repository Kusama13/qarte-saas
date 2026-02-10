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
    <div className="relative bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border-y border-rose-100 py-3 overflow-hidden mt-8 md:mt-0">
      {/* Mobile: label centré au-dessus, sans bg, gris discret */}
      <p className="md:hidden text-center text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
        Ils nous ont rejoint
      </p>

      <div className="flex items-center">
        {/* Desktop: label fixe à gauche avec fond opaque */}
        <div className="hidden md:flex absolute left-0 top-0 bottom-0 items-center px-4 pr-6 bg-rose-50 z-10 border-r border-rose-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            Ils nous ont rejoint
          </span>
        </div>

        {/* Noms défilants — mobile rapide, desktop normal */}
        <div className="animate-marquee-fast md:animate-marquee flex items-center whitespace-nowrap md:pl-44">
          {[...JOINED_TODAY_ESTABLISHMENTS, ...JOINED_TODAY_ESTABLISHMENTS].map((name, i) => (
            <div key={i} className="flex items-center mx-4 md:mx-6">
              <span className="font-playfair text-base md:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">
                {name}
              </span>
              <span className="mx-4 md:mx-6 text-rose-300">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
