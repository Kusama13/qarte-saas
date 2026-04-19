import { test, expect } from '@playwright/test';

/** Audit script — captures section heights + screenshots on iPhone SE viewport.
 *  Run with: PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/audit-mobile.spec.ts --reporter=list
 *  Output: audit-screenshots/*.png + console table of section heights. */

test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

test.describe('Mobile audit — landing FR', () => {
  test('Landing / — full page screenshot + section heights', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    // Full-page screenshot
    await page.screenshot({ path: 'audit-screenshots/landing-full.png', fullPage: true });

    // Measure full page height
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = 667;
    const screensOfScroll = (fullHeight / viewportHeight).toFixed(1);

    // Measure each top-level <section> height
    const sections = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('section'));
      return all.map((s, i) => ({
        idx: i,
        id: s.id || '(no id)',
        firstHeading: s.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 60) || '',
        height: Math.round(s.getBoundingClientRect().height),
      }));
    });

    console.log('\n=== LANDING / — iPhone SE (375x667) ===');
    console.log(`Total page height: ${fullHeight}px`);
    console.log(`Viewport height: ${viewportHeight}px`);
    console.log(`Screens of scroll: ${screensOfScroll}\n`);
    console.log('Section breakdown:');
    console.table(sections);

    expect(fullHeight).toBeGreaterThan(0);
  });

  test('Pricing /fr/pricing — full screenshot + Fidélité CTA inspection', async ({ page }) => {
    await page.goto('/fr/pricing');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'audit-screenshots/pricing-full.png', fullPage: true });

    // Find both CTAs
    const fidelityCta = page.getByRole('link', { name: /Essayer Fidélité/i });
    const allInCta = page.getByRole('link', { name: /Essayer Tout-en-un/i });

    const fidelityBox = await fidelityCta.boundingBox();
    const allInBox = await allInCta.boundingBox();

    // Get computed styles
    const fidelityStyles = await fidelityCta.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        background: s.backgroundColor,
        color: s.color,
        border: s.border,
        fontSize: s.fontSize,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
      };
    });
    const allInStyles = await allInCta.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        background: s.backgroundImage || s.backgroundColor,
        color: s.color,
        fontSize: s.fontSize,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
      };
    });

    console.log('\n=== PRICING /fr/pricing CTAs — iPhone SE ===');
    console.log('Fidélité CTA:', { box: fidelityBox, styles: fidelityStyles });
    console.log('Tout-en-un CTA:', { box: allInBox, styles: allInStyles });

    // Section breakdown
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const sections = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('section'));
      return all.map((s, i) => ({
        idx: i,
        id: s.id || '(no id)',
        firstHeading: s.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 60) || '',
        height: Math.round(s.getBoundingClientRect().height),
      }));
    });
    console.log(`\nPricing page total: ${fullHeight}px (${(fullHeight / 667).toFixed(1)} screens)`);
    console.table(sections);
  });

  test('PricingSection isolated — both cards + buttons close-up', async ({ page }) => {
    await page.goto('/fr/pricing');
    await page.waitForLoadState('networkidle');

    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await pricingSection.screenshot({ path: 'audit-screenshots/pricing-section.png' });

    // Zoom on both CTAs side by side (just the cards area)
    const cards = page.locator('#pricing .grid').first();
    if (await cards.count() > 0) {
      await cards.screenshot({ path: 'audit-screenshots/pricing-cards.png' });
    }
  });
});
