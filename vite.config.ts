import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    const isStaging = mode === 'staging';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        open: false,
        strictPort: false,
      },
      plugins: [
        react({
          // Babel configuration for production optimizations
          babel: isProduction ? {
            plugins: [
              // Remove prop-types in production
              ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }],
            ],
          } : undefined,
        }),
      ],
      define: {
        // SECURITY: Never inject actual API keys into client bundle
        // All API calls must go through the backend proxy
        // Only inject non-sensitive environment indicators
        'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      build: {
        // Output directory
        outDir: 'dist',
        // Assets directory
        assetsDir: 'assets',
        // Generate sourcemaps for staging/production debugging
        sourcemap: isStaging ? true : false,
        // Use esbuild for faster minification
        minify: 'esbuild',
        // Target modern browsers
        target: 'es2022',
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Optimize CSS
        cssCodeSplit: true,
        cssMinify: true,
        // Rollup options
        rollupOptions: {
          output: {
            // Manual chunk splitting for better caching
            manualChunks: (id) => {
              // Normalize path separators for cross-platform compatibility
              const normalizedId = id.replace(/\\/g, '/');

              // React core
              if (normalizedId.includes('node_modules/react') || normalizedId.includes('node_modules/react-dom')) {
                return 'vendor-react';
              }
              // Scheduler (React dependency)
              if (normalizedId.includes('node_modules/scheduler')) {
                return 'vendor-react';
              }
              // ReactFlow
              if (normalizedId.includes('node_modules/reactflow') || normalizedId.includes('node_modules/@reactflow')) {
                return 'vendor-reactflow';
              }
              // PDF.js
              if (normalizedId.includes('node_modules/pdfjs-dist')) {
                return 'vendor-pdf';
              }
              // JSZip
              if (normalizedId.includes('node_modules/jszip')) {
                return 'vendor-jszip';
              }
              // AI SDKs (Gemini + Anthropic)
              if (normalizedId.includes('node_modules/@google/genai') ||
                  normalizedId.includes('node_modules/@anthropic-ai')) {
                return 'vendor-ai';
              }
              // Transformers
              if (normalizedId.includes('node_modules/@xenova/transformers')) {
                return 'vendor-transformers';
              }
              // Markdown and syntax highlighting
              if (normalizedId.includes('node_modules/react-markdown') ||
                  normalizedId.includes('node_modules/react-syntax-highlighter') ||
                  normalizedId.includes('node_modules/refractor') ||
                  normalizedId.includes('node_modules/prism')) {
                return 'vendor-markdown';
              }
              // Utilities (uuid, diff, zod)
              if (normalizedId.includes('node_modules/uuid') ||
                  normalizedId.includes('node_modules/diff') ||
                  normalizedId.includes('node_modules/zod')) {
                return 'vendor-utils';
              }
              // All other node_modules
              if (normalizedId.includes('node_modules')) {
                return 'vendor-misc';
              }
            },
            // Optimize chunk file names for caching
            chunkFileNames: (chunkInfo) => {
              // Normalize path separators for cross-platform compatibility
              const facadeModuleId = chunkInfo.facadeModuleId
                ? chunkInfo.facadeModuleId.replace(/\\/g, '/').split('/').pop()
                : 'chunk';
              return `assets/js/[name]-[hash].js`;
            },
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') || [];
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `assets/images/[name]-[hash][extname]`;
              } else if (/woff|woff2|ttf|otf|eot/i.test(ext)) {
                return `assets/fonts/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
          },
        },
        // Optimize dependencies
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true,
        },
      },
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          '@google/genai',
          'uuid',
          'zod',
        ],
        exclude: ['@xenova/transformers'],
      },
      // ESBuild optimizations
      esbuild: {
        // Remove console and debugger in production
        drop: isProduction ? ['console', 'debugger'] : [],
        // Minify identifiers
        minifyIdentifiers: isProduction,
        // Minify whitespace
        minifyWhitespace: isProduction,
        // Minify syntax
        minifySyntax: isProduction,
        // Legal comments
        legalComments: 'none',
        // Tree shaking
        treeShaking: true,
      },
      // Performance
      performance: {
        // Disable warnings for large chunks (we're handling it with manual chunks)
        maxEntrypointSize: 1024 * 1024, // 1MB
        maxAssetSize: 1024 * 1024, // 1MB
      },
    };
});
