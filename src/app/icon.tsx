import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Q
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
