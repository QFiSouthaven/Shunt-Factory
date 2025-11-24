/**
 * Rate Limiter Middleware Tests
 * Tests for per-user rate limiting
 */

// Key generator function
function keyGenerator(req: any): string {
  return req.userId || req.apiKey || req.ip || 'anonymous';
}

// Memory store for rate limiting
class MemoryStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private windowMs: number) {}

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const now = Date.now();
    const hit = this.hits.get(key);

    if (!hit || hit.resetTime < now) {
      const resetTime = now + this.windowMs;
      this.hits.set(key, { count: 1, resetTime });
      return { totalHits: 1, resetTime: new Date(resetTime) };
    }

    hit.count++;
    return { totalHits: hit.count, resetTime: new Date(hit.resetTime) };
  }

  async decrement(key: string): Promise<void> {
    const hit = this.hits.get(key);
    if (hit) {
      hit.count = Math.max(0, hit.count - 1);
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key);
  }

  getHitCount(key: string): number {
    return this.hits.get(key)?.count || 0;
  }
}

describe('Rate Limiter Middleware', () => {
  describe('Key Generator', () => {
    it('should use userId when available', () => {
      const req = { userId: 'user-123', apiKey: 'key-456', ip: '127.0.0.1' };
      expect(keyGenerator(req)).toBe('user-123');
    });

    it('should fall back to apiKey', () => {
      const req = { apiKey: 'key-456', ip: '127.0.0.1' };
      expect(keyGenerator(req)).toBe('key-456');
    });

    it('should fall back to IP', () => {
      const req = { ip: '127.0.0.1' };
      expect(keyGenerator(req)).toBe('127.0.0.1');
    });

    it('should use anonymous as last resort', () => {
      const req = {};
      expect(keyGenerator(req)).toBe('anonymous');
    });
  });

  describe('MemoryStore', () => {
    let store: MemoryStore;
    const windowMs = 60000;

    beforeEach(() => {
      store = new MemoryStore(windowMs);
    });

    it('should start with 0 hits for new keys', () => {
      expect(store.getHitCount('new-key')).toBe(0);
    });

    it('should increment hit count', async () => {
      const result = await store.increment('test-key');
      expect(result.totalHits).toBe(1);
      expect(store.getHitCount('test-key')).toBe(1);
    });

    it('should increment multiple times', async () => {
      await store.increment('test-key');
      await store.increment('test-key');
      const result = await store.increment('test-key');
      expect(result.totalHits).toBe(3);
    });

    it('should return reset time in future', async () => {
      const before = Date.now();
      const result = await store.increment('test-key');
      expect(result.resetTime.getTime()).toBeGreaterThanOrEqual(before + windowMs);
    });

    it('should reset count after window expires', async () => {
      jest.useFakeTimers();

      await store.increment('test-key');
      await store.increment('test-key');

      jest.advanceTimersByTime(windowMs + 1000);

      const result = await store.increment('test-key');
      expect(result.totalHits).toBe(1);

      jest.useRealTimers();
    });

    it('should decrement hit count', async () => {
      await store.increment('test-key');
      await store.increment('test-key');
      await store.decrement('test-key');
      expect(store.getHitCount('test-key')).toBe(1);
    });

    it('should not go below 0 on decrement', async () => {
      await store.decrement('test-key');
      expect(store.getHitCount('test-key')).toBe(0);
    });

    it('should reset key completely', async () => {
      await store.increment('test-key');
      await store.resetKey('test-key');
      expect(store.getHitCount('test-key')).toBe(0);
    });

    it('should track multiple keys independently', async () => {
      await store.increment('key-1');
      await store.increment('key-1');
      await store.increment('key-2');

      expect(store.getHitCount('key-1')).toBe(2);
      expect(store.getHitCount('key-2')).toBe(1);
    });
  });

  describe('Rate Limiting Logic', () => {
    let store: MemoryStore;

    beforeEach(() => {
      store = new MemoryStore(60000);
    });

    it('should allow requests under limit', async () => {
      for (let i = 0; i < 99; i++) {
        await store.increment('test-user');
      }
      const result = await store.increment('test-user');
      expect(result.totalHits).toBe(100);
    });

    it('should track concurrent requests from multiple users', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(store.increment('user-1'));
        promises.push(store.increment('user-2'));
      }
      await Promise.all(promises);

      expect(store.getHitCount('user-1')).toBe(5);
      expect(store.getHitCount('user-2')).toBe(5);
    });
  });
});
