'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

type BrandedQRCodeProps = {
  data: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
};

/**
 * Branded QR code with rounded dots, gradient colors, and centered Qarte logo.
 * Uses the existing `qrcode` library to get the QR matrix, then renders
 * custom styled dots on a canvas.
 */
export default function BrandedQRCode({
  data,
  size = 120,
  primaryColor = '#4b0082',
  secondaryColor = '#654EDA',
}: BrandedQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    let cancelled = false;

    const render = async () => {
      try {
        // Generate QR data matrix
        const qrData = QRCode.create(data, { errorCorrectionLevel: 'H' });
        const modules = qrData.modules;
        const moduleCount = modules.size;
        const margin = 2;
        const totalModules = moduleCount + margin * 2;

        const canvas = canvasRef.current!;
        const scale = 3; // render at 3x for crisp output
        canvas.width = size * scale;
        canvas.height = size * scale;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext('2d')!;
        const cellSize = (size * scale) / totalModules;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create gradient for dots
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);

        // Logo exclusion zone (center 25% for the logo)
        const logoRatio = 0.25;
        const logoStart = Math.floor((moduleCount - moduleCount * logoRatio) / 2);
        const logoEnd = Math.ceil((moduleCount + moduleCount * logoRatio) / 2);

        // Draw rounded dots
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            // Skip logo zone
            if (row >= logoStart && row < logoEnd && col >= logoStart && col < logoEnd) {
              continue;
            }

            if (modules.get(row, col)) {
              const x = (col + margin) * cellSize;
              const y = (row + margin) * cellSize;

              // Check if this is part of a finder pattern (top-left, top-right, bottom-left 7x7 squares)
              const isFinder =
                (row < 7 && col < 7) ||
                (row < 7 && col >= moduleCount - 7) ||
                (row >= moduleCount - 7 && col < 7);

              if (isFinder) {
                // Draw finder patterns with rounded corners
                ctx.fillStyle = primaryColor;
                drawRoundedRect(ctx, x, y, cellSize, cellSize, cellSize * 0.15);
              } else {
                // Draw rounded dots for data modules
                ctx.fillStyle = gradient;
                const dotSize = cellSize * 0.82;
                const offset = (cellSize - dotSize) / 2;
                const radius = dotSize / 2;
                ctx.beginPath();
                ctx.arc(x + offset + radius, y + offset + radius, radius, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // Draw "Q" logo in center
        if (!cancelled) {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const logoRadius = size * scale * 0.13;

          // White circle background
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, logoRadius + cellSize * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Gradient circle background for logo
          const logoGrad = ctx.createLinearGradient(
            cx - logoRadius, cy - logoRadius,
            cx + logoRadius, cy + logoRadius,
          );
          logoGrad.addColorStop(0, primaryColor);
          logoGrad.addColorStop(1, secondaryColor);
          ctx.fillStyle = logoGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, logoRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw "Q" letter
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${logoRadius * 1.3}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Q', cx, cy + logoRadius * 0.05);

          setReady(true);
        }
      } catch (err) {
        console.error('BrandedQRCode error:', err);
        if (!cancelled) setReady(true);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [data, size, primaryColor, secondaryColor]);

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}

/** Draw a filled rounded rectangle */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
