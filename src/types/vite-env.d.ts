/// <reference types="vite/client" />

interface ImportMeta {
  glob(pattern: string, options?: { eager?: boolean }): Record<string, { default: string }>;
  globEager?(pattern: string): Record<string, { default: string }>;
}

export {};
