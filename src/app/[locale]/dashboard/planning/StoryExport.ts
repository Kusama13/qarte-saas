import type { PlanningSlot } from '@/types';
import { formatTime, toBCP47 } from '@/lib/utils';

// Cache font loading at module level (loaded once, reused across calls)
let scriptFontPromise: Promise<string> | null = null;
function loadScriptFont(): Promise<string> {
  if (scriptFontPromise) return scriptFontPromise;
  const fallback = 'Georgia, "Times New Roman", serif';
  scriptFontPromise = (async () => {
    try {
      const font = new FontFace('Dancing Script', 'url(https://fonts.gstatic.com/s/dancingscript/v25/If2RXTr6YS-zF4S-kcSWSVi_szLgiuE.woff2)');
      const loaded = await font.load();
      document.fonts.add(loaded);
      return '"Dancing Script", cursive';
    } catch {
      return fallback;
    }
  })();
  return scriptFontPromise;
}

interface StoryExportParams {
  merchant: {
    shop_name?: string | null;
    primary_color?: string | null;
  };
  slots: PlanningSlot[];
  slotsByDate: Map<string, PlanningSlot[]>;
  weekStart: Date;
  weekEnd: Date;
  locale?: string;
}

export async function handleDownloadStory({ merchant, slots, slotsByDate, weekStart, weekEnd, locale = 'fr' }: StoryExportParams): Promise<void> {
  if (slots.length === 0) return;

  // Use already-loaded slots + pre-computed slotsByDate
  const sortedDates = Array.from(slotsByDate.keys()).sort();
  if (sortedDates.length === 0) return;
  // Canvas setup — story format 1080x1920
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const brandHex = merchant.primary_color || '#4b0082';

  // ── Helpers couleur ──
  const hexToRgb = (hex: string) => {
    const c = hex.replace('#', '');
    return { r: parseInt(c.substring(0, 2), 16), g: parseInt(c.substring(2, 4), 16), b: parseInt(c.substring(4, 6), 16) };
  };
  const rgb = hexToRgb(brandHex);

  // ── Police script (cached au niveau module) ──
  const scriptFamily = await loadScriptFont();

  // ── Fond : gradient basé sur la couleur merchant ──
  const mix = (c: number, t: number, f: number) => Math.round(c + (t - c) * f);
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, `rgb(${mix(rgb.r, 0, 0.3)}, ${mix(rgb.g, 0, 0.3)}, ${mix(rgb.b, 0, 0.3)})`);
  bgGrad.addColorStop(0.45, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  bgGrad.addColorStop(1, `rgb(${mix(rgb.r, 0, 0.4)}, ${mix(rgb.g, 0, 0.4)}, ${mix(rgb.b, 0, 0.4)})`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Halo lumineux subtil en haut ──
  const lighter = (c: number) => Math.min(255, c + 60);
  const glow = ctx.createRadialGradient(W / 2, 250, 50, W / 2, 250, 550);
  glow.addColorStop(0, `rgba(${lighter(rgb.r)}, ${lighter(rgb.g)}, ${lighter(rgb.b)}, 0.2)`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 800);

  // ── Emojis beauté décoratifs éparpillés ──
  const emojis = [
    { e: '✨', x: 100, y: 120, s: 42 },
    { e: '✨', x: 980, y: 160, s: 36 },
    { e: '💅', x: 70, y: 320, s: 38 },
    { e: '🌸', x: 1010, y: 300, s: 40 },
    { e: '✨', x: 130, y: 1750, s: 34 },
    { e: '💄', x: 950, y: 1780, s: 36 },
    { e: '🌸', x: 80, y: 900, s: 30 },
    { e: '✨', x: 1000, y: 1000, s: 28 },
  ];
  ctx.save();
  ctx.globalAlpha = 0.6;
  for (const em of emojis) {
    ctx.font = `${em.s}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(em.e, em.x, em.y);
  }
  ctx.restore();

  // ── Nom du salon — script, blanc ──
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 70px ${scriptFamily}`;
  ctx.fillText(merchant.shop_name || 'Mon salon', W / 2, 130);

  // ── "Planning" en gros script ──
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `96px ${scriptFamily}`;
  ctx.fillText('Planning', W / 2, 255);

  // ── ✨ autour de "Planning" ──
  ctx.font = '40px system-ui';
  ctx.fillText('✨', W / 2 - 260, 240);
  ctx.fillText('✨', W / 2 + 260, 240);

  // ── Semaine du X au Y ──
  const bcp = toBCP47(locale);
  const fmtShort = (d: Date) => d.toLocaleDateString(bcp, { day: 'numeric', month: 'long' });
  const weekLabel = locale === 'en'
    ? `Week of ${fmtShort(weekStart)} — ${fmtShort(weekEnd)}`
    : `Semaine du ${fmtShort(weekStart)} au ${fmtShort(weekEnd)}`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(weekLabel, W / 2, 325);

  // ── Séparateur avec petite fleur ──
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 220, 365);
  ctx.lineTo(W / 2 - 20, 365);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 20, 365);
  ctx.lineTo(W / 2 + 220, 365);
  ctx.stroke();
  ctx.font = '24px system-ui';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('🌸', W / 2, 372);

  // ── Jours ──
  const dayNamesFr = locale === 'en'
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const cardMx = 80;
  const cardW = W - cardMx * 2;
  const pad = 32;
  const slotFont = `bold 38px ${scriptFamily}`;
  const lineH = 48;
  const sepStr = '  /  ';

  // Chaque créneau = { text, taken } — on les place dans un flux unique avec wrapping
  type SlotItem = { text: string; taken: boolean };

  // Découpe les slots en lignes visuelles qui tiennent dans maxW
  const wrapSlotItems = (items: SlotItem[], maxW: number): SlotItem[][] => {
    ctx.font = slotFont;
    const lines: SlotItem[][] = [];
    let curLine: SlotItem[] = [];
    let curW = 0;
    const sepW = ctx.measureText(sepStr).width;
    for (const item of items) {
      const tw = ctx.measureText(item.text).width;
      const needed = curLine.length > 0 ? sepW + tw : tw;
      if (curW + needed > maxW && curLine.length > 0) {
        lines.push(curLine);
        curLine = [item];
        curW = tw;
      } else {
        curLine.push(item);
        curW += needed;
      }
    }
    if (curLine.length > 0) lines.push(curLine);
    return lines;
  };

  let y = 430;

  for (const dateStr of sortedDates) {
    if (y > H - 200) break;

    const dateSlots = slotsByDate.get(dateStr)!.sort((a, b) => a.start_time.localeCompare(b.start_time));
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = capitalize(dayNamesFr[d.getDay()]);
    const dayNum = d.getDate();

    // Tous les créneaux dans l'ordre chrono, avec flag taken
    const items: SlotItem[] = dateSlots.map(s => ({ text: formatTime(s.start_time, locale), taken: !!s.client_name }));
    const timesMaxW = cardW - pad * 2;
    const lines = wrapSlotItems(items, timesMaxW);

    // Hauteur carte
    const titleH = 54;
    const slotsH = lines.length * lineH;
    const cardH = pad + titleH + slotsH + pad - 10;

    if (y + cardH + 16 > H - 100) break;

    // ── Carte glass ──
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(cardMx, y, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardMx, y, cardW, cardH, 24);
    ctx.stroke();
    ctx.restore();

    let cy = y + pad;

    // ── Nom du jour — police script ──
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 42px ${scriptFamily}`;
    ctx.fillText(`${dayName} ${dayNum}`, W / 2, cy + 32);
    cy += titleH;

    // ── Créneaux — même police, inline, pris = barré ──
    ctx.font = slotFont;
    const sepW = ctx.measureText(sepStr).width;

    for (const line of lines) {
      // Calculer la largeur totale de la ligne pour la centrer
      let totalW = 0;
      for (let i = 0; i < line.length; i++) {
        totalW += ctx.measureText(line[i].text).width;
        if (i < line.length - 1) totalW += sepW;
      }

      let x = W / 2 - totalW / 2;
      const ty = cy + 32;

      for (let i = 0; i < line.length; i++) {
        const item = line[i];
        const tw = ctx.measureText(item.text).width;

        // Texte — blanc si dispo, blanc atténué si pris
        ctx.textAlign = 'left';
        ctx.fillStyle = item.taken ? 'rgba(255,255,255,0.35)' : '#ffffff';
        ctx.fillText(item.text, x, ty);

        // Rature si pris
        if (item.taken) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(x - 4, ty - 6);
          ctx.lineTo(x + tw + 4, ty - 6);
          ctx.stroke();
        }

        x += tw;

        // Séparateur /
        if (i < line.length - 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillText(sepStr, x, ty);
          x += sepW;
        }
      }

      cy += lineH;
    }

    y += cardH + 16;
  }

  // ── "Propulsé par Qarte" ──
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `34px ${scriptFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('\u2728 Propuls\u00e9 par Qarte \u2728', W / 2, H - 50);

  // Download
  const link = document.createElement('a');
  link.download = `planning-${merchant.shop_name?.replace(/\s+/g, '-').toLowerCase() || 'salon'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
