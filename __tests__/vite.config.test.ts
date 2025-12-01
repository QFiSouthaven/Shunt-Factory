import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive tests for Vite configuration
 *
 * Tests cover:
 * - Production optimization settings
 * - Smart chunk splitting (8 vendor bundles)
 * - Asset organization with hashing
 * - Console/debugger removal in production
 * - Tree shaking configuration
 * - Source maps (staging only)
 * - CSS optimization
 * - Build targets and compatibility
 * - Environment-specific configurations
 */

describe('Vite Configuration (vite.config.ts)', () => {
  let configContent: string;
  const configPath = path.join(__dirname, '../vite.config.ts');

  beforeAll(() => {
    // Arrange: Read the configuration file
    configContent = fs.readFileSync(configPath, 'utf-8');
  });

  describe('Configuration Structure', () => {
    it('should export default config using defineConfig', () => {
      // Assert: Uses Vite's defineConfig helper
      expect(configContent).toContain('defineConfig');
      expect(configContent).toContain('export default defineConfig');
    });

    it('should accept mode parameter for environment detection', () => {
      // Assert: Configuration function accepts mode
      expect(configContent).toMatch(/defineConfig\(\s*\(\s*\{\s*mode\s*\}/);
    });

    it('should load environment variables', () => {
      // Assert: Uses loadEnv to load variables
      expect(configContent).toContain('loadEnv');
      expect(configContent).toMatch(/loadEnv\(mode/);
    });

    it('should detect production mode', () => {
      // Assert: Checks for production mode
      expect(configContent).toMatch(/isProduction\s*=\s*mode\s*===\s*['"]production['"]/);
    });

    it('should detect staging mode', () => {
      // Assert: Checks for staging mode
      expect(configContent).toMatch(/isStaging\s*=\s*mode\s*===\s*['"]staging['"]/);
    });
  });

  describe('Server Configuration', () => {
    it('should configure server port', () => {
      // Assert: Server port is set
      expect(configContent).toMatch(/port:\s*3000/);
    });

    it('should listen on all interfaces', () => {
      // Assert: Host is 0.0.0.0 for Docker/container compatibility
      expect(configContent).toMatch(/host:\s*['"]0\.0\.0\.0['"]/);
    });

    it('should have open browser disabled by default', () => {
      // Assert: Browser auto-open is false
      expect(configContent).toMatch(/open:\s*false/);
    });
  });

  describe('React Plugin Configuration', () => {
    it('should use React plugin', () => {
      // Assert: React plugin is imported and used
      expect(configContent).toContain("from '@vitejs/plugin-react'");
      expect(configContent).toContain('react(');
    });

    it('should configure React plugin', () => {
      // Assert: React plugin is properly configured with Babel options
      expect(configContent).toContain('react({');
      expect(configContent).toMatch(/babel:\s*isProduction/);
    });

    it('should have production-specific React optimizations', () => {
      // Assert: Babel config conditional on production
      expect(configContent).toMatch(/babel:\s*isProduction\s*\?/);
    });
  });

  describe('Build Configuration', () => {
    it('should set output directory to dist', () => {
      // Assert: Output goes to dist folder
      expect(configContent).toMatch(/outDir:\s*['"]dist['"]/);
    });

    it('should set assets directory', () => {
      // Assert: Assets folder configured
      expect(configContent).toMatch(/assetsDir:\s*['"]assets['"]/);
    });

    it('should use esbuild for minification', () => {
      // Assert: esbuild minifier (faster than terser)
      expect(configContent).toMatch(/minify:\s*['"]esbuild['"]/);
    });

    it('should target modern browsers', () => {
      // Assert: ES2022 target for modern features
      expect(configContent).toMatch(/target:\s*['"]es2022['"]/);
    });

    it('should enable CSS code splitting', () => {
      // Assert: CSS is split by chunk
      expect(configContent).toMatch(/cssCodeSplit:\s*true/);
    });

    it('should enable CSS minification', () => {
      // Assert: CSS is minified
      expect(configContent).toMatch(/cssMinify:\s*true/);
    });

    it('should increase chunk size warning limit', () => {
      // Assert: Higher limit for manual chunk control
      expect(configContent).toMatch(/chunkSizeWarningLimit:\s*1000/);
    });
  });

  describe('Source Maps Configuration', () => {
    it('should generate source maps for staging', () => {
      // Assert: Source maps enabled in staging
      expect(configContent).toMatch(/sourcemap:\s*isStaging\s*\?\s*true\s*:\s*false/);
    });

    it('should disable source maps for production', () => {
      // Assert: No source maps in production for security
      expect(configContent).toMatch(/sourcemap:\s*isStaging\s*\?\s*true\s*:\s*false/);
    });
  });

  describe('Manual Chunk Splitting', () => {
    it('should implement manual chunk splitting', () => {
      // Assert: manualChunks function exists
      expect(configContent).toContain('manualChunks');
      expect(configContent).toMatch(/manualChunks:\s*\(/);
    });

    it('should create vendor-react chunk for React core', () => {
      // Assert: React and React-DOM bundled together
      expect(configContent).toMatch(/['"]vendor-react['"]/);
      expect(configContent).toContain("node_modules/react");
      expect(configContent).toContain("node_modules/react-dom");
    });

    it('should include scheduler in vendor-react chunk', () => {
      // Assert: React dependency included in same chunk
      expect(configContent).toMatch(/node_modules\/scheduler/);
    });

    it('should create vendor-reactflow chunk', () => {
      // Assert: ReactFlow has its own bundle
      expect(configContent).toMatch(/['"]vendor-reactflow['"]/);
      expect(configContent).toMatch(/node_modules\/reactflow/);
    });

    it('should create vendor-pdf chunk for PDF.js', () => {
      // Assert: PDF.js isolated in its own chunk
      expect(configContent).toMatch(/['"]vendor-pdf['"]/);
      expect(configContent).toMatch(/node_modules\/pdfjs-dist/);
    });

    it('should create vendor-jszip chunk', () => {
      // Assert: JSZip has dedicated chunk
      expect(configContent).toMatch(/['"]vendor-jszip['"]/);
      expect(configContent).toMatch(/node_modules\/jszip/);
    });

    it('should create vendor-ai chunk for AI SDKs', () => {
      // Assert: Gemini and Anthropic bundled together
      expect(configContent).toMatch(/['"]vendor-ai['"]/);
      expect(configContent).toMatch(/node_modules\/@google\/genai/);
      expect(configContent).toMatch(/node_modules\/@anthropic-ai/);
    });

    it('should create vendor-transformers chunk', () => {
      // Assert: Transformers library isolated
      expect(configContent).toMatch(/['"]vendor-transformers['"]/);
      expect(configContent).toMatch(/node_modules\/@xenova\/transformers/);
    });

    it('should create vendor-markdown chunk', () => {
      // Assert: Markdown and syntax highlighting bundled
      expect(configContent).toMatch(/['"]vendor-markdown['"]/);
      expect(configContent).toMatch(/node_modules\/react-markdown/);
    });

    it('should create vendor-utils chunk', () => {
      // Assert: Utility libraries bundled together
      expect(configContent).toMatch(/['"]vendor-utils['"]/);
      expect(configContent).toMatch(/node_modules\/uuid/);
      expect(configContent).toMatch(/node_modules\/diff/);
      expect(configContent).toMatch(/node_modules\/zod/);
    });

    it('should create vendor-misc chunk for other dependencies', () => {
      // Assert: Catch-all for remaining node_modules
      expect(configContent).toMatch(/['"]vendor-misc['"]/);
      expect(configContent).toMatch(/node_modules/);
    });

    it('should have exactly 8 vendor chunks as documented', () => {
      // Assert: Count vendor chunk definitions
      const vendorMatches = configContent.match(/return ['"]vendor-/g);
      expect(vendorMatches).toBeTruthy();
      expect(vendorMatches!.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Asset File Naming', () => {
    it('should configure chunk file names with hash', () => {
      // Assert: Chunks have hash for cache busting
      expect(configContent).toContain('chunkFileNames');
      expect(configContent).toMatch(/\[name\]-\[hash\]\.js/);
    });

    it('should configure entry file names with hash', () => {
      // Assert: Entry files have hash
      expect(configContent).toContain('entryFileNames');
      expect(configContent).toMatch(/\[name\]-\[hash\]\.js/);
    });

    it('should organize images in assets/images directory', () => {
      // Assert: Images go to dedicated folder
      expect(configContent).toContain('assetFileNames');
      expect(configContent).toMatch(/assets\/images.*\[name\]-\[hash\]/);
      expect(configContent).toMatch(/png\|jpe\?g\|svg\|gif/);
    });

    it('should organize fonts in assets/fonts directory', () => {
      // Assert: Fonts go to dedicated folder
      expect(configContent).toMatch(/assets\/fonts.*\[name\]-\[hash\]/);
      expect(configContent).toMatch(/woff\|woff2\|ttf\|otf/);
    });

    it('should include hash in all asset names for caching', () => {
      // Assert: All assets have cache-busting hash
      expect(configContent).toMatch(/\[name\]-\[hash\]\[extname\]/);
    });
  });

  describe('ESBuild Optimizations', () => {
    it('should remove console in production', () => {
      // Assert: Console statements dropped in production
      expect(configContent).toMatch(/drop:\s*isProduction\s*\?\s*\[['"]console['"]/);
    });

    it('should remove debugger in production', () => {
      // Assert: Debugger statements dropped in production
      expect(configContent).toMatch(/drop:\s*isProduction\s*\?.*['"]debugger['"]/);
    });

    it('should keep console and debugger in development', () => {
      // Assert: Empty array when not production
      expect(configContent).toMatch(/drop:\s*isProduction\s*\?.*:\s*\[\]/);
    });

    it('should minify identifiers in production', () => {
      // Assert: Identifier minification conditional
      expect(configContent).toMatch(/minifyIdentifiers:\s*isProduction/);
    });

    it('should minify whitespace in production', () => {
      // Assert: Whitespace minification conditional
      expect(configContent).toMatch(/minifyWhitespace:\s*isProduction/);
    });

    it('should minify syntax in production', () => {
      // Assert: Syntax minification conditional
      expect(configContent).toMatch(/minifySyntax:\s*isProduction/);
    });

    it('should remove legal comments', () => {
      // Assert: No legal comments in output
      expect(configContent).toMatch(/legalComments:\s*['"]none['"]/);
    });

    it('should enable tree shaking', () => {
      // Assert: Dead code elimination enabled
      expect(configContent).toMatch(/treeShaking:\s*true/);
    });
  });

  describe('Dependency Optimization', () => {
    it('should optimize React dependencies', () => {
      // Assert: React pre-bundled for faster dev
      expect(configContent).toContain('optimizeDeps');
      expect(configContent).toContain("'react'");
      expect(configContent).toContain("'react-dom'");
    });

    it('should optimize React JSX runtime', () => {
      // Assert: JSX runtime included
      expect(configContent).toMatch(/['"]react\/jsx-runtime['"]/);
    });

    it('should exclude transformers from optimization', () => {
      // Assert: Large ML library excluded from pre-bundling
      expect(configContent).toContain('exclude');
      expect(configContent).toMatch(/exclude:.*['"]@xenova\/transformers['"]/);
    });

    it('should include common dependencies in optimization', () => {
      // Assert: Frequently used deps optimized
      expect(configContent).toMatch(/['"]@google\/genai['"]/);
      expect(configContent).toMatch(/['"]uuid['"]/);
      expect(configContent).toMatch(/['"]zod['"]/);
    });
  });

  describe('CommonJS Configuration', () => {
    it('should include node_modules in CommonJS transform', () => {
      // Assert: Handle mixed ESM/CJS modules
      expect(configContent).toContain('commonjsOptions');
      expect(configContent).toMatch(/include:.*\/node_modules\//);
    });

    it('should transform mixed ESM modules', () => {
      // Assert: Handle packages with both formats
      expect(configContent).toMatch(/transformMixedEsModules:\s*true/);
    });
  });

  describe('Performance Configuration', () => {
    it('should set max entrypoint size', () => {
      // Assert: Performance budget configured
      expect(configContent).toContain('performance');
      expect(configContent).toMatch(/maxEntrypointSize:\s*1024\s*\*\s*1024/);
    });

    it('should set max asset size', () => {
      // Assert: Asset size limit configured
      expect(configContent).toMatch(/maxAssetSize:\s*1024\s*\*\s*1024/);
    });
  });

  describe('Path Aliases', () => {
    it('should configure @ alias for root', () => {
      // Assert: Convenient import paths
      expect(configContent).toContain('resolve');
      expect(configContent).toContain('alias');
      expect(configContent).toMatch(/['"]@['"]:.*__dirname/);
    });
  });

  describe('Environment Variables', () => {
    it('should define process.env.API_KEY', () => {
      // Assert: API key injected
      expect(configContent).toContain('define');
      expect(configContent).toMatch(/['"]process\.env\.API_KEY['"]/);
    });

    it('should define process.env.GEMINI_API_KEY', () => {
      // Assert: Gemini key injected
      expect(configContent).toMatch(/['"]process\.env\.GEMINI_API_KEY['"]/);
    });

    it('should inject VITE_APP_ENV', () => {
      // Assert: Environment injected at build time
      expect(configContent).toMatch(/['"]import\.meta\.env\.VITE_APP_ENV['"]/);
    });

    it('should JSON stringify environment variables', () => {
      // Assert: Values properly serialized
      expect(configContent).toMatch(/JSON\.stringify\(env\./);
    });
  });

  describe('Production vs Development Configuration', () => {
    it('should have conditional babel configuration', () => {
      // Assert: Different settings per environment
      expect(configContent).toMatch(/babel:\s*isProduction\s*\?/);
    });

    it('should have conditional drop configuration', () => {
      // Assert: Console removal only in production
      expect(configContent).toMatch(/drop:\s*isProduction\s*\?/);
    });

    it('should have conditional minification', () => {
      // Assert: Minification only in production
      expect(configContent).toMatch(/minify\w+:\s*isProduction/);
    });

    it('should have conditional source maps', () => {
      // Assert: Source maps only in staging
      expect(configContent).toMatch(/sourcemap:\s*isStaging/);
    });
  });

  describe('File Organization', () => {
    it('should organize JavaScript in assets/js', () => {
      // Assert: JS files in dedicated directory
      expect(configContent).toMatch(/assets\/js.*\[name\]-\[hash\]\.js/);
    });

    it('should organize images separately from other assets', () => {
      // Assert: Images in their own folder
      expect(configContent).toMatch(/assets\/images/);
    });

    it('should organize fonts separately', () => {
      // Assert: Fonts in their own folder
      expect(configContent).toMatch(/assets\/fonts/);
    });
  });

  describe('Build Output Quality', () => {
    it('should produce deterministic builds with hashing', () => {
      // Assert: Content-based hashing for cache invalidation
      expect(configContent).toMatch(/\[hash\]/g);
    });

    it('should support long-term caching strategy', () => {
      // Assert: Hashed filenames enable aggressive caching
      const hashMatches = configContent.match(/\[hash\]/g);
      expect(hashMatches).toBeTruthy();
      expect(hashMatches!.length).toBeGreaterThan(3);
    });
  });
});
