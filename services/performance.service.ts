// services/performance.service.ts
/**
 * Frontend Performance Monitoring Service
 * Tracks Core Web Vitals and custom performance metrics
 */

import config from '../config/environment';
import { logger } from './logger.service';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface CoreWebVitals {
  LCP?: PerformanceMetric; // Largest Contentful Paint
  FID?: PerformanceMetric; // First Input Delay
  CLS?: PerformanceMetric; // Cumulative Layout Shift
  FCP?: PerformanceMetric; // First Contentful Paint
  TTFB?: PerformanceMetric; // Time to First Byte
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: CoreWebVitals = {};
  private customMetrics: Map<string, number> = new Map();
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = config.features.performanceMonitoring;
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring() {
    // Monitor Core Web Vitals using PerformanceObserver
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // Log page load metrics
    if (document.readyState === 'complete') {
      this.logPageLoadMetrics();
    } else {
      window.addEventListener('load', () => this.logPageLoadMetrics());
    }

    logger.info('Performance monitoring initialized');
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   * Target: < 2.5s (good), < 4s (needs improvement), >= 4s (poor)
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.metrics.LCP = {
          name: 'LCP',
          value: lcp,
          rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        };

        logger.debug('LCP measured', { lcp, rating: this.metrics.LCP.rating });
        this.sendMetricToAnalytics('LCP', lcp);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      logger.warn('LCP observation not supported', error);
    }
  }

  /**
   * Observe First Input Delay (FID)
   * Target: < 100ms (good), < 300ms (needs improvement), >= 300ms (poor)
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.FID = {
            name: 'FID',
            value: fid,
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
          };

          logger.debug('FID measured', { fid, rating: this.metrics.FID.rating });
          this.sendMetricToAnalytics('FID', fid);
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      logger.warn('FID observation not supported', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   * Target: < 0.1 (good), < 0.25 (needs improvement), >= 0.25 (poor)
   */
  private observeCLS() {
    try {
      let clsValue = 0;
      let clsEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });

        this.metrics.CLS = {
          name: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        };

        logger.debug('CLS measured', { cls: clsValue, rating: this.metrics.CLS.rating });
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Send final CLS on page unload
      window.addEventListener('beforeunload', () => {
        if (this.metrics.CLS) {
          this.sendMetricToAnalytics('CLS', this.metrics.CLS.value);
        }
      });
    } catch (error) {
      logger.warn('CLS observation not supported', error);
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   * Target: < 1.8s (good), < 3s (needs improvement), >= 3s (poor)
   */
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            this.metrics.FCP = {
              name: 'FCP',
              value: fcp,
              rating: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            };

            logger.debug('FCP measured', { fcp, rating: this.metrics.FCP.rating });
            this.sendMetricToAnalytics('FCP', fcp);
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      logger.warn('FCP observation not supported', error);
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   * Target: < 600ms (good), < 1800ms (needs improvement), >= 1800ms (poor)
   */
  private observeTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const ttfb = entry.responseStart - entry.requestStart;
          this.metrics.TTFB = {
            name: 'TTFB',
            value: ttfb,
            rating: ttfb < 600 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
          };

          logger.debug('TTFB measured', { ttfb, rating: this.metrics.TTFB.rating });
          this.sendMetricToAnalytics('TTFB', ttfb);
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      logger.warn('TTFB observation not supported', error);
    }
  }

  /**
   * Log overall page load metrics
   */
  private logPageLoadMetrics() {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!perfData) return;

    const metrics = {
      dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcpConnection: perfData.connectEnd - perfData.connectStart,
      serverResponse: perfData.responseEnd - perfData.requestStart,
      domProcessing: perfData.domComplete - perfData.domInteractive,
      pageLoad: perfData.loadEventEnd - perfData.fetchStart,
    };

    logger.info('Page load metrics', metrics);
  }

  /**
   * Measure custom performance metric
   */
  measure(name: string, startMark: string, endMark?: string) {
    if (!this.isEnabled) return;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.customMetrics.set(name, measure.duration);
        logger.debug(`Performance measure: ${name}`, { duration: measure.duration });
        this.sendMetricToAnalytics(`custom_${name}`, measure.duration);
      }
    } catch (error) {
      logger.warn(`Failed to measure ${name}`, error);
    }
  }

  /**
   * Mark a performance timestamp
   */
  mark(name: string) {
    if (!this.isEnabled) return;

    try {
      performance.mark(name);
    } catch (error) {
      logger.warn(`Failed to mark ${name}`, error);
    }
  }

  /**
   * Clear performance marks and measures
   */
  clearMarks(name?: string) {
    if (!this.isEnabled) return;

    if (name) {
      performance.clearMarks(name);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Send metric to analytics services
   */
  private sendMetricToAnalytics(name: string, value: number) {
    if (!config.features.analytics) return;

    // Send to Google Analytics 4 (if configured)
    if (config.integrations.gaTrackingId && typeof window.gtag === 'function') {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: Math.round(value),
        metric_rating: this.getRating(name, value),
      });
    }

    // Send to PostHog (if configured)
    if (config.integrations.posthogKey && typeof window.posthog !== 'undefined') {
      window.posthog.capture('performance_metric', {
        metric_name: name,
        metric_value: value,
      });
    }
  }

  /**
   * Get rating for a metric value
   */
  private getRating(name: string, value: number): string {
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

  /**
   * Get all Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals {
    return { ...this.metrics };
  }

  /**
   * Get custom metrics
   */
  getCustomMetrics(): Record<string, number> {
    return Object.fromEntries(this.customMetrics);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    return {
      coreWebVitals: this.getCoreWebVitals(),
      customMetrics: this.getCustomMetrics(),
      isEnabled: this.isEnabled,
    };
  }

  /**
   * Export performance data
   */
  exportData(): string {
    return JSON.stringify(this.getSummary(), null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();

// Export class for testing
export default PerformanceMonitoringService;

// Type augmentation for global gtag and posthog
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    posthog?: any;
  }
}
