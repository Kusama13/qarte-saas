'use client';

export default function CardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
      {/* Skeleton Header */}
      <header className="relative w-full">
        <div className="relative mx-auto lg:max-w-lg lg:mt-4 lg:rounded-3xl overflow-hidden">
          <div className="bg-gray-200 animate-pulse flex flex-col items-center pt-16 pb-14 px-5">
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20" />
            <div className="w-[88px] h-[88px] rounded-[1.75rem] bg-white/30 mb-4" />
            <div className="w-36 h-6 bg-white/20 rounded-lg mb-2" />
          </div>
        </div>
      </header>
      <main className="px-4 max-w-lg mx-auto pb-10">
        {/* Skeleton Greeting Card */}
        <div className="relative z-10 -mt-8 mb-4 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="w-16 h-4 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="w-28 h-7 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-20 h-7 bg-gray-50 rounded-full animate-pulse" />
          </div>
          <div className="flex items-end justify-between mb-2">
            <div className="w-20 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full animate-pulse" />
        </div>
        {/* Skeleton Stamps */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100/80 p-5 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Skeleton Reward */}
        <div className="mb-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="w-40 h-5 bg-gray-200 rounded animate-pulse mb-1.5" />
              <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton History */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/50 overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-50">
            <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
              <div className="flex-1">
                <div className="w-24 h-4 bg-gray-100 rounded animate-pulse mb-1" />
                <div className="w-16 h-3 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
