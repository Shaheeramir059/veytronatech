import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/',
  publicDir: false,
  server: {
    port: 5173
  },
  build: {
    target: 'es2022',
    outDir: fileURLToPath(new URL('..', import.meta.url)),
    assetsDir: 'assets/three',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/three/app.js',
        chunkFileNames: 'assets/three/chunk-[name]-[hash].js',
        assetFileNames: 'assets/three/[name][extname]'
      }
    }
  }
});
