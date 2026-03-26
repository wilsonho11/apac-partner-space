import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { quickLocal } from '@shopify/quick/vite';

export default defineConfig({
  plugins: [react(), quickLocal()],
  server: {
    host: 'apac-partner-space.quick.localhost',
    port: 1337,
  },
  build: {
    outDir: 'dist',
  },
});
