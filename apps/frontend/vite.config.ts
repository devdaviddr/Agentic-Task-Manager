import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable source maps for production debugging (optional; remove to reduce bundle size)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better long-term caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          // Routing
          'router': ['react-router-dom'],
          // Data fetching
          'query': ['@tanstack/react-query'],
          // Firebase SDK
          'firebase': ['firebase/app', 'firebase/auth'],
          // UI utilities
          'ui-libs': ['@hello-pangea/dnd', '@heroicons/react'],
          // Form handling
          'forms': ['react-hook-form'],
          // HTTP client
          'http': ['axios'],
        },
      },
    },
    // Increase chunk size warning limit slightly
    chunkSizeWarningLimit: 600,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'firebase/app',
      'firebase/auth',
    ],
  },
})
