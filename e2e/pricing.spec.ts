import { test, expect } from '@playwright/test';

/** Smoke tests on /fr/pricing — verifies the 2-tier pricing page renders with
 *  the right tiers, prices, and CTAs. Does not exercise checkout. */
test.describe('Pricing page — 2 tiers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/pricing');
  });

  test('displays both tier cards with their headline names', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Fidélité', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tout-en-un', exact: true })).toBeVisible();
  });

  test('shows 19€ for Fidélité and 24€ for Tout-en-un by default (monthly)', async ({ page }) => {
    await expect(page.getByText('19€', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('24€', { exact: false }).first()).toBeVisible();
  });

  test('toggling annual switches Fidélité to its monthly equivalent (16€)', async ({ page }) => {
    await page.getByRole('button', { name: 'Annuel' }).click();
    // Fidélité monthlyEquiv (190/12 ≈ 16€)
    await expect(page.getByText('16€', { exact: false }).first()).toBeVisible();
    // Tout-en-un monthlyEquiv (240/12 = 20€)
    await expect(page.getByText('20€', { exact: false }).first()).toBeVisible();
    // Annual saving badge appears
    await expect(page.getByText(/Économise.*€/i).first()).toBeVisible();
  });

  test('Tout-en-un card shows the "Recommandé" badge', async ({ page }) => {
    await expect(page.getByText('Recommandé', { exact: false })).toBeVisible();
  });

  test('both CTAs link to the merchant signup page', async ({ page }) => {
    const fidelityCta = page.getByRole('link', { name: /Démarrer Fidélité/i });
    const allInCta = page.getByRole('link', { name: /Démarrer Tout-en-un/i });
    await expect(fidelityCta).toHaveAttribute('href', /\/auth\/merchant\/signup/);
    await expect(allInCta).toHaveAttribute('href', /\/auth\/merchant\/signup/);
  });

  test('Fidélité describes SMS as automatic, no quota', async ({ page }) => {
    await expect(page.getByText(/sans quota/i).first()).toBeVisible();
  });

  test('Tout-en-un highlights 0% commission', async ({ page }) => {
    await expect(page.getByText(/0%\s*commission/i).first()).toBeVisible();
  });

  test('comparison table includes Planity and Booksy columns', async ({ page }) => {
    await expect(page.getByText('Planity', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Booksy', { exact: false }).first()).toBeVisible();
  });
});
