/**
 * Chargement des fontes pour le rendu Satori du bon cadeau.
 *
 * Stratégie : WOFF bundlés via @fontsource/* (lus depuis node_modules).
 * Satori supporte TTF/OTF/WOFF (pas WOFF2) ; Fontsource fournit du WOFF.
 *
 * Cache mémoire au niveau module (Vercel garde les modules warm entre
 * invocations — premier appel ~80ms, suivants <1ms).
 */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

const fontCache = new Map<string, ArrayBuffer>();

async function loadFontsourceWoff(packageName: string, fileName: string): Promise<ArrayBuffer> {
  const cacheKey = `${packageName}/${fileName}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  // require.resolve trouve le path exact installé, robuste aux mouvements de node_modules
  const pkgJson = require_.resolve(`${packageName}/package.json`);
  const pkgDir = pkgJson.replace(/\/package\.json$/, '');
  const buffer = await readFile(`${pkgDir}/files/${fileName}`);
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  fontCache.set(cacheKey, ab);
  return ab;
}

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: 'normal' | 'italic';
}

export async function loadGiftCardFonts(): Promise<SatoriFont[]> {
  const [
    spectral400Italic,
    manrope500,
    jetBrains400,
    bodoni400,
    bodoni700Italic,
  ] = await Promise.all([
    loadFontsourceWoff('@fontsource/spectral', 'spectral-latin-400-italic.woff'),
    loadFontsourceWoff('@fontsource/manrope', 'manrope-latin-500-normal.woff'),
    loadFontsourceWoff('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
    loadFontsourceWoff('@fontsource/bodoni-moda', 'bodoni-moda-latin-400-normal.woff'),
    loadFontsourceWoff('@fontsource/bodoni-moda', 'bodoni-moda-latin-700-italic.woff'),
  ]);

  return [
    { name: 'Spectral', data: spectral400Italic, weight: 400, style: 'italic' },
    { name: 'Manrope', data: manrope500, weight: 500, style: 'normal' },
    { name: 'JetBrainsMono', data: jetBrains400, weight: 400, style: 'normal' },
    { name: 'BodoniModa', data: bodoni400, weight: 400, style: 'normal' },
    { name: 'BodoniModa', data: bodoni700Italic, weight: 700, style: 'italic' },
  ];
}
