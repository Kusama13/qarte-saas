// Shared content moderation — used by both client (marketing page) and server (push API routes)

export const FORBIDDEN_WORDS = [
  'sexe', 'sexuel', 'porno', 'xxx', 'nude', 'nu', 'nue',
  'arme', 'armes', 'fusil', 'pistolet', 'couteau', 'munition',
  'drogue', 'cannabis', 'cocaine', 'heroïne', 'crack',
  'violence', 'meurtre', 'tuer', 'mort',
  'nazi', 'hitler', 'raciste', 'racisme',
  'escroquerie', 'arnaque', 'fraude'
];

export function containsForbiddenWords(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lowerText.includes(word)) {
      return word;
    }
  }
  return null;
}
