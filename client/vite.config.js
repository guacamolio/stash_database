import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api to Express, so the browser sees one origin (no CORS issues, cookies just work).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
});
