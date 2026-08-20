import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function immutableAssetsPlugin() {
  const isAsset = (url) =>
    url.startsWith('/vocabullseye/models/') ||
    url.startsWith('/vocabullseye/draco/') ||
    url.startsWith('/models/') ||
    url.startsWith('/draco/');

  return {
    name: 'immutable-assets-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (isAsset(req.url ?? '')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (isAsset(req.url ?? '')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), immutableAssetsPlugin()],
  base: '/vocabullseye',
  server: {
    port: 3000
  },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
      },
    },
  },
});
