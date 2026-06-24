import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repo is github.com/Vashtag/Pickleball, so GitHub Pages serves from /Pickleball/.
// The path is case-sensitive, so this must match the repo name's casing exactly.
// In dev, base is '/' so the local dev server works normally.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Pickleball/' : '/',
}));
