import { test, expect } from '@playwright/test';

// Simple smoke test: loads app, toggles overlay, edits gradient picker

test('gradient flow', async ({ page }) => {
  await page.goto('/');

  // Wait for canvas
  await page.getByRole('button', { name: 'Toggle overlay' }).waitFor();

  // Toggle overlay on
  await page.getByRole('button', { name: 'Toggle overlay' }).click();

  // Ensure overlay grid slider appears
  await expect(page.getByText('Grid:')).toBeVisible();

  // Open gradient preset dropdown and choose second preset
  await page.getByLabel('Preset').click();
  await page.getByRole('option', { name: /Lavender Mist/i }).click();

  // Check that AA pass percentage updates (analysis panel)
  const stat = await page.getByText(/AA \(/).textContent();
  expect(stat).not.toBeNull();
}); 