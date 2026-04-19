/**
 * One-off script: Extract churn survey verbatims from merchant_churn_surveys.
 * Groupe par blocker × would_convince, imprime tous les free_comment non vides.
 *
 * Objectif : alimenter l'audit email v2 en voice-of-customer réelle.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/extract-churn-verbatims.mjs > docs/churn-verbatims.md
 *
 * Privacy : aucun merchant_id, email ou shop_name dans la sortie.
 * Seuls les free_comment + compteurs agrégés.
 */

const SUPABASE_URL = 'https://deaoytdanrsacmabnnpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const BLOCKER_LABELS = {
  price: 'Prix',
  not_enough_clients: 'Pas assez de clientes',
  missing_feature: 'Feature manquante',
  too_complex: 'Trop complexe',
  other: 'Autre',
};

const CONVINCE_LABELS = {
  lower_price: 'Prix plus bas',
  longer_trial: 'Trial plus long',
  team_demo: 'Demo en équipe',
  more_features: 'Plus de features',
  nothing: 'Rien ne me convaincrait',
};

async function fetchSurveys() {
  const url = `${SUPABASE_URL}/rest/v1/merchant_churn_surveys?select=blocker,would_convince,missing_feature,features_tested,free_comment,created_at&order=created_at.desc`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function formatOutput(surveys) {
  const lines = [];
  lines.push('# Churn survey verbatims');
  lines.push('');
  lines.push(`> Extrait automatique ${new Date().toISOString().slice(0,10)}`);
  lines.push(`> Total réponses : **${surveys.length}**`);
  lines.push('');

  const blockerCounts = {};
  const convinceCounts = {};
  const missingFeatures = [];
  const commentsByBlocker = {};

  for (const s of surveys) {
    blockerCounts[s.blocker] = (blockerCounts[s.blocker] || 0) + 1;
    convinceCounts[s.would_convince] = (convinceCounts[s.would_convince] || 0) + 1;
    if (s.missing_feature?.trim()) missingFeatures.push(s.missing_feature.trim());
    if (s.free_comment?.trim()) {
      if (!commentsByBlocker[s.blocker]) commentsByBlocker[s.blocker] = [];
      commentsByBlocker[s.blocker].push({
        comment: s.free_comment.trim(),
        convince: s.would_convince,
        features: s.features_tested,
      });
    }
  }

  lines.push('## Distribution blocker');
  lines.push('');
  for (const [k, v] of Object.entries(blockerCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((v / surveys.length) * 100).toFixed(0);
    lines.push(`- **${BLOCKER_LABELS[k] || k}** : ${v} (${pct}%)`);
  }
  lines.push('');

  lines.push('## Distribution would_convince');
  lines.push('');
  for (const [k, v] of Object.entries(convinceCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((v / surveys.length) * 100).toFixed(0);
    lines.push(`- **${CONVINCE_LABELS[k] || k}** : ${v} (${pct}%)`);
  }
  lines.push('');

  if (missingFeatures.length > 0) {
    lines.push('## Missing features (verbatim)');
    lines.push('');
    for (const mf of missingFeatures.slice(0, 30)) {
      lines.push(`- *"${mf}"*`);
    }
    lines.push('');
  }

  lines.push('## Free comments groupés par blocker');
  lines.push('');
  for (const [blocker, entries] of Object.entries(commentsByBlocker)) {
    lines.push(`### ${BLOCKER_LABELS[blocker] || blocker} (${entries.length} verbatims)`);
    lines.push('');
    for (const e of entries) {
      lines.push(`- *"${e.comment}"* — convince: **${CONVINCE_LABELS[e.convince] || e.convince}** · features testées: ${e.features.length > 0 ? e.features.join(', ') : 'aucune'}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const surveys = await fetchSurveys();
  console.log(formatOutput(surveys));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
