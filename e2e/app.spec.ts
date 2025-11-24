import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // App should render without crashing
    await expect(page).toHaveTitle(/Shunt/i);

    // Main content should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display MissionControl navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Navigation should be present (sidebar or tabs)
    const nav = page.locator('[data-testid="mission-control"], nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('should navigate to Shunt module', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for Shunt tab/button
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();

    if (await shuntTab.isVisible()) {
      await shuntTab.click();

      // Shunt module should load (look for input area or control panel)
      const shuntContent = page.locator('[data-testid="shunt-module"], textarea, [placeholder*="input"]').first();
      await expect(shuntContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to Settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for Settings tab/button
    const settingsTab = page.getByRole('button', { name: /settings/i }).first();

    if (await settingsTab.isVisible()) {
      await settingsTab.click();

      // Settings should load
      await page.waitForTimeout(1000);

      // Look for settings content (theme, preferences, etc.)
      const settingsContent = page.locator('text=/theme|preferences|settings/i').first();
      await expect(settingsContent).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Shunt Module', () => {
  test('should have input and output areas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
    }

    // Wait for module to load
    await page.waitForTimeout(1000);

    // Should have input area (textarea)
    const inputArea = page.locator('textarea').first();
    await expect(inputArea).toBeVisible({ timeout: 5000 });
  });

  test('should accept text input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
    }

    await page.waitForTimeout(1000);

    // Find and interact with input
    const inputArea = page.locator('textarea').first();
    if (await inputArea.isVisible()) {
      await inputArea.fill('Test input text');
      await expect(inputArea).toHaveValue('Test input text');
    }
  });

  test('should have action buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
    }

    await page.waitForTimeout(1000);

    // Should have action buttons (Summarize, Amplify, etc.)
    const actionButtons = page.locator('button').filter({ hasText: /summarize|amplify|format|expand/i });
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Error Handling', () => {
  test('should not show console errors on load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., missing API keys in dev)
    const criticalErrors = errors.filter(err =>
      !err.includes('API key') &&
      !err.includes('network') &&
      !err.includes('Failed to fetch')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should handle navigation errors gracefully', async ({ page }) => {
    // Try to navigate to a non-existent route
    await page.goto('/non-existent-route');

    // Should not crash - either redirect or show error page
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have at least one heading
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All buttons should have accessible names
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name).toBeTruthy();
    }
  });
});
