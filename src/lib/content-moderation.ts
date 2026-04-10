// Shared content moderation — used by both client (marketing page) and server (push API routes)

export const FORBIDDEN_WORDS = [
  'sexe', 'sexuel', 'porno', 'xxx', 'nude', 'nu', 'nue',
  'arme', 'armes', 'fusil', 'pistolet', 'couteau', 'munition',
  'drogue', 'cannabis', 'cocaine', 'heroïne', 'crack',
  'violence', 'meurtre', 'tuer', 'mort',
  'nazi', 'hitler', 'raciste', 'racisme',
  'escroquerie', 'arnaque', 'fraude'
];

// Use word boundaries to avoid matching substrings (e.g. "nu" in "bienvenue", "arme" in "charme")
const FORBIDDEN_REGEX = new RegExp(
  '\\b(' + FORBIDDEN_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'i'
);

export function containsForbiddenWords(text: string): string | null {
  const match = text.match(FORBIDDEN_REGEX);
  return match ? match[1].toLowerCase() : null;
}
