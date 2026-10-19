import { test, expect } from '@playwright/test';

test('app loads with no console errors', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.goto('/');

  // Wait for Excalidraw canvas to load
  await expect(page.locator('.excalidraw')).toBeVisible();

  // Allow app to settle
  await page.waitForTimeout(1000);

  // Assert no unexpected console errors
  expect(consoleErrors).toEqual([]);
});
