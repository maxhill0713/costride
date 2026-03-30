import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Don't override the existing manifest link in index.html
      manifest: false,
      workbox: {
        // Cache static assets (JS/CSS/fonts) forever — they're content-hashed
        globPatterns: ['**/*.{js,css,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // API calls: network-first, fall back to cache for 60s
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // App images: stale-while-revalidate, keep for 7 days
            urlPattern: /\.(png|jpg|jpeg|webp|svg|gif)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts / external CDN assets
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase CDN (app logos/avatars)
            urlPattern: /^https:\/\/qtrypzzcjebvfcihiynt\.supabase\.co/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-media',
              expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':   ['@tanstack/react-query'],
          'vendor-ui':      ['framer-motion', 'lucide-react', 'date-fns'],
          'vendor-charts':  ['recharts'],
          'vendor-forms':   ['react-hook-form', 'zod', '@hookform/resolvers'],
          'vendor-pdf':     ['html2canvas', 'jspdf'],
          'vendor-map':     ['react-leaflet'],
          'vendor-stripe':  ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          'vendor-dnd':     ['@hello-pangea/dnd'],
          'vendor-editor':  ['react-quill'],
        },
      },
    },
  },
});
