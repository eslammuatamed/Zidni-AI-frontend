// vite.config.ts
import { defineConfig } from "file:///E:/work/E-Learning-App/edtech/frontend/spa/node_modules/.pnpm/vite@5.4.20_@types+node@20.19.17_sass@1.92.1/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
import vue from "file:///E:/work/E-Learning-App/edtech/frontend/spa/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_c8efbb1de52ecabf868174986aead736/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vuetify from "file:///E:/work/E-Learning-App/edtech/frontend/spa/node_modules/.pnpm/vite-plugin-vuetify@2.1.2_v_225e4aa59a00c1554506859949dbb5c2/node_modules/vite-plugin-vuetify/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///E:/work/E-Learning-App/edtech/frontend/spa/vite.config.ts";
var API_PROXY_TARGET = "http://localhost:8080";
var vite_config_default = defineConfig(() => ({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      primevue: fileURLToPath(new URL("./src/vendor/primevue/index.ts", __vite_injected_original_import_meta_url)),
      "primevue/": fileURLToPath(new URL("./src/vendor/primevue/", __vite_injected_original_import_meta_url)),
      "primeicons/": fileURLToPath(new URL("./src/vendor/primeicons/", __vite_injected_original_import_meta_url))
    }
  },
  define: {
    global: "globalThis"
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      },
      sourcemap: false
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["127.0.0.1.nip.io", "http://app.127.0.0.1.nip.io/", "*.127.0.0.1.nip.io"],
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          ".127.0.0.1.nip.io": ".127.0.0.1.nip.io"
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader("X-Forwarded-Host", host);
              proxyReq.setHeader("X-Forwarded-Proto", "http");
            }
          });
        }
      },
      "/static": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false
      },
      "/ws": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },
  hmr: {
    host: "app.127.0.0.1.nip.io",
    protocol: "ws"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFx3b3JrXFxcXEUtTGVhcm5pbmctQXBwXFxcXGVkdGVjaFxcXFxmcm9udGVuZFxcXFxzcGFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHdvcmtcXFxcRS1MZWFybmluZy1BcHBcXFxcZWR0ZWNoXFxcXGZyb250ZW5kXFxcXHNwYVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovd29yay9FLUxlYXJuaW5nLUFwcC9lZHRlY2gvZnJvbnRlbmQvc3BhL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJztcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xyXG5pbXBvcnQgdnVldGlmeSBmcm9tICd2aXRlLXBsdWdpbi12dWV0aWZ5JztcclxuXHJcbmNvbnN0IEFQSV9QUk9YWV9UQVJHRVQgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgwJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiAoe1xyXG4gIHBsdWdpbnM6IFt2dWUoKSwgdnVldGlmeSh7IGF1dG9JbXBvcnQ6IHRydWUgfSldLFxyXG5cclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgcHJpbWV2dWU6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvdmVuZG9yL3ByaW1ldnVlL2luZGV4LnRzJywgaW1wb3J0Lm1ldGEudXJsKSksXHJcbiAgICAgICdwcmltZXZ1ZS8nOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3ZlbmRvci9wcmltZXZ1ZS8nLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgJ3ByaW1laWNvbnMvJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy92ZW5kb3IvcHJpbWVpY29ucy8nLCBpbXBvcnQubWV0YS51cmwpKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGRlZmluZToge1xyXG4gICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcydcclxuICB9LFxyXG5cclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGVzYnVpbGRPcHRpb25zOiB7XHJcbiAgICAgIGRlZmluZToge1xyXG4gICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnXHJcbiAgICAgIH0sXHJcbiAgICAgIHNvdXJjZW1hcDogZmFsc2VcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgYWxsb3dlZEhvc3RzOiBbJzEyNy4wLjAuMS5uaXAuaW8nLCAnaHR0cDovL2FwcC4xMjcuMC4wLjEubmlwLmlvLycsJyouMTI3LjAuMC4xLm5pcC5pbyddLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBBUElfUFJPWFlfVEFSR0VULFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIGNvb2tpZURvbWFpblJld3JpdGU6IHtcclxuICAgICAgICAgICcuMTI3LjAuMC4xLm5pcC5pbyc6ICcuMTI3LjAuMC4xLm5pcC5pbydcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XHJcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBob3N0ID0gcmVxLmhlYWRlcnMuaG9zdDtcclxuICAgICAgICAgICAgaWYgKGhvc3QpIHtcclxuICAgICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ1gtRm9yd2FyZGVkLUhvc3QnLCBob3N0KTtcclxuICAgICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ1gtRm9yd2FyZGVkLVByb3RvJywgJ2h0dHAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAnL3N0YXRpYyc6IHtcclxuICAgICAgICB0YXJnZXQ6IEFQSV9QUk9YWV9UQVJHRVQsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgJy93cyc6IHtcclxuICAgICAgICB0YXJnZXQ6IEFQSV9QUk9YWV9UQVJHRVQsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHdzOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGhtcjoge1xyXG4gICAgaG9zdDogJ2FwcC4xMjcuMC4wLjEubmlwLmlvJyxcclxuICAgIHByb3RvY29sOiAnd3MnXHJcbiAgfVxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFQsU0FBUyxvQkFBb0I7QUFDelYsU0FBUyxlQUFlLFdBQVc7QUFDbkMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sYUFBYTtBQUhtTCxJQUFNLDJDQUEyQztBQUt4UCxJQUFNLG1CQUFtQjtBQUV6QixJQUFPLHNCQUFRLGFBQWEsT0FBTztBQUFBLEVBQ2pDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsUUFBUSxFQUFFLFlBQVksS0FBSyxDQUFDLENBQUM7QUFBQSxFQUU5QyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQ3BELFVBQVUsY0FBYyxJQUFJLElBQUksa0NBQWtDLHdDQUFlLENBQUM7QUFBQSxNQUNsRixhQUFhLGNBQWMsSUFBSSxJQUFJLDBCQUEwQix3Q0FBZSxDQUFDO0FBQUEsTUFDN0UsZUFBZSxjQUFjLElBQUksSUFBSSw0QkFBNEIsd0NBQWUsQ0FBQztBQUFBLElBQ25GO0FBQUEsRUFDRjtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYyxDQUFDLG9CQUFvQixnQ0FBK0Isb0JBQW9CO0FBQUEsSUFDdEYsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IscUJBQXFCO0FBQUEsVUFDbkIscUJBQXFCO0FBQUEsUUFDdkI7QUFBQSxRQUNBLFdBQVcsQ0FBQyxVQUFVO0FBQ3BCLGdCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsUUFBUTtBQUN0QyxrQkFBTSxPQUFPLElBQUksUUFBUTtBQUN6QixnQkFBSSxNQUFNO0FBQ1IsdUJBQVMsVUFBVSxvQkFBb0IsSUFBSTtBQUMzQyx1QkFBUyxVQUFVLHFCQUFxQixNQUFNO0FBQUEsWUFDaEQ7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLE1BQ0EsV0FBVztBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLElBQUk7QUFBQSxRQUNKLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLEtBQUs7QUFBQSxJQUNILE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxFQUNaO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
