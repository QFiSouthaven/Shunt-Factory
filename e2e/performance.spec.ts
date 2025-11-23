import { test, expect } from '@playwright/test';

interface PerformanceMetrics {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  domInteractive?: number;
  domContentLoaded?: number;
  loadComplete?: number;
  firstPaint?: number;
  dns?: number;
  tcp?: number;
  download?: number;
  domParsing?: number;
  resourceCount?: number;
  totalResourceSize?: number;
}

test.describe('Performance Benchmarks', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`\n=== PAGE LOAD TIME ===`);
    console.log(`Total Load Time: ${loadTime}ms`);

    // Target: < 3000ms for initial load
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');

    // Collect performance metrics
    const metrics: PerformanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const perfData: any = {};

        // Get navigation timing
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navTiming) {
          perfData.ttfb = navTiming.responseStart - navTiming.requestStart;
          perfData.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
          perfData.loadComplete = navTiming.loadEventEnd - navTiming.fetchStart;
          perfData.domInteractive = navTiming.domInteractive - navTiming.fetchStart;
        }

        // Get paint timing
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry: any) => {
          if (entry.name === 'first-paint') {
            perfData.firstPaint = entry.startTime;
          }
          if (entry.name === 'first-contentful-paint') {
            perfData.fcp = entry.startTime;
          }
        });

        // Wait a bit for LCP
        setTimeout(() => {
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries.length > 0) {
            const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
            perfData.lcp = lastEntry.renderTime || lastEntry.loadTime;
          }
          resolve(perfData);
        }, 2000);
      });
    });

    console.log('\n=== CORE WEB VITALS ===');
    console.log(`TTFB (Time to First Byte): ${metrics.ttfb?.toFixed(0) || 'N/A'}ms`);
    console.log(`FCP (First Contentful Paint): ${metrics.fcp?.toFixed(0) || 'N/A'}ms`);
    console.log(`LCP (Largest Contentful Paint): ${metrics.lcp?.toFixed(0) || 'N/A'}ms`);
    console.log(`DOM Interactive: ${metrics.domInteractive?.toFixed(0) || 'N/A'}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded?.toFixed(0) || 'N/A'}ms`);
    console.log(`Load Complete: ${metrics.loadComplete?.toFixed(0) || 'N/A'}ms`);

    // Thresholds based on Google's recommendations
    // TTFB: Good < 600ms
    if (metrics.ttfb) {
      const ttfbRating = metrics.ttfb < 600 ? 'GOOD' : metrics.ttfb < 1800 ? 'NEEDS IMPROVEMENT' : 'POOR';
      console.log(`TTFB Rating: ${ttfbRating}`);
    }

    // FCP: Good < 1800ms
    if (metrics.fcp) {
      const fcpRating = metrics.fcp < 1800 ? 'GOOD' : metrics.fcp < 3000 ? 'NEEDS IMPROVEMENT' : 'POOR';
      console.log(`FCP Rating: ${fcpRating}`);
      expect(metrics.fcp).toBeLessThan(3000);
    }

    // LCP: Good < 2500ms
    if (metrics.lcp) {
      const lcpRating = metrics.lcp < 2500 ? 'GOOD' : metrics.lcp < 4000 ? 'NEEDS IMPROVEMENT' : 'POOR';
      console.log(`LCP Rating: ${lcpRating}`);
      expect(metrics.lcp).toBeLessThan(4000);
    }
  });

  test('should have acceptable JavaScript bundle performance', async ({ page }) => {
    const resourceTimings: any[] = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('node_modules')) {
        resourceTimings.push({
          url: url.split('/').pop(),
          size: response.headers()['content-length'] || 'unknown',
          status: response.status()
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== JAVASCRIPT BUNDLES ===');
    resourceTimings.forEach(resource => {
      const sizeKB = resource.size !== 'unknown' ?
        `${(parseInt(resource.size) / 1024).toFixed(1)}KB` : 'unknown';
      console.log(`${resource.url}: ${sizeKB}`);
    });

    // Should load JS bundles
    expect(resourceTimings.length).toBeGreaterThan(0);
  });

  test('should render Shunt module quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Navigate to Shunt
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();

      // Wait for textarea to be visible
      const textarea = page.locator('textarea').first();
      await textarea.waitFor({ state: 'visible', timeout: 5000 });

      const renderTime = Date.now() - startTime;

      console.log(`\n=== SHUNT MODULE RENDER ===`);
      console.log(`Time to interactive: ${renderTime}ms`);

      // Target: < 1000ms for module render
      expect(renderTime).toBeLessThan(2000);
    }
  });

  test('should handle rapid navigation without performance degradation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tabs = ['shunt', 'settings'];
    const switchTimes: number[] = [];

    for (let i = 0; i < 5; i++) {
      for (const tabName of tabs) {
        const startTime = Date.now();
        const tab = page.getByRole('button', { name: new RegExp(tabName, 'i') }).first();

        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(100); // Brief wait for render
          switchTimes.push(Date.now() - startTime);
        }
      }
    }

    if (switchTimes.length > 0) {
      const avgTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      const maxTime = Math.max(...switchTimes);

      console.log(`\n=== NAVIGATION PERFORMANCE ===`);
      console.log(`Average switch time: ${avgTime.toFixed(0)}ms`);
      console.log(`Max switch time: ${maxTime}ms`);
      console.log(`Total switches: ${switchTimes.length}`);

      // No significant degradation - max should not be too much higher than avg
      expect(maxTime).toBeLessThan(avgTime * 3);
    }
  });

  test('should not have memory leaks on repeated actions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial memory (if available)
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Navigate to Shunt and perform actions
    const shuntTab = page.getByRole('button', { name: /shunt/i }).first();
    if (await shuntTab.isVisible()) {
      await shuntTab.click();
      await page.waitForTimeout(500);

      // Perform repeated actions
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible()) {
        for (let i = 0; i < 10; i++) {
          await textarea.fill(`Test input ${i} - ${Date.now()}`);
          await page.waitForTimeout(100);
          await textarea.clear();
        }
      }
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

      console.log(`\n=== MEMORY USAGE ===`);
      console.log(`Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Increase: ${memoryIncrease.toFixed(1)}%`);

      // Memory should not increase more than 50%
      expect(memoryIncrease).toBeLessThan(50);
    } else {
      console.log('\nMemory API not available in this browser');
    }
  });
});

test.describe('Performance Summary Report', () => {
  test('generate performance baseline report', async ({ page }) => {
    console.log('\n========================================');
    console.log('   PERFORMANCE BASELINE REPORT');
    console.log('========================================\n');

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const totalLoadTime = Date.now() - startTime;

    // Collect all metrics
    const metrics: PerformanceMetrics = await page.evaluate(() => {
      const data: any = {};

      // Navigation timing
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        data.dns = nav.domainLookupEnd - nav.domainLookupStart;
        data.tcp = nav.connectEnd - nav.connectStart;
        data.ttfb = nav.responseStart - nav.requestStart;
        data.download = nav.responseEnd - nav.responseStart;
        data.domParsing = nav.domInteractive - nav.responseEnd;
        data.domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
        data.loadComplete = nav.loadEventEnd - nav.fetchStart;
      }

      // Paint timing
      performance.getEntriesByType('paint').forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          data.fcp = entry.startTime;
        }
      });

      // Resource count
      const resources = performance.getEntriesByType('resource');
      data.resourceCount = resources.length;
      data.totalResourceSize = resources.reduce((sum: number, r: any) =>
        sum + (r.transferSize || 0), 0);

      return data;
    });

    console.log('TIMING BREAKDOWN:');
    console.log(`  DNS Lookup: ${metrics.dns?.toFixed(0) || 'N/A'}ms`);
    console.log(`  TCP Connection: ${metrics.tcp?.toFixed(0) || 'N/A'}ms`);
    console.log(`  TTFB: ${metrics.ttfb?.toFixed(0) || 'N/A'}ms`);
    console.log(`  Download: ${metrics.download?.toFixed(0) || 'N/A'}ms`);
    console.log(`  DOM Parsing: ${metrics.domParsing?.toFixed(0) || 'N/A'}ms`);

    console.log('\nKEY METRICS:');
    console.log(`  First Contentful Paint: ${metrics.fcp?.toFixed(0) || 'N/A'}ms`);
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded?.toFixed(0) || 'N/A'}ms`);
    console.log(`  Load Complete: ${metrics.loadComplete?.toFixed(0) || 'N/A'}ms`);
    console.log(`  Total (measured): ${totalLoadTime}ms`);

    console.log('\nRESOURCE SUMMARY:');
    console.log(`  Total Resources: ${metrics.resourceCount}`);
    console.log(`  Total Size: ${(metrics.totalResourceSize / 1024).toFixed(0)}KB`);

    console.log('\n========================================');
    console.log('   END PERFORMANCE REPORT');
    console.log('========================================\n');

    // Basic assertion to ensure page loads
    expect(totalLoadTime).toBeLessThan(10000);
  });
});
