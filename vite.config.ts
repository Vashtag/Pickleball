import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repo is github.com/vashtag/pickleball, so GitHub Pages serves from /pickleball/.
// In dev, base is '/' so local dev server works normally.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/pickleball/' : '/',
}));
