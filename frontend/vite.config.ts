import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'brand-logo-512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
      },
      manifest: {
        name: 'TTESOL Academy',
        short_name: 'TTESOL',
        description: 'Interactive educational platform for English learning.',
        theme_color: '#0d1f5c',
        background_color: '#0d1f5c',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'brand-logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'brand-logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // Target older browsers: Samsung Galaxy S9 era (Chrome 67-70, Android 8-10)
  build: {
    target: ['es2019', 'chrome67', 'edge18', 'firefox62', 'safari12'],
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['xlsx', 'recharts', 'react-quill-new'],
          pdf: ['pdfjs-dist']
        }
      }
    }
  },
  server: {
    port: 3002,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})

