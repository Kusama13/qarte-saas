'use client';

import { motion } from 'framer-motion';

function FloatingCard({ color, initials, stamps, total, delay, x, y, rotate }: { color: string; initials: string; stamps: number; total: number; delay: number; x: string; y: string; rotate: number }) {
  return (
    <motion.div className="absolute pointer-events-none select-none" style={{ left: x, top: y }} initial={{ opacity: 0, scale: 0.8, rotate: rotate - 5 }} animate={{ opacity: [0, 0.55, 0.55, 0], scale: [0.8, 1, 1, 0.9], rotate: [rotate - 5, rotate, rotate + 3, rotate], y: [0, -18, -18, 0] }} transition={{ duration: 8, delay, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}>
      <div className="w-[160px] h-[100px] rounded-2xl shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[11px] ring-1 ring-white/20" style={{ backgroundColor: `${color}99` }}>{initials}</div>
          <div className="flex-1"><div className="h-1.5 w-14 bg-white/30 rounded-full" /><div className="h-1 w-8 bg-white/20 rounded-full mt-1" /></div>
        </div>
        <div className="flex items-center gap-1 px-3 mt-3">
          {Array.from({ length: total }).map((_, i) => (<div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i < stamps ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)' }} />))}
        </div>
        <div className="mx-3 mt-2 h-1 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-white/60 rounded-full" style={{ width: `${(stamps / total) * 100}%` }} /></div>
      </div>
    </motion.div>
  );
}

export default function AuthBackground() {
  return (
    <>
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-30" style={{ background: 'radial-gradient(circle, #818cf8, #7c3aed)', top: '-15%', left: '-10%', animation: 'drift1 12s ease-in-out infinite alternate' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-20" style={{ background: 'radial-gradient(circle, #c084fc, #e879f9)', bottom: '-10%', right: '-15%', animation: 'drift2 14s ease-in-out infinite alternate' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, #8b5cf6)', top: '40%', left: '50%', animation: 'drift3 10s ease-in-out infinite alternate' }} />
      </div>

      {/* Floating loyalty cards */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingCard color="#654EDA" initials="L" stamps={6} total={8} delay={0} x="5%" y="12%" rotate={-12} />
        <FloatingCard color="#e879f9" initials="S" stamps={4} total={10} delay={3} x="68%" y="8%" rotate={8} />
        <FloatingCard color="#f59e0b" initials="B" stamps={9} total={10} delay={5.5} x="72%" y="65%" rotate={-6} />
        <FloatingCard color="#10b981" initials="M" stamps={3} total={6} delay={1.5} x="-2%" y="60%" rotate={10} />
      </div>

      <style jsx global>{`
        @keyframes drift1 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(80px, 60px) scale(1.15); } }
        @keyframes drift2 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-70px, -50px) scale(1.1); } }
        @keyframes drift3 { 0% { transform: translate(-50%, 0) scale(1); } 100% { transform: translate(calc(-50% + 40px), -40px) scale(1.2); } }
      `}</style>
    </>
  );
}
