import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Exclude server-only api/ directory from the client bundle
    rollupOptions: {
      external: [],
    },
  },
  // Prevent vite from scanning api/ which contains Node.js-only imports
  optimizeDeps: {
    exclude: [],
  },
  server: {
    // In dev, proxy /api calls to the local serverless functions
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
