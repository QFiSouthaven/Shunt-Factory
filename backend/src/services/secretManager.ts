/**
 * Secret Manager Service
 * Securely retrieves API keys from Google Cloud Secret Manager
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

class SecretManagerService {
  private client: SecretManagerServiceClient | null = null;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Only initialize in production or when GCP_PROJECT_ID is set
    if (env.GCP_PROJECT_ID) {
      try {
        this.client = new SecretManagerServiceClient();
        logger.info('Secret Manager client initialized');
      } catch (error) {
        logger.error('Failed to initialize Secret Manager client', { error });
      }
    }
  }

  /**
   * Get Gemini API Key from Secret Manager (or environment variable in development)
   */
  async getGeminiApiKey(): Promise<string> {
    // Development: Use environment variable directly
    if (env.NODE_ENV === 'development') {
      const devKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!devKey) {
        throw new Error('GEMINI_API_KEY not set in development environment');
      }
      logger.debug('Using Gemini API key from environment variable (development mode)');
      return devKey;
    }

    // Production: Use Secret Manager
    return this.getSecret(env.GEMINI_API_KEY_SECRET_NAME);
  }

  /**
   * Generic method to retrieve secrets from Secret Manager
   */
  private async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug(`Using cached secret: ${secretName}`);
      return cached.value;
    }

    if (!this.client) {
      throw new Error('Secret Manager client not initialized. Ensure GCP_PROJECT_ID is set.');
    }

    try {
      const secretPath = `projects/${env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`;
      logger.debug(`Fetching secret from: ${secretPath}`);

      const [version] = await this.client.accessSecretVersion({ name: secretPath });

      if (!version.payload?.data) {
        throw new Error(`Secret ${secretName} has no payload data`);
      }

      const secretValue = version.payload.data.toString();

      // Cache the secret
      this.cache.set(secretName, {
        value: secretValue,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      logger.info(`Secret ${secretName} retrieved successfully`);
      return secretValue;
    } catch (error) {
      logger.error(`Failed to retrieve secret: ${secretName}`, { error });
      throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
  }

  /**
   * Clear cached secrets (useful for testing or manual cache invalidation)
   */
  clearCache() {
    this.cache.clear();
    logger.info('Secret cache cleared');
  }
}

export const secretManager = new SecretManagerService();
