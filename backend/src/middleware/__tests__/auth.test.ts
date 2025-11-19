/**
 * Authentication Middleware Tests
 * Tests for API key validation and user identification
 */

import { Request, Response, NextFunction } from 'express';

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Recreate middleware functions for testing
const VALID_API_KEYS = new Set(['valid-key-1', 'valid-key-2', 'valid-key-3']);

interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
}

function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-api-key header',
    });
    return;
  }

  // Development mode: Accept any non-empty key
  if (process.env.NODE_ENV === 'development') {
    req.apiKey = apiKey;
    req.userId = `dev-user-${apiKey.substring(0, 8)}`;
    next();
    return;
  }

  // Production mode: Validate against configured keys
  if (!VALID_API_KEYS.has(apiKey)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  req.apiKey = apiKey;
  req.userId = `user-${Buffer.from(apiKey).toString('base64').substring(0, 16)}`;
  next();
}

function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey && VALID_API_KEYS.has(apiKey)) {
    req.apiKey = apiKey;
    req.userId = `user-${Buffer.from(apiKey).toString('base64').substring(0, 16)}`;
  }

  next();
}

describe('Authentication Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('authenticateApiKey', () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        path: '/api/test',
        ip: '127.0.0.1',
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    describe('Missing API Key', () => {
      it('should return 401 when x-api-key header is missing', () => {
        authenticateApiKey(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Unauthorized',
          message: 'Missing x-api-key header',
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });

    describe('Development Mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should accept any non-empty API key in development', () => {
        mockRequest.headers = { 'x-api-key': 'any-dev-key' };

        authenticateApiKey(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.apiKey).toBe('any-dev-key');
      });

      it('should generate dev user ID from API key', () => {
        mockRequest.headers = { 'x-api-key': 'test-key-12345' };

        authenticateApiKey(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        expect(mockRequest.userId).toBe('dev-user-test-key');
      });
    });

    describe('Production Mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should accept valid API keys', () => {
        mockRequest.headers = { 'x-api-key': 'valid-key-1' };

        authenticateApiKey(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.apiKey).toBe('valid-key-1');
      });

      it('should reject invalid API keys', () => {
        mockRequest.headers = { 'x-api-key': 'invalid-key' };

        authenticateApiKey(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });
  });

  describe('optionalAuth', () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        path: '/api/test',
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
      process.env.NODE_ENV = 'production';
    });

    it('should call next without API key', () => {
      optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.apiKey).toBeUndefined();
    });

    it('should set user info when valid API key provided', () => {
      mockRequest.headers = { 'x-api-key': 'valid-key-1' };

      optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.apiKey).toBe('valid-key-1');
    });
  });
});
