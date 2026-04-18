import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

const API_PROXY_TARGET = 'http://localhost:8080';

export default defineConfig(() => ({
  plugins: [vue(), vuetify({ autoImport: true })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  define: {
    global: 'globalThis'
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      sourcemap: false
    }
  },

  server: {
    host: true,
    port: 5174,
    allowedHosts: [
      '127.0.0.1.nip.io',
      'app.127.0.0.1.nip.io',
      'app-test.72.61.18.248.nip.io',
      '.72.61.18.248.nip.io'
    ],
        proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '.127.0.0.1.nip.io': '.127.0.0.1.nip.io'
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('X-Forwarded-Host', host);
              proxyReq.setHeader('X-Forwarded-Proto', 'http');
            }
          });
        }
      },
      '/static': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },

  hmr: {
    host: 'app.127.0.0.1.nip.io',
    protocol: 'ws'
  }
}));
