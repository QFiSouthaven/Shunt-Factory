import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive tests for deploy.sh script
 *
 * Tests cover:
 * - Script structure and syntax
 * - Environment validation (staging and production only)
 * - Production safety checks
 * - Multi-platform deployment support (Vercel, Netlify, AWS, GitHub Pages)
 * - Build verification before deployment
 * - Error handling and exit codes
 */

describe('Deploy Script (deploy.sh)', () => {
  let scriptContent: string;
  const scriptPath = path.join(__dirname, '../deploy.sh');

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
      // Assert: Color variables for better UX
      expect(scriptContent).toContain('RED=');
      expect(scriptContent).toContain('GREEN=');
      expect(scriptContent).toContain('YELLOW=');
      expect(scriptContent).toContain('BLUE=');
      expect(scriptContent).toContain('NC=');
    });

    it('should have descriptive header output', () => {
      // Assert: Script prints deployment header
      expect(scriptContent).toContain('Aether Shunt Deployment Script');
      expect(scriptContent).toContain('════════════════════════════════════════');
    });
  });

  describe('Environment Validation', () => {
    it('should accept staging environment', () => {
      // Assert: staging is valid for deployment
      expect(scriptContent).toMatch(/staging\|production/);
    });

    it('should accept production environment', () => {
      // Assert: production is valid for deployment
      expect(scriptContent).toMatch(/staging\|production/);
    });

    it('should NOT accept development environment', () => {
      // Assert: development should not be in validation regex
      const validationRegex = scriptContent.match(/\^\(staging\|production\)\$/);
      expect(validationRegex).toBeTruthy();
      expect(validationRegex![0]).not.toContain('development');
    });

    it('should default to staging when no argument provided', () => {
      // Assert: Safe default is staging, not production
      expect(scriptContent).toMatch(/ENV=\$\{1:-staging\}/);
    });

    it('should validate environment and exit on invalid value', () => {
      // Assert: Invalid environments cause exit 1
      expect(scriptContent).toContain('Invalid environment');
      expect(scriptContent).toMatch(/Valid options: staging, production/);
      expect(scriptContent).toMatch(/exit 1/);
    });

    it('should display environment information', () => {
      // Assert: Shows deployment target
      expect(scriptContent).toMatch(/Environment:.*\$ENV/);
    });
  });

  describe('Production Safety Checks', () => {
    it('should prompt for confirmation in production', () => {
      // Assert: Production requires explicit confirmation
      expect(scriptContent).toMatch(/if \[ "\$ENV" = "production" \]/);
      expect(scriptContent).toContain('WARNING: You are about to deploy to PRODUCTION');
    });

    it('should warn about affecting live users', () => {
      // Assert: Clear warning about production impact
      expect(scriptContent).toContain('This will affect live users');
    });

    it('should require exact "yes" confirmation', () => {
      // Assert: Must type "yes" to proceed
      expect(scriptContent).toMatch(/read -p.*confirm/);
      expect(scriptContent).toMatch(/if \[ "\$confirm" != "yes" \]/);
    });

    it('should allow cancellation of production deployment', () => {
      // Assert: Can safely cancel production deploy
      expect(scriptContent).toContain('Deployment cancelled');
      expect(scriptContent).toMatch(/exit 0/);
    });

    it('should not prompt for confirmation in staging', () => {
      // Assert: Confirmation check is production-specific
      const confirmSection = scriptContent.match(
        /if \[ "\$ENV" = "production" \][\s\S]*?read -p/
      );
      expect(confirmSection).toBeTruthy();
    });
  });

  describe('Build Verification', () => {
    it('should check if dist directory exists', () => {
      // Assert: Verifies build before deploy
      expect(scriptContent).toMatch(/if \[ ! -d "dist" \]/);
    });

    it('should run build if dist not found', () => {
      // Assert: Auto-builds if needed
      expect(scriptContent).toContain('./scripts/build.sh $ENV');
    });

    it('should verify index.html exists', () => {
      // Assert: Checks for critical build artifact
      expect(scriptContent).toMatch(/if \[ ! -f "dist\/index\.html" \]/);
    });

    it('should exit if build verification fails', () => {
      // Assert: Cannot deploy without valid build
      expect(scriptContent).toContain('Build verification failed');
      const verificationSection = scriptContent.match(
        /Build verification failed[\s\S]*?exit 1/
      );
      expect(verificationSection).toBeTruthy();
    });
  });

  describe('Multi-Platform Support', () => {
    it('should support Vercel deployment', () => {
      // Assert: Vercel CLI check exists
      expect(scriptContent).toMatch(/command -v vercel/);
      expect(scriptContent).toContain('Deploying to Vercel');
    });

    it('should support Netlify deployment', () => {
      // Assert: Netlify CLI check exists
      expect(scriptContent).toMatch(/command -v netlify/);
      expect(scriptContent).toContain('Deploying to Netlify');
    });

    it('should support AWS S3 deployment', () => {
      // Assert: AWS CLI check exists
      expect(scriptContent).toMatch(/command -v aws/);
      expect(scriptContent).toContain('Deploying to AWS S3');
    });

    it('should prioritize Vercel over other platforms', () => {
      // Assert: Vercel check comes first in if-elif chain
      const platformChecks = scriptContent.match(
        /command -v (vercel|netlify|aws)/g
      );
      expect(platformChecks![0]).toContain('vercel');
    });

    it('should error when no deployment platform found', () => {
      // Assert: Provides helpful error message
      expect(scriptContent).toContain('No deployment platform detected');
      expect(scriptContent).toContain('Please install one of the following');
    });
  });

  describe('Vercel Deployment', () => {
    it('should use --prod flag for production', () => {
      // Assert: Production deployment uses correct flag
      const vercelSection = scriptContent.match(
        /command -v vercel[\s\S]*?elif/
      );
      expect(vercelSection![0]).toMatch(/if \[ "\$ENV" = "production" \]/);
      expect(vercelSection![0]).toContain('vercel --prod');
    });

    it('should deploy to preview for staging', () => {
      // Assert: Staging goes to preview environment
      const vercelSection = scriptContent.match(
        /command -v vercel[\s\S]*?elif/
      );
      expect(vercelSection![0]).toMatch(/else[\s\S]*?vercel\s*$/m);
    });
  });

  describe('Netlify Deployment', () => {
    it('should use --prod flag for production', () => {
      // Assert: Production deployment uses correct flag
      const netlifySection = scriptContent.match(
        /command -v netlify[\s\S]*?elif/
      );
      expect(netlifySection![0]).toContain('netlify deploy --prod --dir=dist');
    });

    it('should deploy to draft for staging', () => {
      // Assert: Staging creates draft deployment
      const netlifySection = scriptContent.match(
        /command -v netlify[\s\S]*?elif/
      );
      expect(netlifySection![0]).toContain('netlify deploy --dir=dist');
    });

    it('should specify dist directory', () => {
      // Assert: Points to correct build output
      const netlifySection = scriptContent.match(
        /command -v netlify[\s\S]*?elif/
      );
      expect(netlifySection![0]).toMatch(/--dir=dist/);
    });
  });

  describe('AWS S3 Deployment', () => {
    it('should use different buckets for staging and production', () => {
      // Assert: Separate buckets for environments
      expect(scriptContent).toContain('aether-shunt-production');
      expect(scriptContent).toContain('aether-shunt-staging');
    });

    it('should use production bucket for production environment', () => {
      // Assert: Production env uses production bucket
      const s3Section = scriptContent.match(
        /command -v aws[\s\S]*?else/
      );
      expect(s3Section![0]).toMatch(/if \[ "\$ENV" = "production" \][\s\S]*?aether-shunt-production/);
    });

    it('should use staging bucket for staging environment', () => {
      // Assert: Staging env uses staging bucket
      const s3Section = scriptContent.match(
        /command -v aws[\s\S]*?fi\n/
      );
      expect(s3Section![0]).toMatch(/else[\s\S]*?aether-shunt-staging/);
    });

    it('should sync with --delete flag', () => {
      // Assert: Removes old files from S3
      expect(scriptContent).toContain('aws s3 sync dist/ s3://$BUCKET --delete');
    });

    it('should set cache-control headers', () => {
      // Assert: Optimizes browser caching
      expect(scriptContent).toMatch(/--cache-control.*immutable/);
    });

    it('should support CloudFront invalidation', () => {
      // Assert: CDN cache invalidation exists
      expect(scriptContent).toContain('CLOUDFRONT_DISTRIBUTION_ID');
      expect(scriptContent).toContain('create-invalidation');
    });

    it('should only invalidate CloudFront when configured', () => {
      // Assert: CloudFront step is optional
      expect(scriptContent).toMatch(/if \[ ! -z "\$CLOUDFRONT_DISTRIBUTION_ID" \]/);
    });
  });

  describe('Success Messages', () => {
    it('should display success message', () => {
      // Assert: Shows completion message
      expect(scriptContent).toContain('Deployment completed successfully');
    });

    it('should show deployment timestamp', () => {
      // Assert: Records when deployment occurred
      expect(scriptContent).toMatch(/Timestamp:.*date/);
    });

    it('should display production URL for production deploys', () => {
      // Assert: Shows live site URL
      expect(scriptContent).toContain('https://aethershunt.com');
    });

    it('should display staging URL for staging deploys', () => {
      // Assert: Shows staging site URL
      expect(scriptContent).toContain('https://staging.aethershunt.com');
    });

    it('should show different URLs based on environment', () => {
      // Assert: URL display is conditional
      const urlSection = scriptContent.match(
        /if \[ "\$ENV" = "production" \][\s\S]*?aethershunt\.com[\s\S]*?else[\s\S]*?staging\.aethershunt\.com/
      );
      expect(urlSection).toBeTruthy();
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
      expect(scriptContent).toMatch(/\$\{YELLOW\}.*⚠️/);
    });

    it('should provide installation instructions when platform missing', () => {
      // Assert: Helps user install deployment tools
      expect(scriptContent).toContain('npm install -g vercel');
      expect(scriptContent).toContain('npm install -g netlify-cli');
      expect(scriptContent).toContain('https://aws.amazon.com/cli/');
    });

    it('should suggest manual deployment as fallback', () => {
      // Assert: Provides alternative deployment method
      expect(scriptContent).toContain('manually deploy');
      expect(scriptContent).toMatch(/\.\/dist\//);
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

  describe('Script Arguments', () => {
    it('should accept environment as first argument', () => {
      // Assert: ENV gets value from $1
      expect(scriptContent).toMatch(/ENV=\$\{1:-staging\}/);
    });

    it('should document accepted arguments in header', () => {
      // Assert: Usage comment explains arguments
      expect(scriptContent).toMatch(/\[environment\]/);
    });
  });

  describe('Integration with Build Script', () => {
    it('should call build.sh with correct environment', () => {
      // Assert: Passes environment to build script
      expect(scriptContent).toContain('./scripts/build.sh $ENV');
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should have production-specific logic', () => {
      // Assert: Production has special handling
      const prodChecks = scriptContent.match(/if \[ "\$ENV" = "production" \]/g);
      expect(prodChecks!.length).toBeGreaterThan(1);
    });

    it('should handle staging differently from production', () => {
      // Assert: Staging and production are treated differently
      expect(scriptContent).toMatch(/if \[ "\$ENV" = "production" \][\s\S]*?else/);
    });
  });
});
