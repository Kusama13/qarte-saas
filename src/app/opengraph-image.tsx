import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Qarte - Programme de fidélité digital pour salons de beauté';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(244,63,94,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.12) 0%, transparent 50%)',
          padding: '50px 60px',
          gap: '60px',
        }}
      >
        {/* Left side: Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: '24px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            >
              <span style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>Q</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>Qarte</span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: '#111827', lineHeight: 1.15 }}>
              Le programme de fidélité
            </span>
            <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, backgroundImage: 'linear-gradient(90deg, #f43f5e, #ec4899, #8b5cf6)', backgroundClip: 'text', color: 'transparent' }}>
              qui fait revenir
            </span>
            <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, backgroundImage: 'linear-gradient(90deg, #f43f5e, #ec4899, #8b5cf6)', backgroundClip: 'text', color: 'transparent' }}>
              vos client(e)s.
            </span>
          </div>

          {/* Subtitle */}
          <span style={{ fontSize: 20, color: '#6b7280', lineHeight: 1.5 }}>
            QR code, points, récompenses. Conçu pour les instituts de beauté, ongleries et salons.
          </span>

          {/* CTA badge */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 12,
                backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Essayer gratuitement
            </div>
            <span style={{ fontSize: 16, color: '#9ca3af', fontWeight: 600 }}>7 jours gratuits</span>
          </div>
        </div>

        {/* Right side: Simplified iPhone mockup */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 260,
            height: 500,
            borderRadius: 36,
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            flexShrink: 0,
          }}
        >
          {/* Phone header - salon */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px 20px 20px',
              backgroundImage: 'linear-gradient(135deg, #f43f5e, #ec4899, #8b5cf6)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                fontSize: 22,
                fontWeight: 800,
                color: 'white',
              }}
            >
              E
            </div>
            <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>Elodie Nails Studio</span>
          </div>

          {/* Loyalty section */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ma fidélité</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f43f5e' }}>7/10</span>
            </div>

            {/* Stamp grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(i < 7
                      ? { backgroundImage: 'linear-gradient(135deg, #fb7185, #ec4899)' }
                      : { backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb' }),
                  }}
                >
                  {i < 7 ? (
                    <span style={{ color: 'white', fontSize: 14 }}>♥</span>
                  ) : (
                    <span style={{ color: '#d1d5db', fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', marginTop: 10, height: 6, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', backgroundImage: 'linear-gradient(90deg, #fb7185, #ec4899)', borderRadius: 99 }} />
            </div>
          </div>

          {/* Reward card */}
          <div style={{ display: 'flex', padding: '8px 16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 14px',
                borderRadius: 16,
                backgroundColor: '#fff1f2',
                border: '2px solid rgba(251,113,133,0.4)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundImage: 'linear-gradient(135deg, #fb7185, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 18 }}>🎁</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>Soin visage offert</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#e11d48' }}>Plus que 3 visites !</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 16px', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Historique</span>
            {[
              { emoji: '💅', label: 'Manucure semi-permanent', date: "Auj." },
              { emoji: '✨', label: 'Pose gel + nail art', date: '12 jan.' },
            ].map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: 10 }}>
                <span style={{ fontSize: 14 }}>{v.emoji}</span>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>{v.label}</span>
                  <span style={{ fontSize: 8, color: '#9ca3af' }}>{v.date}</span>
                </div>
                <div style={{ display: 'flex', padding: '2px 6px', backgroundColor: '#ecfdf5', borderRadius: 99 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#059669' }}>+1</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
