import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive tests for local-preview.sh script
 *
 * Tests cover:
 * - Script structure and syntax
 * - Build and preview workflow
 * - Error handling
 * - User experience (output messages)
 */

describe('Local Preview Script (local-preview.sh)', () => {
  let scriptContent: string;
  const scriptPath = path.join(__dirname, '../local-preview.sh');

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

    it('should have descriptive comments', () => {
      // Assert: Script purpose is documented
      expect(scriptContent).toContain('Local Preview Script');
      expect(scriptContent).toMatch(/Builds and previews/);
    });

    it('should be concise and focused', () => {
      // Assert: Script is simple and does one thing well
      const lines = scriptContent.split('\n').filter(line =>
        line.trim() && !line.trim().startsWith('#')
      );
      expect(lines.length).toBeLessThan(20);
    });
  });

  describe('Build Step', () => {
    it('should run production build', () => {
      // Assert: Executes npm run build
      expect(scriptContent).toContain('npm run build');
    });

    it('should display build message', () => {
      // Assert: Informs user about build process
      expect(scriptContent).toMatch(/Building production bundle/);
    });

    it('should use emoji for better UX', () => {
      // Assert: Visual indicators for steps
      expect(scriptContent).toMatch(/🏗️/);
    });
  });

  describe('Preview Step', () => {
    it('should run preview server', () => {
      // Assert: Executes npm run preview
      expect(scriptContent).toContain('npm run preview');
    });

    it('should display preview message', () => {
      // Assert: Informs user about preview server
      expect(scriptContent).toMatch(/Starting preview server/);
    });

    it('should use emoji for server start', () => {
      // Assert: Visual indicator for server
      expect(scriptContent).toMatch(/🚀/);
    });

    it('should tell user how to stop the server', () => {
      // Assert: Provides exit instructions
      expect(scriptContent).toMatch(/Ctrl\+C/);
      expect(scriptContent).toContain('stop');
    });
  });

  describe('Workflow Order', () => {
    it('should build before preview', () => {
      // Assert: Build step comes before preview
      const buildIndex = scriptContent.indexOf('npm run build');
      const previewIndex = scriptContent.indexOf('npm run preview');
      expect(buildIndex).toBeLessThan(previewIndex);
    });

    it('should show messages in correct order', () => {
      // Assert: Build message before preview message
      const buildMsgIndex = scriptContent.indexOf('Building production');
      const previewMsgIndex = scriptContent.indexOf('Starting preview');
      expect(buildMsgIndex).toBeLessThan(previewMsgIndex);
    });
  });

  describe('Error Handling', () => {
    it('should exit on build failure due to set -e', () => {
      // Assert: Script stops if build fails
      expect(scriptContent).toContain('set -e');
    });

    it('should not start preview if build fails', () => {
      // Assert: Preview step won't run if build errors
      // This is guaranteed by set -e and sequential execution
      const buildIndex = scriptContent.indexOf('npm run build');
      const previewIndex = scriptContent.indexOf('npm run preview');
      expect(buildIndex).toBeLessThan(previewIndex);
      expect(scriptContent).toContain('set -e');
    });
  });

  describe('User Experience', () => {
    it('should have blank lines for readability', () => {
      // Assert: Output is well-spaced
      expect(scriptContent).toMatch(/echo ""\n/);
    });

    it('should provide clear feedback at each step', () => {
      // Assert: Each step has output message
      const echoCount = (scriptContent.match(/echo/g) || []).length;
      expect(echoCount).toBeGreaterThanOrEqual(3);
    });

    it('should use descriptive messages', () => {
      // Assert: Messages clearly describe what's happening
      expect(scriptContent).toContain('Building production bundle');
      expect(scriptContent).toContain('Starting preview server');
      expect(scriptContent).toContain('Press Ctrl+C to stop');
    });
  });

  describe('Integration with Package.json', () => {
    it('should use npm scripts instead of direct commands', () => {
      // Assert: Leverages package.json scripts
      expect(scriptContent).toContain('npm run build');
      expect(scriptContent).toContain('npm run preview');
    });

    it('should not hardcode vite commands', () => {
      // Assert: Does not bypass npm scripts
      expect(scriptContent).not.toContain('vite build');
      expect(scriptContent).not.toContain('vite preview');
    });
  });

  describe('Script Simplicity', () => {
    it('should not accept command line arguments', () => {
      // Assert: Simple script with no arg parsing
      expect(scriptContent).not.toMatch(/\$1/);
      expect(scriptContent).not.toMatch(/ENV=/);
    });

    it('should not have conditional logic', () => {
      // Assert: Straightforward execution path
      expect(scriptContent).not.toMatch(/if \[/);
      expect(scriptContent).not.toMatch(/case /);
    });

    it('should not have color codes', () => {
      // Assert: Simpler than build/deploy scripts
      expect(scriptContent).not.toContain('RED=');
      expect(scriptContent).not.toContain('GREEN=');
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

  describe('Production Build Testing', () => {
    it('should build production bundle not development', () => {
      // Assert: Tests production configuration
      expect(scriptContent).toMatch(/production/);
    });

    it('should use default npm build command', () => {
      // Assert: Relies on package.json default build
      expect(scriptContent).toMatch(/npm run build(?!\:)/);
    });
  });

  describe('Purpose and Use Case', () => {
    it('should be for local testing', () => {
      // Assert: Script purpose is local preview
      expect(scriptContent).toMatch(/Local Preview/i);
    });

    it('should combine build and preview in one command', () => {
      // Assert: Convenience script for developers
      expect(scriptContent).toContain('npm run build');
      expect(scriptContent).toContain('npm run preview');
    });
  });

  describe('Output Clarity', () => {
    it('should separate build and preview output visually', () => {
      // Assert: Echo statements separate sections
      const emptyEchos = (scriptContent.match(/echo ""/g) || []).length;
      expect(emptyEchos).toBeGreaterThan(0);
    });

    it('should make it clear when server is starting', () => {
      // Assert: Clear indication of server start
      expect(scriptContent).toMatch(/Starting preview server/);
    });
  });

  describe('Script Length', () => {
    it('should be short and maintainable', () => {
      // Assert: Total lines under 20
      const totalLines = scriptContent.split('\n').length;
      expect(totalLines).toBeLessThan(20);
    });

    it('should have more comments than complex logic', () => {
      // Assert: Well-documented despite simplicity
      const commentLines = scriptContent.split('\n').filter(l =>
        l.trim().startsWith('#')
      ).length;
      expect(commentLines).toBeGreaterThanOrEqual(3);
    });
  });
});
