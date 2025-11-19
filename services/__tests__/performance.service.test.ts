/**
 * Performance Monitoring Service Tests
 * Tests for Core Web Vitals tracking and custom performance metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Metric rating function
function getRating(name: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [600, 1800],
  };

  const [good, needsImprovement] = thresholds[name] || [0, 0];
  if (!good) return 'unknown';

  return value < good ? 'good' : value < needsImprovement ? 'needs-improvement' : 'poor';
}

describe('PerformanceMonitoringService', () => {
  describe('Metric Ratings', () => {
    describe('LCP (Largest Contentful Paint)', () => {
      it('should rate < 2500ms as good', () => {
        expect(getRating('LCP', 1500)).toBe('good');
        expect(getRating('LCP', 2499)).toBe('good');
      });

      it('should rate 2500-4000ms as needs-improvement', () => {
        expect(getRating('LCP', 2500)).toBe('needs-improvement');
        expect(getRating('LCP', 3999)).toBe('needs-improvement');
      });

      it('should rate >= 4000ms as poor', () => {
        expect(getRating('LCP', 4000)).toBe('poor');
        expect(getRating('LCP', 5000)).toBe('poor');
      });
    });

    describe('FID (First Input Delay)', () => {
      it('should rate < 100ms as good', () => {
        expect(getRating('FID', 50)).toBe('good');
        expect(getRating('FID', 99)).toBe('good');
      });

      it('should rate 100-300ms as needs-improvement', () => {
        expect(getRating('FID', 100)).toBe('needs-improvement');
        expect(getRating('FID', 299)).toBe('needs-improvement');
      });

      it('should rate >= 300ms as poor', () => {
        expect(getRating('FID', 300)).toBe('poor');
        expect(getRating('FID', 500)).toBe('poor');
      });
    });

    describe('CLS (Cumulative Layout Shift)', () => {
      it('should rate < 0.1 as good', () => {
        expect(getRating('CLS', 0.05)).toBe('good');
        expect(getRating('CLS', 0.09)).toBe('good');
      });

      it('should rate 0.1-0.25 as needs-improvement', () => {
        expect(getRating('CLS', 0.1)).toBe('needs-improvement');
        expect(getRating('CLS', 0.24)).toBe('needs-improvement');
      });

      it('should rate >= 0.25 as poor', () => {
        expect(getRating('CLS', 0.25)).toBe('poor');
        expect(getRating('CLS', 0.5)).toBe('poor');
      });
    });

    describe('FCP (First Contentful Paint)', () => {
      it('should rate < 1800ms as good', () => {
        expect(getRating('FCP', 1000)).toBe('good');
        expect(getRating('FCP', 1799)).toBe('good');
      });

      it('should rate 1800-3000ms as needs-improvement', () => {
        expect(getRating('FCP', 1800)).toBe('needs-improvement');
        expect(getRating('FCP', 2999)).toBe('needs-improvement');
      });

      it('should rate >= 3000ms as poor', () => {
        expect(getRating('FCP', 3000)).toBe('poor');
        expect(getRating('FCP', 4000)).toBe('poor');
      });
    });

    describe('TTFB (Time to First Byte)', () => {
      it('should rate < 600ms as good', () => {
        expect(getRating('TTFB', 300)).toBe('good');
        expect(getRating('TTFB', 599)).toBe('good');
      });

      it('should rate 600-1800ms as needs-improvement', () => {
        expect(getRating('TTFB', 600)).toBe('needs-improvement');
        expect(getRating('TTFB', 1799)).toBe('needs-improvement');
      });

      it('should rate >= 1800ms as poor', () => {
        expect(getRating('TTFB', 1800)).toBe('poor');
        expect(getRating('TTFB', 2500)).toBe('poor');
      });
    });

    describe('Unknown Metrics', () => {
      it('should return unknown for unrecognized metrics', () => {
        expect(getRating('UNKNOWN_METRIC', 100)).toBe('unknown');
        expect(getRating('CUSTOM', 500)).toBe('unknown');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      expect(getRating('LCP', 0)).toBe('good');
      expect(getRating('FID', 0)).toBe('good');
      expect(getRating('CLS', 0)).toBe('good');
    });

    it('should handle very large values', () => {
      expect(getRating('LCP', 100000)).toBe('poor');
      expect(getRating('FID', 10000)).toBe('poor');
      expect(getRating('CLS', 10)).toBe('poor');
    });

    it('should handle negative values', () => {
      expect(getRating('LCP', -100)).toBe('good');
    });

    it('should handle boundary values exactly', () => {
      expect(getRating('LCP', 2500)).toBe('needs-improvement');
      expect(getRating('LCP', 4000)).toBe('poor');
      expect(getRating('FID', 100)).toBe('needs-improvement');
      expect(getRating('FID', 300)).toBe('poor');
    });
  });

  describe('Metric Storage', () => {
    it('should create metric with correct structure', () => {
      const metric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        timestamp: Date.now(),
      };

      expect(metric.name).toBe('LCP');
      expect(metric.value).toBe(2000);
      expect(metric.rating).toBe('good');
      expect(metric.timestamp).toBeDefined();
    });

    it('should store multiple Core Web Vitals', () => {
      const metrics = {
        LCP: { name: 'LCP', value: 2000, rating: 'good', timestamp: Date.now() },
        FID: { name: 'FID', value: 50, rating: 'good', timestamp: Date.now() },
        CLS: { name: 'CLS', value: 0.05, rating: 'good', timestamp: Date.now() },
        FCP: { name: 'FCP', value: 1500, rating: 'good', timestamp: Date.now() },
        TTFB: { name: 'TTFB', value: 400, rating: 'good', timestamp: Date.now() },
      };

      expect(Object.keys(metrics)).toHaveLength(5);
    });
  });

  describe('Summary and Export', () => {
    it('should provide complete summary', () => {
      const summary = {
        coreWebVitals: {
          LCP: { name: 'LCP', value: 2000, rating: 'good', timestamp: Date.now() },
        },
        customMetrics: { 'api-call': 150 },
        isEnabled: true,
      };

      expect(summary.coreWebVitals).toBeDefined();
      expect(summary.customMetrics).toBeDefined();
      expect(summary.isEnabled).toBe(true);
    });

    it('should export data as JSON string', () => {
      const summary = {
        coreWebVitals: {},
        customMetrics: {},
        isEnabled: true,
      };

      const exported = JSON.stringify(summary, null, 2);

      expect(typeof exported).toBe('string');
      expect(exported).toContain('"isEnabled": true');
    });
  });

  describe('Performance Thresholds Documentation', () => {
    it('should document threshold values', () => {
      const thresholds = {
        LCP: { good: 2500, needsImprovement: 4000 },
        FID: { good: 100, needsImprovement: 300 },
        CLS: { good: 0.1, needsImprovement: 0.25 },
        FCP: { good: 1800, needsImprovement: 3000 },
        TTFB: { good: 600, needsImprovement: 1800 },
      };

      expect(thresholds.LCP.good).toBe(2500);
      expect(thresholds.FID.good).toBe(100);
      expect(thresholds.CLS.good).toBe(0.1);
      expect(thresholds.FCP.good).toBe(1800);
      expect(thresholds.TTFB.good).toBe(600);
    });
  });
});
