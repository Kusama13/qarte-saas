import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test.describe(`CTA buttons — ${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Pricing condensed CTAs measure', async ({ page }) => {
      await page.goto('/fr');
      await page.locator('#pricing').scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const fidelity = page.getByRole('link', { name: /Essayer Fidélité/i });
      const allIn = page.getByRole('link', { name: /Essayer Tout-en-un/i });

      const fBox = await fidelity.boundingBox();
      const aBox = await allIn.boundingBox();
      const fText = await fidelity.textContent();
      const aText = await allIn.textContent();

      const fStyle = await fidelity.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontSize: cs.fontSize,
          padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
          lineHeight: cs.lineHeight,
          textWrap: cs.textWrap || cs.whiteSpace,
        };
      });
      const aStyle = await allIn.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontSize: cs.fontSize,
          padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
          lineHeight: cs.lineHeight,
          textWrap: cs.textWrap || cs.whiteSpace,
        };
      });

      // Detect if text overflows or wraps
      const fWraps = await fidelity.evaluate((el) => el.scrollWidth > el.clientWidth);
      const aWraps = await allIn.evaluate((el) => el.scrollWidth > el.clientWidth);

      console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} ===`);
      console.log('Fidélité CTA:', { box: fBox, text: fText?.trim(), style: fStyle, overflows: fWraps });
      console.log('Tout-en-un CTA:', { box: aBox, text: aText?.trim(), style: aStyle, overflows: aWraps });

      // Screenshot the pricing section for visual inspection
      await page.locator('#pricing').screenshot({ path: `audit-screenshots/cta-${vp.name}.png` });

      expect(fBox).toBeTruthy();
      expect(aBox).toBeTruthy();
    });
  });
}
