/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
