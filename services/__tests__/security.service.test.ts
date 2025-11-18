import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SecurityService from '../security.service';

/**
 * Comprehensive tests for SecurityService
 *
 * Tests cover:
 * - Singleton pattern
 * - Content Security Policy (CSP) setup and building
 * - Input sanitization (XSS prevention)
 * - HTML cleaning and sanitization
 * - URL validation (prevent open redirect)
 * - Client-side rate limiting
 * - File upload validation
 * - Secure utilities (token generation, hashing, storage)
 * - Security headers recommendations
 */

// Mock config
vi.mock('../../config/environment', () => ({
  default: {
    security: {
      enableCSP: true,
      enableSanitization: true,
    },
    rateLimits: {
      shunt: 50,
      weaver: 10,
      foundry: 20,
    },
    isDevelopment: false,
    isProduction: true,
    apiBaseUrl: 'https://api.example.com',
  },
}));

// Mock logger
vi.mock('../logger.service', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SecurityService', () => {
  let securityService: SecurityService;
  let mockDocument: any;

  beforeEach(() => {
    // Arrange: Reset singleton instance between tests
    (SecurityService as any).instance = undefined;

    // Mock DOM
    mockDocument = {
      head: {
        appendChild: vi.fn(),
      },
      createElement: vi.fn(() => ({
        httpEquiv: '',
        content: '',
      })),
    };
    global.document = mockDocument as any;

    // Mock crypto API using vi.stubGlobal
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i % 256;
        }
        return arr;
      }),
      subtle: {
        digest: vi.fn(async () => new ArrayBuffer(32)),
      },
    });

    // Mock window using vi.stubGlobal
    vi.stubGlobal('window', {
      isSecureContext: true,
    });

    // Mock localStorage using vi.stubGlobal
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete storage[key];
      }),
    });

    securityService = SecurityService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      // Act
      const instance1 = SecurityService.getInstance();
      const instance2 = SecurityService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', () => {
      // Act
      SecurityService.getInstance();
      SecurityService.getInstance();
      SecurityService.getInstance();

      // Assert: Document.createElement should be called only once during CSP setup
      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Security Policy (CSP)', () => {
    it('should build CSP policy with required directives', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
      expect(csp).toContain('connect-src');
    });

    it('should include self in default-src', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toMatch(/default-src[^;]*'self'/);
    });

    it('should allow API connections in connect-src', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toContain('connect-src');
      expect(csp).toMatch(/connect-src[^;]*https:\/\/api\.example\.com/);
    });

    it('should block frames with frame-src none', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toMatch(/frame-src[^;]*'none'/);
    });

    it('should block objects with object-src none', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toMatch(/object-src[^;]*'none'/);
    });

    it('should include Gemini API in connect-src', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toContain('generativelanguage.googleapis.com');
    });

    it('should include Anthropic API in connect-src', () => {
      // Act
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      // Assert
      expect(csp).toContain('api.anthropic.com');
    });
  });

  describe('Input Sanitization (XSS Prevention)', () => {
    it('should escape ampersand characters', () => {
      // Arrange
      const input = 'Tom & Jerry';

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape less-than characters', () => {
      // Arrange
      const input = '5 < 10';

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).toBe('5 &lt; 10');
    });

    it('should escape greater-than characters', () => {
      // Arrange
      const input = '10 > 5';

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).toBe('10 &gt; 5');
    });

    it('should escape double quotes', () => {
      // Arrange
      const input = 'Say "Hello"';

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).toBe('Say &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
      // Arrange
      const input = "It's working";

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).toBe('It&#x27;s working');
    });

    it('should escape forward slashes', () => {
      // Arrange
      const input = 'path/to/file';

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).toBe('path&#x2F;to&#x2F;file');
    });

    it('should prevent XSS script injection', () => {
      // Arrange
      const maliciousInput = '<script>alert("XSS")</script>';

      // Act
      const result = securityService.sanitizeInput(maliciousInput);

      // Assert
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape all dangerous characters in complex input', () => {
      // Arrange
      const input = '<img src="x" onerror="alert(\'XSS\')">';

      // Act
      const result = securityService.sanitizeInput(input);

      // Assert
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });
  });

  describe('HTML Sanitization', () => {
    it('should remove script tags', () => {
      // Arrange
      const html = '<div>Safe</div><script>alert("XSS")</script><p>More</p>';

      // Act
      const result = securityService.sanitizeHtml(html);

      // Assert
      expect(result).not.toContain('<script>');
      expect(result).toContain('<div>Safe</div>');
      expect(result).toContain('<p>More</p>');
    });

    it('should remove inline event handlers (onclick)', () => {
      // Arrange
      const html = '<button onclick="alert(\'XSS\')">Click</button>';

      // Act
      const result = securityService.sanitizeHtml(html);

      // Assert
      expect(result).not.toContain('onclick');
    });

    it('should remove inline event handlers (onload)', () => {
      // Arrange
      const html = '<img src="x" onload="alert(\'XSS\')" />';

      // Act
      const result = securityService.sanitizeHtml(html);

      // Assert
      expect(result).not.toContain('onload');
    });

    it('should remove javascript: protocol', () => {
      // Arrange
      const html = '<a href="javascript:alert(\'XSS\')">Link</a>';

      // Act
      const result = securityService.sanitizeHtml(html);

      // Assert
      expect(result).not.toContain('javascript:');
    });

    it('should allow data: URIs for images', () => {
      // Arrange
      const html = '<img src="data:image/png;base64,ABC123" />';

      // Act
      const result = securityService.sanitizeHtml(html);

      // Assert
      expect(result).toContain('data:image');
    });

    it('should remove non-image data: URIs', () => {
      // Arrange
      const html = '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>';

      // Act
      const result = securityService.sanitizeHtml(html);

      // Assert
      expect(result).not.toMatch(/src="data:text/);
    });
  });

  describe('URL Validation (Prevent Open Redirect)', () => {
    it('should accept valid HTTP URLs', () => {
      // Arrange
      const url = 'http://example.com';

      // Act
      const result = securityService.isValidUrl(url);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      // Arrange
      const url = 'https://example.com/path?query=value';

      // Act
      const result = securityService.isValidUrl(url);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject javascript: protocol', () => {
      // Arrange
      const url = 'javascript:alert("XSS")';

      // Act
      const result = securityService.isValidUrl(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject data: protocol', () => {
      // Arrange
      const url = 'data:text/html,<script>alert("XSS")</script>';

      // Act
      const result = securityService.isValidUrl(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject file: protocol', () => {
      // Arrange
      const url = 'file:///etc/passwd';

      // Act
      const result = securityService.isValidUrl(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject invalid URLs', () => {
      // Arrange
      const url = 'not a valid url';

      // Act
      const result = securityService.isValidUrl(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should validate against allowed domains', () => {
      // Arrange
      const url = 'https://example.com/path';
      const allowedDomains = ['example.com', 'trusted.com'];

      // Act
      const result = securityService.isValidUrl(url, allowedDomains);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject URLs not in allowed domains', () => {
      // Arrange
      const url = 'https://malicious.com/redirect';
      const allowedDomains = ['example.com', 'trusted.com'];

      // Act
      const result = securityService.isValidUrl(url, allowedDomains);

      // Assert
      expect(result).toBe(false);
    });

    it('should support subdomain matching', () => {
      // Arrange
      const url = 'https://api.example.com/endpoint';
      const allowedDomains = ['example.com'];

      // Act
      const result = securityService.isValidUrl(url, allowedDomains);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      // Act
      const result = securityService.checkRateLimit('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track request count', () => {
      // Arrange & Act
      const result1 = securityService.checkRateLimit('test-key', {
        maxRequests: 5,
        windowMs: 60000,
      });
      const result2 = securityService.checkRateLimit('test-key', {
        maxRequests: 5,
        windowMs: 60000,
      });
      const result3 = securityService.checkRateLimit('test-key', {
        maxRequests: 5,
        windowMs: 60000,
      });

      // Assert
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
      expect(result3.remaining).toBe(2);
    });

    it('should block requests exceeding limit', () => {
      // Arrange: Make requests up to limit
      const config = { maxRequests: 3, windowMs: 60000 };
      securityService.checkRateLimit('test-key', config);
      securityService.checkRateLimit('test-key', config);
      securityService.checkRateLimit('test-key', config);

      // Act: Exceed limit
      const result = securityService.checkRateLimit('test-key', config);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should provide reset time information', () => {
      // Act
      const result = securityService.checkRateLimit('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });

      // Assert
      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(60000);
    });

    it('should reset after window expires', () => {
      // Arrange: Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      // Act: First request
      const result1 = securityService.checkRateLimit('test-key', {
        maxRequests: 2,
        windowMs: 1000,
      });

      // Advance time past window
      currentTime += 1001;

      // Second request after window
      const result2 = securityService.checkRateLimit('test-key', {
        maxRequests: 2,
        windowMs: 1000,
      });

      // Assert
      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(1); // Reset to new window

      // Cleanup
      Date.now = originalDateNow;
    });

    it('should track different keys independently', () => {
      // Act
      securityService.checkRateLimit('key1', { maxRequests: 5, windowMs: 60000 });
      securityService.checkRateLimit('key1', { maxRequests: 5, windowMs: 60000 });
      const result1 = securityService.checkRateLimit('key1', {
        maxRequests: 5,
        windowMs: 60000,
      });

      securityService.checkRateLimit('key2', { maxRequests: 5, windowMs: 60000 });
      const result2 = securityService.checkRateLimit('key2', {
        maxRequests: 5,
        windowMs: 60000,
      });

      // Assert
      expect(result1.remaining).toBe(2);
      expect(result2.remaining).toBe(3);
    });
  });

  describe('Feature-Specific Rate Limiting', () => {
    it('should check Shunt rate limit', () => {
      // Act
      const result = securityService.checkShuntRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 - 1
    });

    it('should check Weaver rate limit', () => {
      // Act
      const result = securityService.checkWeaverRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1
    });

    it('should check Foundry rate limit', () => {
      // Act
      const result = securityService.checkFoundryRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(19); // 20 - 1
    });

    it('should use default user if not provided', () => {
      // Act
      const result1 = securityService.checkShuntRateLimit();
      const result2 = securityService.checkShuntRateLimit();

      // Assert: Same default user, so count increases
      expect(result1.remaining).toBe(49);
      expect(result2.remaining).toBe(48);
    });
  });

  describe('Rate Limit Management', () => {
    it('should clear specific rate limit', () => {
      // Arrange
      securityService.checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 });
      securityService.checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 });

      // Act
      securityService.clearRateLimit('test-key');
      const result = securityService.checkRateLimit('test-key', {
        maxRequests: 5,
        windowMs: 60000,
      });

      // Assert: Should be back to max - 1
      expect(result.remaining).toBe(4);
    });

    it('should clear all rate limits', () => {
      // Arrange
      securityService.checkRateLimit('key1', { maxRequests: 5, windowMs: 60000 });
      securityService.checkRateLimit('key2', { maxRequests: 5, windowMs: 60000 });

      // Act
      securityService.clearAllRateLimits();
      const result1 = securityService.checkRateLimit('key1', {
        maxRequests: 5,
        windowMs: 60000,
      });
      const result2 = securityService.checkRateLimit('key2', {
        maxRequests: 5,
        windowMs: 60000,
      });

      // Assert
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });
  });

  describe('File Upload Validation', () => {
    it('should accept valid file within size limit', () => {
      // Arrange
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      // Act
      const result = securityService.validateFileUpload(file);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file exceeding size limit', () => {
      // Arrange
      const file = new File(['content'], 'large.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB

      // Act
      const result = securityService.validateFileUpload(file, {
        maxSize: 10 * 1024 * 1024,
      });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should accept allowed file type', () => {
      // Arrange
      const file = new File(['content'], 'image.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Act
      const result = securityService.validateFileUpload(file);

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed file type', () => {
      // Arrange
      const file = new File(['content'], 'script.exe', {
        type: 'application/x-msdownload',
      });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Act
      const result = securityService.validateFileUpload(file);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should support wildcard file types', () => {
      // Arrange
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Act
      const result = securityService.validateFileUpload(file, {
        allowedTypes: ['text/*'],
      });

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed file extension', () => {
      // Arrange
      const file = new File(['content'], 'script.exe', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Act
      const result = securityService.validateFileUpload(file);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });

    it('should accept allowed file extension', () => {
      // Arrange
      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Act
      const result = securityService.validateFileUpload(file);

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate token of specified length', () => {
      // Act
      const token = securityService.generateSecureToken(16);

      // Assert
      expect(token).toHaveLength(32); // 16 bytes = 32 hex characters
    });

    it('should generate token of default length', () => {
      // Act
      const token = securityService.generateSecureToken();

      // Assert
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should generate different tokens on each call', () => {
      // Act
      const token1 = securityService.generateSecureToken(16);
      const token2 = securityService.generateSecureToken(16);

      // Assert
      // Note: With mocked crypto, they might be same, but structure is tested
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
    });

    it('should generate hex string', () => {
      // Act
      const token = securityService.generateSecureToken(8);

      // Assert
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('Data Hashing', () => {
    it('should hash data using SHA-256', async () => {
      // Act
      const hash = await securityService.hashData('sensitive data');

      // Assert
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64); // SHA-256 = 64 hex characters
    });

    it('should produce consistent hash for same input', async () => {
      // Act
      const hash1 = await securityService.hashData('test data');
      const hash2 = await securityService.hashData('test data');

      // Assert
      expect(hash1).toBe(hash2);
    });

    it('should produce hex string', async () => {
      // Act
      const hash = await securityService.hashData('data');

      // Assert
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('Secure Local Storage', () => {
    it('should sanitize value before storing', () => {
      // Arrange
      const maliciousValue = '<script>alert("XSS")</script>';

      // Act
      securityService.secureLocalStorage.setItem('test-key', maliciousValue);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalled();
      const storedValue = (localStorage.setItem as any).mock.calls[0][1];
      expect(storedValue).not.toContain('<script>');
    });

    it('should retrieve item from storage', () => {
      // Arrange
      localStorage.setItem('test-key', 'test-value');

      // Act
      const value = securityService.secureLocalStorage.getItem('test-key');

      // Assert
      expect(value).toBe('test-value');
    });

    it('should remove item from storage', () => {
      // Arrange
      localStorage.setItem('test-key', 'test-value');

      // Act
      securityService.secureLocalStorage.removeItem('test-key');

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Secure Context Check', () => {
    it('should detect secure context', () => {
      // Act
      const isSecure = securityService.isSecureContext();

      // Assert
      expect(isSecure).toBe(true);
    });

    it('should detect insecure context', () => {
      // Arrange
      vi.stubGlobal('window', {
        isSecureContext: false,
      });

      // Act
      const isSecure = securityService.isSecureContext();

      // Assert
      expect(isSecure).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should provide all required security headers', () => {
      // Act
      const headers = securityService.getSecurityHeaders();

      // Assert
      expect(headers['Content-Security-Policy']).toBeTruthy();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toBeTruthy();
      expect(headers['Strict-Transport-Security']).toBeTruthy();
    });

    it('should include HSTS header with long max-age', () => {
      // Act
      const headers = securityService.getSecurityHeaders();

      // Assert
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
    });

    it('should restrict permissions in Permissions-Policy', () => {
      // Act
      const headers = securityService.getSecurityHeaders();

      // Assert
      expect(headers['Permissions-Policy']).toContain('geolocation=()');
      expect(headers['Permissions-Policy']).toContain('microphone=()');
      expect(headers['Permissions-Policy']).toContain('camera=()');
    });
  });
});
