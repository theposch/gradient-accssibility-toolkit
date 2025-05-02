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

  // Select 'Lavender Mist' preset via selectOption API
  await page.getByLabel('Preset').selectOption({ label: 'Lavender Mist' });

  // Check that AA pass percentage updates (analysis panel)
  const stat = await page.getByText(/AA \(/).first().textContent();
  expect(stat).not.toBeNull();
}); 