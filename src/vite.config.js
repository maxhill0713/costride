import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import base44Plugin from '@base44/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    base44Plugin({
      pwa: {
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
        selfDestroying: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router-dom') || id.includes('react-router')) return 'router';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('lodash')) return 'lodash';
            if (id.includes('three')) return 'three';
            if (id.includes('stripe')) return 'stripe';
            return 'vendor';
          }
          // Split dashboard pages into their own chunk
          if (id.includes('pages/GymOwnerDashboard') || id.includes('components/dashboard')) return 'dashboard';
          if (id.includes('pages/Onboarding') || id.includes('pages/GymSignup') || id.includes('pages/MemberSignup')) return 'onboarding';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});