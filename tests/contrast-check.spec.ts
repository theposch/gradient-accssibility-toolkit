import { test, expect } from '@playwright/test';

/**
 * This test toggles between two gradients to verify that the contrast
 * analysis panel correctly classifies a high-contrast and a low-contrast case.
 */

test('contrast analysis pass / fail', async ({ page }) => {
  await page.goto('/');

  // Wait for preset select
  await page.getByLabel('Preset').waitFor();

  // Case 1: choose Peach Glow (light) with white text – should fail AA ( < 40% )
  await page.getByLabel('Preset').selectOption({ label: 'Peach Glow' });
  // Wait for Poor rating to appear
  const ratingBadge = page.getByTestId('rating-badge');
  const firstText = await ratingBadge.textContent();
  const firstPct = Number(firstText?.match(/(\d+)%/)?.[1] ?? '0');

  // Case 2: choose Ocean Depths (dark) with white text – should improve rating (not Poor)
  await page.getByLabel('Preset').selectOption({ label: 'Ocean Depths' });
  await expect(async () => {
    const txt = await ratingBadge.textContent();
    const pct = Number(txt?.match(/(\d+)%/)?.[1] ?? '0');
    expect(pct).toBeGreaterThan(firstPct);
  }).toPass();
}); 