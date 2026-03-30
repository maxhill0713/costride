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
        },
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
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
            if (id.includes('leaflet')) return 'leaflet';
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'pdf';
            if (id.includes('@hello-pangea') || id.includes('dnd')) return 'dnd';
            if (id.includes('react-quill') || id.includes('quill')) return 'quill';
            return 'vendor';
          }
          // App code chunks
          if (id.includes('pages/GymOwnerDashboard')) return 'page-gym-dashboard';
          if (id.includes('components/dashboard')) return 'dashboard';
          if (id.includes('pages/Onboarding')) return 'page-onboarding';
          if (id.includes('pages/GymSignup') || id.includes('pages/MemberSignup')) return 'page-signup';
          if (id.includes('pages/Progress')) return 'page-progress';
          if (id.includes('pages/Gyms')) return 'page-gyms';
          if (id.includes('pages/GymCommunity')) return 'page-community';
          if (id.includes('pages/Leaderboard')) return 'page-leaderboard';
          if (id.includes('pages/Profile')) return 'page-profile';
          if (id.includes('components/challenges')) return 'challenges';
          if (id.includes('components/gym')) return 'gym-components';
          if (id.includes('components/feed')) return 'feed';
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