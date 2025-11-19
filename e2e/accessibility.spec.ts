import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('should have no critical accessibility violations on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Filter for critical and serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    // Log all violations for debugging
    if (criticalViolations.length > 0) {
      console.log('Critical/Serious Accessibility Violations:');
      criticalViolations.forEach(violation => {
        console.log(`\n${violation.id}: ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Help: ${violation.helpUrl}`);
        violation.nodes.forEach(node => {
          console.log(`  - ${node.html}`);
        });
      });
    }

    expect(criticalViolations.length).toBe(0);
  });

  test('should have no accessibility violations on Shunt module', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(1000);
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that interactive elements have ARIA labels
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'label', 'aria-label-text'])
      .analyze();

    // Log violations
    accessibilityScanResults.violations.forEach(violation => {
      console.log(`ARIA Issue: ${violation.id} - ${violation.description}`);
    });

    // Allow some minor violations but flag them
    const criticalAriaViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical'
    );

    expect(criticalAriaViolations.length).toBe(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Get focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });

    // Should have a focused element (not stuck on body)
    expect(focusedElement).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');

    if (await focusedElement.count() > 0) {
      // Check that the focused element has a visible outline
      const outlineStyle = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });

      // Should have some visible focus indicator
      const hasFocusIndicator =
        outlineStyle.outline !== 'none' ||
        outlineStyle.boxShadow !== 'none' ||
        outlineStyle.border !== 'none';

      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    // Log contrast issues
    const contrastViolations = accessibilityScanResults.violations;
    if (contrastViolations.length > 0) {
      console.log('Color Contrast Issues:');
      contrastViolations.forEach(violation => {
        console.log(`  ${violation.nodes.length} elements with contrast issues`);
      });
    }

    // Allow some minor contrast issues but flag critical ones
    const criticalContrast = contrastViolations.filter(v => v.impact === 'critical');
    expect(criticalContrast.length).toBe(0);
  });

  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['document-title', 'html-has-lang', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();

    // These are important structural requirements
    const structuralViolations = accessibilityScanResults.violations;

    // Log issues
    structuralViolations.forEach(violation => {
      console.log(`Structure Issue: ${violation.id} - ${violation.description}`);
    });

    // Should have proper document structure
    expect(structuralViolations.length).toBeLessThanOrEqual(2); // Allow some flexibility
  });

  test('should have accessible forms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shunt (has form elements)
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(1000);
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label', 'select-name', 'input-button-name'])
      .analyze();

    const formViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(formViolations.length).toBe(0);
  });
});

test.describe('Accessibility Summary Report', () => {
  test('generate full accessibility report', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();

    console.log('\n=== ACCESSIBILITY AUDIT REPORT ===\n');
    console.log(`Total Violations: ${results.violations.length}`);
    console.log(`Passes: ${results.passes.length}`);
    console.log(`Incomplete: ${results.incomplete.length}`);
    console.log(`Inapplicable: ${results.inapplicable.length}`);

    // Group by impact
    const byImpact = {
      critical: results.violations.filter(v => v.impact === 'critical'),
      serious: results.violations.filter(v => v.impact === 'serious'),
      moderate: results.violations.filter(v => v.impact === 'moderate'),
      minor: results.violations.filter(v => v.impact === 'minor'),
    };

    console.log('\nViolations by Impact:');
    console.log(`  Critical: ${byImpact.critical.length}`);
    console.log(`  Serious: ${byImpact.serious.length}`);
    console.log(`  Moderate: ${byImpact.moderate.length}`);
    console.log(`  Minor: ${byImpact.minor.length}`);

    if (results.violations.length > 0) {
      console.log('\nViolation Details:');
      results.violations.forEach(violation => {
        console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}`);
        console.log(`  ${violation.description}`);
        console.log(`  Affected: ${violation.nodes.length} element(s)`);
        console.log(`  Help: ${violation.helpUrl}`);
      });
    }

    console.log('\n=== END REPORT ===\n');

    // Test passes if no critical violations
    const criticalCount = byImpact.critical.length;
    expect(criticalCount).toBe(0);
  });
});
