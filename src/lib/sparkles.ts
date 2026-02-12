/**
 * Glamour sparkle effect — elegant alternative to confetti.
 * Stars ✦, diamonds ◆ and glowing dots float upward and fade out.
 * Designed for a beauty/wellness loyalty app.
 */

type ParticleShape = 'star' | 'diamond' | 'dot';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  shape: ParticleShape;
}

interface SparkleOptions {
  particleCount?: number;
  colors?: string[];
  origin?: { x?: number; y?: number };
  spread?: number;
  /** upward drift strength — higher = particles rise faster */
  drift?: number;
  /** glow intensity multiplier (default 2) */
  glow?: number;
}

const GLAMOUR_COLORS = ['#FFD700', '#F5C6D0', '#FFB6C1', '#FFDAB9', '#FFFFFF', '#E8B4CB'];
const SHAPES: ParticleShape[] = ['star', 'star', 'diamond', 'dot'];

function drawStar(ctx: CanvasRenderingContext2D, size: number, rotation: number) {
  const spikes = 4;
  const outer = size;
  const inner = size * 0.38;

  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(ctx: CanvasRenderingContext2D, size: number, rotation: number) {
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.55, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.55, 0);
  ctx.closePath();
  ctx.fill();
}

function drawDot(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

let activeCanvas: HTMLCanvasElement | null = null;

export function sparkle(opts: SparkleOptions = {}) {
  const {
    particleCount = 40,
    colors = GLAMOUR_COLORS,
    origin = {},
    spread = 120,
    drift = 1.8,
    glow = 2,
  } = opts;

  const ox = (origin.x ?? 0.5) * window.innerWidth;
  const oy = (origin.y ?? 0.5) * window.innerHeight;

  // Reuse or create canvas
  if (!activeCanvas) {
    activeCanvas = document.createElement('canvas');
    activeCanvas.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:99999';
    document.body.appendChild(activeCanvas);
  }
  const canvas = activeCanvas;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d')!;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 0.8;
    const spreadFactor = spread / 100;

    particles.push({
      x: ox + (Math.random() - 0.5) * 20,
      y: oy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed * spreadFactor,
      vy: Math.sin(angle) * speed * spreadFactor - drift,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      life: 0,
      maxLife: Math.random() * 40 + 60, // ~1-1.7s at 60fps
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    });
  }

  let frameId: number;
  let allDead = false;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = 0;
    for (const p of particles) {
      p.life++;
      if (p.life > p.maxLife) continue;
      alive++;

      const progress = p.life / p.maxLife;
      // Ease-out fade: stays visible longer, then fades quickly
      p.alpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.015; // gentle upward acceleration
      p.vx *= 0.995;
      p.rotation += p.rotSpeed;
      // Shrink slightly at end
      const scale = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 * 0.4 : 1;
      const drawSize = p.size * scale;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = drawSize * glow;

      if (p.shape === 'star') drawStar(ctx, drawSize, p.rotation);
      else if (p.shape === 'diamond') drawDiamond(ctx, drawSize, p.rotation);
      else drawDot(ctx, drawSize);

      ctx.restore();
    }

    if (alive > 0) {
      frameId = requestAnimationFrame(animate);
    } else if (!allDead) {
      allDead = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.remove();
      activeCanvas = null;
    }
  };

  frameId = requestAnimationFrame(animate);

  // Safety cleanup
  setTimeout(() => {
    cancelAnimationFrame(frameId);
    if (activeCanvas) {
      activeCanvas.remove();
      activeCanvas = null;
    }
  }, 4000);
}

/** Preset: grand celebration (reward unlocked, first scan) */
export function sparkleGrand(colors?: string[]) {
  // Wave 1 — center burst
  sparkle({ particleCount: 60, colors, origin: { y: 0.5 }, spread: 140, glow: 3 });

  // Wave 2 — sides (300ms)
  setTimeout(() => {
    sparkle({ particleCount: 25, colors, origin: { x: 0.2, y: 0.55 }, spread: 100 });
    sparkle({ particleCount: 25, colors, origin: { x: 0.8, y: 0.55 }, spread: 100 });
  }, 300);

  // Wave 3 — golden shimmer rain (700ms)
  setTimeout(() => {
    sparkle({
      particleCount: 20,
      colors: ['#FFD700', '#FBBF24', '#F5C6D0', '#FFFFFF'],
      origin: { y: 0.3 },
      spread: 160,
      drift: 1.2,
    });
  }, 700);
}

/** Preset: medium celebration (scan success) */
export function sparkleMedium(colors?: string[]) {
  sparkle({ particleCount: 35, colors, origin: { y: 0.4 }, spread: 100, glow: 2 });
}

/** Preset: subtle sparkle (regular scan, mid-way) */
export function sparkleSubtle(colors?: string[]) {
  sparkle({ particleCount: 15, colors, origin: { y: 0.35 }, spread: 60, drift: 2.2, glow: 1.5 });
}
