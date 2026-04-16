import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

  // Private paths that should never be indexed (authenticated or PII-sensitive)
  const disallow = ['/api/', '/dashboard/', '/admin/', '/auth/', '/customer/', '/scan/'];

  // Default rule for all crawlers.
  const defaultRule: MetadataRoute.Robots['rules'] = [
    { userAgent: '*', allow: '/', disallow },
  ];

  // Explicit allow for AI search crawlers (AEO).
  // We allow these bots because we want to be cited by AI assistants.
  // Block CCBot (Common Crawl) — used for training, not search citation.
  const aiBots = [
    'GPTBot', // OpenAI — ChatGPT search citations
    'ChatGPT-User', // OpenAI — on-demand browsing
    'OAI-SearchBot', // OpenAI — SearchGPT index
    'PerplexityBot', // Perplexity — citation source
    'Perplexity-User', // Perplexity — on-demand
    'ClaudeBot', // Anthropic — Claude search
    'anthropic-ai', // Anthropic — legacy
    'Google-Extended', // Google — Gemini + AI Overviews opt-in
    'Applebot-Extended', // Apple Intelligence opt-in
    'Bingbot', // Microsoft Copilot via Bing
    'meta-externalagent', // Meta AI
  ];

  const aiRules: MetadataRoute.Robots['rules'] = aiBots.map((ua) => ({
    userAgent: ua,
    allow: '/',
    disallow,
  }));

  return {
    rules: [...defaultRule, ...aiRules, { userAgent: 'CCBot', disallow: '/' }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
