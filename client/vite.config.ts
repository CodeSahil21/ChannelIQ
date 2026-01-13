import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "api.corporate.local",
    port: 3000,
    https: {
      cert: "./api.corporate.local.pem",
      key: "./api.corporate.local-key.pem"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'react-hot-toast'],
          icons: ['react-icons/hi', 'react-icons/fa', 'react-icons/md'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          utils: ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'axios']
  }
})
