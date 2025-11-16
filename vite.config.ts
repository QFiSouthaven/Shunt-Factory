import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Separate React and React-related libraries
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'vendor-react';
              }
              // Separate ReactFlow library
              if (id.includes('node_modules/reactflow') || id.includes('node_modules/@reactflow')) {
                return 'vendor-reactflow';
              }
              // Separate PDF.js library
              if (id.includes('node_modules/pdfjs-dist') || id.includes('pdf.worker')) {
                return 'vendor-pdf';
              }
              // Separate JSZip library
              if (id.includes('node_modules/jszip')) {
                return 'vendor-jszip';
              }
              // Separate Gemini AI SDK
              if (id.includes('node_modules/@google/genai') || id.includes('node_modules/@google/generative-ai')) {
                return 'vendor-gemini';
              }
              // Separate Markdown and syntax highlighting
              if (id.includes('node_modules/react-markdown') ||
                  id.includes('node_modules/react-syntax-highlighter') ||
                  id.includes('node_modules/refractor') ||
                  id.includes('node_modules/prism')) {
                return 'vendor-markdown';
              }
              // Separate utilities (uuid, lodash, etc.)
              if (id.includes('node_modules/uuid') ||
                  id.includes('node_modules/lodash') ||
                  id.includes('node_modules/date-fns')) {
                return 'vendor-utils';
              }
              // All other node_modules go into vendor-misc
              if (id.includes('node_modules')) {
                return 'vendor-misc';
              }
            }
          }
        },
        // Increase chunk size warning limit to 1MB
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging (optional)
        sourcemap: false,
        // Use esbuild for minification (faster than terser)
        minify: 'esbuild',
        target: 'es2022'
      },
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : []
      }
    };
});
