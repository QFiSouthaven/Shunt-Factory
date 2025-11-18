import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive tests for build.sh script
 *
 * Tests cover:
 * - Script structure and syntax
 * - Environment validation (happy and unhappy paths)
 * - Build verification steps
 * - Production-specific checks
 * - Error handling
 * - Best practices (set -e, proper exit codes)
 */

describe('Build Script (build.sh)', () => {
  let scriptContent: string;
  const scriptPath = path.join(__dirname, '../build.sh');

  beforeAll(() => {
    // Arrange: Read the script file
    scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  });

  describe('Script Structure and Best Practices', () => {
    it('should have proper shebang', () => {
      // Assert: Script starts with bash shebang
      expect(scriptContent).toMatch(/^#!\/bin\/bash/);
    });

    it('should have set -e for error handling', () => {
      // Assert: Script exits on error
      expect(scriptContent).toContain('set -e');
    });

    it('should have usage documentation in comments', () => {
      // Assert: Script has usage instructions
      expect(scriptContent).toMatch(/# Usage:/);
      expect(scriptContent).toMatch(/environment:/);
    });

    it('should define color codes for output', () => {
      // Assert: Color variables are defined for better UX
      expect(scriptContent).toContain('RED=');
      expect(scriptContent).toContain('GREEN=');
      expect(scriptContent).toContain('YELLOW=');
      expect(scriptContent).toContain('BLUE=');
      expect(scriptContent).toContain('NC=');
    });

    it('should have descriptive header output', () => {
      // Assert: Script prints header information
      expect(scriptContent).toContain('Aether Shunt Build Script');
      expect(scriptContent).toContain('════════════════════════════════════════');
    });
  });

  describe('Environment Validation', () => {
    it('should accept development environment', () => {
      // Assert: development is a valid environment
      expect(scriptContent).toMatch(/development\|staging\|production/);
    });

    it('should accept staging environment', () => {
      // Assert: staging is a valid environment
      expect(scriptContent).toMatch(/development\|staging\|production/);
    });

    it('should accept production environment', () => {
      // Assert: production is a valid environment
      expect(scriptContent).toMatch(/development\|staging\|production/);
    });

    it('should default to production when no argument provided', () => {
      // Assert: Default environment is production
      expect(scriptContent).toMatch(/ENV=\$\{1:-production\}/);
    });

    it('should validate environment and exit on invalid value', () => {
      // Assert: Invalid environments cause exit 1
      expect(scriptContent).toContain('Invalid environment');
      expect(scriptContent).toMatch(/exit 1/);
    });

    it('should set VITE_APP_ENV environment variable', () => {
      // Assert: Export VITE_APP_ENV for Vite build
      expect(scriptContent).toContain('export VITE_APP_ENV=$ENV');
    });

    it('should display environment information', () => {
      // Assert: Shows selected environment to user
      expect(scriptContent).toMatch(/Environment:.*\$ENV/);
    });
  });

  describe('Build Process Steps', () => {
    it('should clean previous build', () => {
      // Assert: Removes old dist directory
      expect(scriptContent).toContain('rm -rf dist/');
      expect(scriptContent).toMatch(/Cleaning previous build/);
    });

    it('should install dependencies with npm ci', () => {
      // Assert: Uses npm ci for reproducible builds
      expect(scriptContent).toContain('npm ci');
      expect(scriptContent).toMatch(/Installing dependencies/);
    });

    it('should run TypeScript type checking before build', () => {
      // Assert: Type check step exists
      expect(scriptContent).toContain('npx tsc --noEmit');
      expect(scriptContent).toMatch(/TypeScript type checking/);
    });

    it('should run the build command', () => {
      // Assert: Executes npm run build
      expect(scriptContent).toContain('npm run build');
      expect(scriptContent).toMatch(/Building application/);
    });

    it('should verify build output exists', () => {
      // Assert: Checks for dist/index.html
      expect(scriptContent).toMatch(/if \[ ! -f "dist\/index\.html" \]/);
      expect(scriptContent).toContain('Build verification failed');
    });

    it('should exit with error code if build verification fails', () => {
      // Assert: Build verification failure causes exit 1
      const verificationSection = scriptContent.match(
        /Verifying build output[\s\S]*?exit 1/
      );
      expect(verificationSection).toBeTruthy();
    });

    it('should display version information', () => {
      // Assert: Shows Node and npm versions
      expect(scriptContent).toMatch(/node --version/);
      expect(scriptContent).toMatch(/npm --version/);
    });
  });

  describe('Build Analysis', () => {
    it('should display bundle size analysis', () => {
      // Assert: Shows total dist size
      expect(scriptContent).toMatch(/du -sh dist/);
      expect(scriptContent).toContain('Bundle Size Analysis');
    });

    it('should show top JavaScript bundles', () => {
      // Assert: Lists largest JS files
      expect(scriptContent).toMatch(/find dist\/assets.*\.js/);
      expect(scriptContent).toContain('Top 10 JavaScript Bundles');
    });

    it('should handle missing bundles gracefully', () => {
      // Assert: Fallback message when no JS bundles
      expect(scriptContent).toContain('No JS bundles found');
    });
  });

  describe('Production-Specific Checks', () => {
    it('should check for console.log in production builds', () => {
      // Assert: Production check exists
      expect(scriptContent).toMatch(/if \[ "\$ENV" = "production" \]/);
      expect(scriptContent).toMatch(/grep -r "console\\\.log"/);
    });

    it('should warn if console.log found in production', () => {
      // Assert: Warning message for console.log
      expect(scriptContent).toMatch(/console\.log found in production/);
    });

    it('should only check console.log in production environment', () => {
      // Assert: Check is conditional on production
      const consoleCheckSection = scriptContent.match(
        /if \[ "\$ENV" = "production" \][\s\S]*?console\.log/
      );
      expect(consoleCheckSection).toBeTruthy();
    });
  });

  describe('Success Messages and Next Steps', () => {
    it('should display success message', () => {
      // Assert: Shows completion message
      expect(scriptContent).toContain('Build completed successfully');
    });

    it('should show build output location', () => {
      // Assert: Tells user where files are
      expect(scriptContent).toMatch(/Build output:.*\.\/dist/);
    });

    it('should suggest next steps to user', () => {
      // Assert: Provides helpful next actions
      expect(scriptContent).toContain('Next steps');
      expect(scriptContent).toMatch(/npm run preview/);
      expect(scriptContent).toMatch(/\.\/scripts\/deploy\.sh/);
    });

    it('should suggest deployment options', () => {
      // Assert: Shows deploy commands
      expect(scriptContent).toContain('./scripts/deploy.sh staging');
      expect(scriptContent).toContain('./scripts/deploy.sh production');
    });
  });

  describe('Error Handling', () => {
    it('should have proper error messages with red color', () => {
      // Assert: Errors use RED color code
      expect(scriptContent).toMatch(/\$\{RED\}.*❌/);
    });

    it('should have success messages with green color', () => {
      // Assert: Success uses GREEN color code
      expect(scriptContent).toMatch(/\$\{GREEN\}.*✅/);
    });

    it('should have warning messages with yellow color', () => {
      // Assert: Warnings use YELLOW color code
      expect(scriptContent).toMatch(/\$\{YELLOW\}/);
    });

    it('should reset color after messages', () => {
      // Assert: NC (No Color) is used
      expect(scriptContent).toMatch(/\$\{NC\}/);
    });
  });

  describe('Script Permissions', () => {
    it('should be executable', () => {
      // Assert: Script has execute permissions
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);
      expect(isExecutable).toBe(true);
    });
  });

  describe('Integration with Package.json', () => {
    it('should reference correct npm scripts', () => {
      // Assert: Uses npm run build (not vite build directly)
      expect(scriptContent).toContain('npm run build');
    });

    it('should use npm ci for clean dependency installation', () => {
      // Assert: Prefers npm ci over npm install
      expect(scriptContent).toContain('npm ci');
      expect(scriptContent).not.toContain('npm install');
    });
  });

  describe('Silent Mode and Output Control', () => {
    it('should run npm ci in silent mode', () => {
      // Assert: Reduces noise during dependency installation
      expect(scriptContent).toMatch(/npm ci --silent/);
    });

    it('should suppress errors appropriately in optional checks', () => {
      // Assert: Uses 2>/dev/null for non-critical operations
      expect(scriptContent).toContain('2>/dev/null');
    });
  });

  describe('Script Arguments', () => {
    it('should accept environment as first argument', () => {
      // Assert: ENV gets value from $1
      expect(scriptContent).toMatch(/ENV=\$\{1:-production\}/);
    });

    it('should document accepted arguments in header', () => {
      // Assert: Usage comment explains arguments
      expect(scriptContent).toMatch(/\[environment\]/);
    });
  });
});
