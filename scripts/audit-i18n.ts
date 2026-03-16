#!/usr/bin/env npx tsx
/**
 * audit-i18n.ts — Detect hardcoded French strings in locale-aware code
 *
 * Usage:
 *   npx tsx scripts/audit-i18n.ts          # full audit
 *   npx tsx scripts/audit-i18n.ts --ci     # exit 1 if findings
 *
 * Scans: src/app/[locale]/** + src/components/** (*.tsx, *.ts)
 * Skips: admin/ (FR-only by design), test files, .d.ts, translation files
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CI_MODE = process.argv.includes('--ci');
const ROOT = join(__dirname, '..');

// ── Colors ──
const c = process.stdout.isTTY && !CI_MODE
  ? { red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', nc: '\x1b[0m' }
  : { red: '', yellow: '', cyan: '', bold: '', nc: '' };

interface Finding {
  rule: string;
  file: string;
  line: number;
  content: string;
}

const findings: Finding[] = [];

function addFinding(rule: string, file: string, line: number, content: string) {
  findings.push({ rule, file: relative(ROOT, file), line, content: content.trim() });
}

// ── Collect files ──
function walk(dir: string, filter?: (path: string) => boolean): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walk(fullPath, filter));
      } else if (entry.isFile() && (!filter || filter(fullPath))) {
        results.push(fullPath);
      }
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

// Skip: admin (FR-only), legal pages (bilingual static content), blog (FR content by design), test-emails
const SKIP_PATTERNS = ['/admin/', '/cgv/', '/mentions-legales/', '/politique-confidentialite/', '/blog/', '/test-emails/'];

const isTarget = (p: string) =>
  (p.endsWith('.tsx') || p.endsWith('.ts')) &&
  !p.endsWith('.d.ts') &&
  !p.includes('.test.') &&
  !p.includes('.spec.') &&
  !SKIP_PATTERNS.some(pat => p.includes(pat));

const files = [
  ...walk(join(ROOT, 'src/app/[locale]'), isTarget),
  ...walk(join(ROOT, 'src/components'), isTarget),
];

console.log(`${c.bold}Audit i18n — Recherche de strings FR hardcodes${c.nc}`);
console.log(`Scanning ${files.length} files...`);
console.log('────────────────────────────────────────────────\n');

// ── Rule 1: Common French UI words in string literals ──
console.log(`${c.yellow}[1/5] French UI words in string literals...${c.nc}`);

const FR_WORDS = [
  'Ajouter', 'Annuler', 'Enregistrer', 'Sauvegarder', 'Supprimer',
  'Modifier', 'Confirmer', 'Valider', 'Fermer', 'Chargement',
  'Connexion', 'Bienvenue', 'Rechercher', 'Filtrer',
  'Voir plus', 'Voir tout', 'Retour', 'Suivant', 'Précédent',
  'Obligatoire', 'Télécharger', 'Activer', 'Désactiver',
  'Gratuit', 'Offert', 'Réduction', 'Félicitations', 'Bravo',
  'Terminé', 'En attente', 'Sélectionner', 'Choisissez',
  'Veuillez', 'Une erreur est survenue', 'Aucun résultat',
  'Enregistré', 'Sauvegardé', 'Envoyé', 'Copié',
];

const frWordsRe = new RegExp(`['"\`]([^'"\`]*(?:${FR_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[^'"\`]*)['"\`]`);

for (const file of files) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip imports, comments, console
    if (/^\s*(\/\/|\/\*|\*|import |export )/.test(line)) continue;
    if (/console\./.test(line)) continue;
    // Skip t() calls
    if (/t\(['"]/.test(line)) continue;
    if (frWordsRe.test(line)) {
      addFinding('FR_WORD', file, i + 1, line);
    }
  }
}

// ── Rule 2: Hardcoded placeholder attributes ──
console.log(`${c.yellow}[2/5] French placeholders (not using t())...${c.nc}`);

const placeholderRe = /placeholder="[A-Za-zÀ-ÿ]/;
// Whitelist: brand names / universal words that don't need translation
const placeholderWhitelist = ['Instagram', 'Facebook', 'TikTok', 'Snapchat', 'Google', 'https://', 'http://'];

for (const file of files) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!placeholderRe.test(line)) continue;
    if (/placeholder=\{/.test(line)) continue;
    // Extract placeholder value
    const match = line.match(/placeholder="([^"]*)"/);
    if (match && placeholderWhitelist.some(w => match[1].startsWith(w))) continue;
    addFinding('FR_PLACEHOLDER', file, i + 1, line);
  }
}

// ── Rule 3: Hardcoded aria-label attributes ──
console.log(`${c.yellow}[3/5] French aria-labels (not using t())...${c.nc}`);

// Whitelist: universal labels that don't need translation
const ariaWhitelist = ['Instagram', 'Facebook', 'TikTok', 'Snapchat', 'Google', 'Menu', 'Toggle menu', 'Close'];

for (const file of files) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/aria-label="[A-Za-zÀ-ÿ]/.test(line)) continue;
    if (/aria-label=\{/.test(line)) continue;
    const ariaMatch = line.match(/aria-label="([^"]*)"/);
    if (ariaMatch && ariaWhitelist.includes(ariaMatch[1])) continue;
    addFinding('FR_ARIA', file, i + 1, line);
  }
}

// ── Rule 4: Inline French sentences in JSX ──
console.log(`${c.yellow}[4/5] Inline French sentences in JSX...${c.nc}`);

// Match: >TextWithThreeOrMoreFrenchWords
const sentenceRe = />\s*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[a-zà-ÿ]+){2,})/;

for (const file of files) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
    if (/\{t\(/.test(line)) continue;
    if (/(className|href|src|key)=/.test(line)) continue;
    if (sentenceRe.test(line)) {
      addFinding('FR_SENTENCE', file, i + 1, line);
    }
  }
}

// ── Rule 5: Missing accents in FR translation files ──
console.log(`${c.yellow}[5/5] Common missing accents in FR translations...${c.nc}`);

const ACCENT_PAIRS: [string, string][] = [
  ['fidelite', 'fidélité'],
  ['\\bcree\\b', 'créé'],
  ['\\bprets\\b', 'prêts'],
  ['\\bdeja\\b', 'déjà'],
  ['\\bpremiere\\b', 'première'],
  ['depenser', 'dépenser'],
  ['publicite', 'publicité'],
  ['\\bequipe\\b', 'équipe'],
  ['recompense', 'récompense'],
  ['evenement', 'événement'],
  ['beneficier', 'bénéficier'],
  ['decouvrir', 'découvrir'],
];

function checkAccents(filePath: string) {
  try {
    const lines = readFileSync(filePath, 'utf-8').split('\n');
    for (const [bad, good] of ACCENT_PAIRS) {
      const re = new RegExp(bad, 'i');
      const goodRe = new RegExp(good, 'i');
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i]) && !goodRe.test(lines[i])) {
          // Skip JSON keys (lines that are just "key": {)
          if (/^\s*"[^"]+"\s*:\s*\{?\s*$/.test(lines[i])) continue;
          // Skip lines where the match is in the key name, not value
          const jsonValueMatch = lines[i].match(/:\s*"([^"]*)"/);
          if (jsonValueMatch && !re.test(jsonValueMatch[1])) continue;
          addFinding('ACCENT', filePath, i + 1, `"${bad}" → "${good}"  ${lines[i].trim()}`);
        }
      }
    }
  } catch { /* file doesn't exist */ }
}

checkAccents(join(ROOT, 'src/emails/translations/fr.ts'));
checkAccents(join(ROOT, 'messages/fr.json'));

// ── Report ──
console.log('');

for (const f of findings) {
  console.log(`  ${c.red}[${f.rule}]${c.nc} ${c.cyan}${f.file}:${f.line}${c.nc}`);
  console.log(`    ${f.content}`);
}

console.log('');
console.log('────────────────────────────────────────────────');

if (findings.length === 0) {
  console.log(`${c.bold}Aucun probleme detecte.${c.nc}`);
} else {
  console.log(`${c.bold}${c.red}${findings.length} probleme(s) detecte(s).${c.nc}`);
  console.log('Fix: replace hardcoded strings with t(\'key\') from useTranslations/getTranslations');
  if (CI_MODE) process.exit(1);
}
