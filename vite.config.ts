import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import packageJson from './package.json';

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  plugins: [vue()],
  clearScreen: false,
  server: { strictPort: true },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
});
