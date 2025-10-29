import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    // Ensure environment variables are available in production
    envPrefix: 'VITE_',
  },
  define: {
    // Make API URL available at build time
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://edunexus-backend-fvyc.onrender.com'),
  }
})

