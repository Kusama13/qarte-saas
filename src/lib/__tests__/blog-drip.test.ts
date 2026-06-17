import { describe, it, expect } from 'vitest';
import { pickNextDripArticle, isDueForDrip, DRIP_SPACING_MS, DRIP_MIN_AGE_MS } from '../blog-drip';
import type { BlogArticle } from '@/data/blog-articles';

const A = (slug: string, date: string): BlogArticle => ({
  slug,
  title: slug,
  description: '',
  readTime: '5 min',
  category: 'Test',
  date,
  image: `/blog/${slug}.png`,
});

const ARTICLES = [A('a', '2026-01-01'), A('b', '2026-03-01'), A('c', '2026-06-01'), A('future', '2026-12-01')];
const TODAY = '2026-06-17';

describe('pickNextDripArticle', () => {
  it('prend le plus récent publié, non encore reçu', () => {
    expect(pickNextDripArticle(ARTICLES, new Set(), TODAY)?.slug).toBe('c');
  });

  it('exclut les articles déjà reçus', () => {
    expect(pickNextDripArticle(ARTICLES, new Set(['c']), TODAY)?.slug).toBe('b');
    expect(pickNextDripArticle(ARTICLES, new Set(['c', 'b']), TODAY)?.slug).toBe('a');
  });

  it('ignore les articles non encore publiés (date future)', () => {
    // 'future' (déc.) n'est jamais choisi même si non reçu et le plus récent.
    expect(pickNextDripArticle(ARTICLES, new Set(['c', 'b', 'a']), TODAY)).toBeNull();
  });

  it('null quand tout est reçu (épuisement)', () => {
    expect(pickNextDripArticle(ARTICLES, new Set(['a', 'b', 'c', 'future']), TODAY)).toBeNull();
  });
});

describe('isDueForDrip', () => {
  const now = new Date('2026-06-17T08:00:00Z');

  it('jamais reçu + inscrit depuis < 24 h → pas encore (laisser l\'accueil J0)', () => {
    const created = new Date(now.getTime() - (DRIP_MIN_AGE_MS - 3600_000)).toISOString();
    expect(isDueForDrip(null, created, now)).toBe(false);
  });

  it('jamais reçu + inscrit depuis ≥ 24 h → dû', () => {
    const created = new Date(now.getTime() - (DRIP_MIN_AGE_MS + 3600_000)).toISOString();
    expect(isDueForDrip(null, created, now)).toBe(true);
  });

  it('dernier mail < 2 j → pas dû (espacement)', () => {
    const last = new Date(now.getTime() - (DRIP_SPACING_MS - 3600_000)).toISOString();
    expect(isDueForDrip(last, '2026-01-01T00:00:00Z', now)).toBe(false);
  });

  it('dernier mail ≥ 2 j → dû', () => {
    const last = new Date(now.getTime() - (DRIP_SPACING_MS + 3600_000)).toISOString();
    expect(isDueForDrip(last, '2026-01-01T00:00:00Z', now)).toBe(true);
  });
});
