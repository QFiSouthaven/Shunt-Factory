// services/security.service.ts
/**
 * Security Hardening Service
 * CSP, Input Sanitization, Rate Limiting, and XSS Protection
 */

import config from '../config/environment';
import { logger } from './logger.service';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

class SecurityService {
  private static instance: SecurityService;
  private rateLimitMap: Map<string, RateLimitState> = new Map();

  private constructor() {
    if (config.security.enableCSP) {
      this.setupContentSecurityPolicy();
    }
    logger.info('Security service initialized', {
      cspEnabled: config.security.enableCSP,
      sanitizationEnabled: config.security.enableSanitization,
    });
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Setup Content Security Policy
   */
  private setupContentSecurityPolicy() {
    // Note: CSP is best implemented via HTTP headers on the server
    // This is a meta tag fallback for client-side enforcement
    const cspContent = this.buildCSPPolicy();

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspContent;
    document.head.appendChild(meta);

    logger.info('CSP meta tag added', { policy: cspContent });
  }

  /**
   * Build CSP policy string
   */
  private buildCSPPolicy(): string {
    const policy = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React and Vite in dev
        config.isDevelopment ? "'unsafe-eval'" : "", // Only in dev
        'https://cdn.tailwindcss.com', // Tailwind CDN
      ].filter(Boolean),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled components
        'https://cdn.tailwindcss.com',
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:', // For base64 images
        'blob:', // For object URLs
        'https:', // Allow HTTPS images
      ],
      'font-src': [
        "'self'",
        'data:',
        'https://fonts.gstatic.com',
      ],
      'connect-src': [
        "'self'",
        'https://generativelanguage.googleapis.com', // Gemini API
        'https://api.anthropic.com', // Anthropic API
        config.apiBaseUrl || '', // Backend API
      ].filter(Boolean),
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': config.isProduction ? [] : undefined,
    };

    return Object.entries(policy)
      .filter(([_, value]) => value !== undefined)
      .map(([directive, sources]) => {
        if (Array.isArray(sources) && sources.length > 0) {
          return `${directive} ${sources.join(' ')}`;
        }
        return directive;
      })
      .join('; ');
  }

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    if (!config.security.enableSanitization) {
      return input;
    }

    // Basic XSS prevention - escape HTML characters
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Sanitize HTML content more aggressively
   */
  sanitizeHtml(html: string): string {
    if (!config.security.enableSanitization) {
      return html;
    }

    // Remove script tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    html = html.replace(/javascript:/gi, '');

    // Remove data: URIs (except images)
    html = html.replace(/src\s*=\s*["']data:(?!image)/gi, 'src="');

    return html;
  }

  /**
   * Validate URL to prevent open redirect
   */
  isValidUrl(url: string, allowedDomains?: string[]): boolean {
    try {
      const parsed = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Check allowed domains if specified
      if (allowedDomains && allowedDomains.length > 0) {
        return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rate limiting check (client-side)
   */
  checkRateLimit(
    key: string,
    config: RateLimitConfig = { maxRequests: 50, windowMs: 60000 }
  ): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const state = this.rateLimitMap.get(key);

    // No existing state or window expired
    if (!state || now >= state.resetTime) {
      const newState: RateLimitState = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.rateLimitMap.set(key, newState);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetIn: config.windowMs,
      };
    }

    // Increment count
    state.count++;
    this.rateLimitMap.set(key, state);

    const allowed = state.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - state.count);
    const resetIn = state.resetTime - now;

    if (!allowed) {
      logger.warn('Rate limit exceeded', { key, count: state.count, maxRequests: config.maxRequests });
    }

    return { allowed, remaining, resetIn };
  }

  /**
   * Rate limit for Shunt operations
   */
  checkShuntRateLimit(userId: string = 'default') {
    return this.checkRateLimit(`shunt:${userId}`, {
      maxRequests: config.rateLimits.shunt,
      windowMs: 60000, // 1 minute
    });
  }

  /**
   * Rate limit for Weaver operations
   */
  checkWeaverRateLimit(userId: string = 'default') {
    return this.checkRateLimit(`weaver:${userId}`, {
      maxRequests: config.rateLimits.weaver,
      windowMs: 60000, // 1 minute
    });
  }

  /**
   * Rate limit for Foundry operations
   */
  checkFoundryRateLimit(userId: string = 'default') {
    return this.checkRateLimit(`foundry:${userId}`, {
      maxRequests: config.rateLimits.foundry,
      windowMs: 60000, // 1 minute
    });
  }

  /**
   * Clear rate limit for a key
   */
  clearRateLimit(key: string) {
    this.rateLimitMap.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits() {
    this.rateLimitMap.clear();
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/*', 'application/pdf', 'text/*'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.md', '.json'],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
      };
    }

    // Check file type
    const typeMatches = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!typeMatches) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} is not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data (for local storage)
   */
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Secure local storage (encrypt before storing)
   */
  secureLocalStorage = {
    setItem: (key: string, value: string) => {
      // In production, you might want to encrypt the value
      const sanitized = this.sanitizeInput(value);
      localStorage.setItem(key, sanitized);
    },

    getItem: (key: string): string | null => {
      return localStorage.getItem(key);
    },

    removeItem: (key: string) => {
      localStorage.removeItem(key);
    },
  };

  /**
   * Check if running in secure context
   */
  isSecureContext(): boolean {
    return window.isSecureContext;
  }

  /**
   * Get security headers recommendations
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.buildCSPPolicy(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
  }
}

// Export singleton instance
export const security = SecurityService.getInstance();

// Export class for testing
export default SecurityService;
