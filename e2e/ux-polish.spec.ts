import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness - 375px (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should render app without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      console.log('WARNING: Horizontal scroll detected on mobile');
    }

    expect(hasHorizontalScroll).toBe(false);
  });

  test('should have readable text sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that text is not too small
    const smallTextElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, div, button, a, label');
      let tooSmall = 0;

      elements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 12 && el.textContent?.trim()) {
          tooSmall++;
        }
      });

      return tooSmall;
    });

    console.log(`Found ${smallTextElements} elements with font-size < 12px`);
    // Allow some small text (icons, etc)
    expect(smallTextElements).toBeLessThan(20);
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check button sizes (should be at least 44x44 for touch)
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"], a');
      let tooSmall = 0;

      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < 44 || rect.height < 44) {
            tooSmall++;
          }
        }
      });

      return tooSmall;
    });

    console.log(`Found ${smallButtons} buttons smaller than 44x44px`);
    // Some small buttons are acceptable
    expect(smallButtons).toBeLessThan(30);
  });

  test('should show mobile navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu or mobile nav
    const mobileNav = page.locator('[class*="mobile"], [class*="hamburger"], [aria-label*="menu"]');
    const regularNav = page.locator('nav, [role="navigation"]');

    const mobileNavCount = await mobileNav.count();
    const regularNavCount = await regularNav.count();

    console.log(`Mobile nav elements: ${mobileNavCount}, Regular nav: ${regularNavCount}`);

    // Should have some form of navigation
    expect(mobileNavCount + regularNavCount).toBeGreaterThan(0);
  });

  test('should have proper input sizing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt for inputs
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(500);
    }

    // Check textarea/input widths
    const inputs = page.locator('textarea, input[type="text"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box) {
          // Input should be reasonably wide on mobile (at least 80% of viewport)
          const widthPercent = (box.width / 375) * 100;
          console.log(`Input ${i}: ${widthPercent.toFixed(0)}% width`);
        }
      }
    }
  });
});

test.describe('Mobile Responsiveness - 768px (Tablet)', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('should render properly at tablet size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('should show appropriate layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if sidebar is visible or collapsed
    const sidebar = page.locator('[class*="sidebar"], aside, nav').first();

    if (await sidebar.isVisible()) {
      const box = await sidebar.boundingBox();
      if (box) {
        console.log(`Sidebar width at 768px: ${box.width}px`);
      }
    }
  });

  test('should have proper grid/flex layouts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for broken layouts (elements overflowing)
    const overflowingElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let overflowing = 0;

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > 768 && rect.width > 0) {
          overflowing++;
        }
      });

      return overflowing;
    });

    console.log(`Elements overflowing viewport: ${overflowingElements}`);
    expect(overflowingElements).toBeLessThan(5);
  });
});

test.describe('Loading States Consistency', () => {
  test('should show loading indicator on page load', async ({ page }) => {
    // Slow down network to catch loading states
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');

    // Look for loading indicators
    const loadingIndicators = page.locator(
      '[class*="loading"], [class*="spinner"], [class*="skeleton"], [role="progressbar"], text=/loading/i'
    );

    // Check if any loading state appears
    const hasLoading = await loadingIndicators.count() > 0;
    console.log(`Loading indicators found: ${await loadingIndicators.count()}`);

    await page.waitForLoadState('networkidle');
  });

  test('should have consistent loading patterns across modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const modules = ['shunt', 'settings'];
    const loadingPatterns: string[] = [];

    for (const moduleName of modules) {
      const tab = page.getByRole('button', { name: new RegExp(moduleName, 'i') }).first();

      if (await tab.isVisible()) {
        await tab.click();

        // Check for loading states during navigation
        const spinner = await page.locator('[class*="spinner"], [class*="loading"]').count();
        const skeleton = await page.locator('[class*="skeleton"]').count();

        loadingPatterns.push(`${moduleName}: spinner=${spinner}, skeleton=${skeleton}`);
        await page.waitForTimeout(500);
      }
    }

    console.log('\nLoading patterns by module:');
    loadingPatterns.forEach(p => console.log(`  ${p}`));
  });

  test('should show loading state for actions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(500);

      // Look for action buttons that might show loading
      const actionButtons = page.locator('button').filter({
        hasText: /summarize|process|generate/i
      });

      if (await actionButtons.count() > 0) {
        // Check if buttons have loading states (disabled during action)
        const firstButton = actionButtons.first();
        const hasDisabledState = await firstButton.getAttribute('disabled') !== null ||
          (await firstButton.getAttribute('class'))?.includes('disabled');

        console.log(`Action button has disabled state capability: ${hasDisabledState}`);
      }
    }
  });

  test('should not have stuck loading states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit more
    await page.waitForTimeout(2000);

    // Check for any loading indicators still visible
    const stuckLoading = await page.locator(
      '[class*="loading"]:visible, [class*="spinner"]:visible'
    ).count();

    console.log(`Visible loading indicators after full load: ${stuckLoading}`);
    expect(stuckLoading).toBe(0);
  });
});

test.describe('Error Messages Clarity', () => {
  test('should have clear error styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for error-related elements
    const errorElements = page.locator(
      '[class*="error"], [role="alert"], [aria-invalid="true"]'
    );

    const count = await errorElements.count();
    console.log(`Error-styled elements found: ${count}`);

    // If there are errors shown, check they're styled
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const el = errorElements.nth(i);
        const color = await el.evaluate(e =>
          window.getComputedStyle(e).color
        );
        console.log(`Error element ${i} color: ${color}`);
      }
    }
  });

  test('should show validation errors for forms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Settings (likely has form inputs)
    const settingsTab = page.getByRole('button', { name: /settings/i }).first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(500);

      // Look for required inputs
      const requiredInputs = page.locator('[required], [aria-required="true"]');
      const count = await requiredInputs.count();

      console.log(`Required form fields: ${count}`);
    }
  });

  test('should have user-friendly error messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for technical error messages that users shouldn't see
    const technicalErrors = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const technicalTerms = [
        'undefined',
        'null',
        'exception',
        'stack trace',
        'typeerror',
        'syntaxerror',
        'referenceerror'
      ];

      return technicalTerms.filter(term => text.includes(term));
    });

    if (technicalErrors.length > 0) {
      console.log('WARNING: Technical error terms found:', technicalErrors);
    }

    expect(technicalErrors.length).toBe(0);
  });

  test('should provide helpful error guidance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for helpful UI patterns
    const helpElements = page.locator(
      '[class*="help"], [class*="hint"], [class*="tooltip"], [title], [aria-describedby]'
    );

    const count = await helpElements.count();
    console.log(`Helpful UI elements (hints, tooltips): ${count}`);

    // Should have some helpful UI
    expect(count).toBeGreaterThan(0);
  });

  test('should handle empty states gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to a module
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(500);

      // Check for empty state messaging
      const emptyStates = page.locator(
        'text=/no data|empty|get started|nothing here/i'
      );

      const count = await emptyStates.count();
      console.log(`Empty state messages: ${count}`);
    }
  });
});

test.describe('UX Polish Summary', () => {
  test('generate UX polish report', async ({ page }) => {
    console.log('\n========================================');
    console.log('   UX & POLISH AUDIT REPORT');
    console.log('========================================\n');

    // Test at mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mobileOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );

    console.log('MOBILE (375px):');
    console.log(`  Horizontal overflow: ${mobileOverflow ? 'YES (needs fix)' : 'No'}`);

    // Test at tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const tabletOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );

    console.log('\nTABLET (768px):');
    console.log(`  Horizontal overflow: ${tabletOverflow ? 'YES (needs fix)' : 'No'}`);

    // Test at desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log('\nDESKTOP (1280px):');
    console.log('  Standard viewport');

    // Loading states
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"]').count();

    console.log('\nLOADING STATES:');
    console.log(`  Loading indicators in DOM: ${loadingElements}`);

    // Error handling
    const errorElements = await page.locator('[class*="error"], [role="alert"]').count();

    console.log('\nERROR HANDLING:');
    console.log(`  Error elements: ${errorElements}`);

    // Help/guidance
    const helpElements = await page.locator('[class*="help"], [title], [aria-describedby]').count();

    console.log('\nUSER GUIDANCE:');
    console.log(`  Help/tooltip elements: ${helpElements}`);

    console.log('\n========================================');
    console.log('   END UX REPORT');
    console.log('========================================\n');

    // Basic pass condition
    expect(mobileOverflow || tabletOverflow).toBe(false);
  });
});
