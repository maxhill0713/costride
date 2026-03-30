import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import base44Plugin from '@base44/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Strip "use client" directives that cause bundling errors
    {
      name: 'strip-use-client',
      enforce: 'pre',
      transform(code, id) {
        if (code.includes('use client')) {
          // Strip all "use client" directives (single & double quotes, with/without semicolon)
          let modified = code.replace(/^\s*['"]use client['"];?\s*\n?/gm, '');
          if (modified !== code) return { code: modified };
        }
      },
    },
    base44Plugin(),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      treeshake: 'recommended',
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router')) return 'router';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('d3-')) return 'charts';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('lodash')) return 'lodash';
            if (id.includes('three')) return 'three';
            if (id.includes('leaflet')) return 'leaflet';
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'pdf';
            if (id.includes('@hello-pangea') || id.includes('dnd')) return 'dnd';
            if (id.includes('react-quill') || id.includes('quill')) return 'quill';
            if (id.includes('sonner')) return 'toast';
            if (id.includes('vaul')) return 'drawer';
            if (id.includes('stripe')) return 'stripe';
            return 'vendor';
          }
          // Page-level splits
          if (id.includes('pages/GymOwnerDashboard')) return 'page-gym-dashboard';
          if (id.includes('pages/Onboarding')) return 'page-onboarding';
          if (id.includes('pages/GymSignup') || id.includes('pages/MemberSignup')) return 'page-signup';
          if (id.includes('pages/Progress')) return 'page-progress';
          if (id.includes('pages/Gyms')) return 'page-gyms';
          if (id.includes('pages/GymCommunity')) return 'page-community';
          if (id.includes('pages/Leaderboard')) return 'page-leaderboard';
          if (id.includes('pages/Profile')) return 'page-profile';
          if (id.includes('pages/Home')) return 'page-home';
          if (id.includes('pages/Messages')) return 'page-messages';
          if (id.includes('pages/Notifications')) return 'page-notifications';
          
          // Component-level splits
          if (id.includes('components/dashboard')) return 'dashboard';
          if (id.includes('components/challenges')) return 'challenges';
          if (id.includes('components/gym')) return 'gym-components';
          if (id.includes('components/feed')) return 'feed';
          if (id.includes('components/profile')) return 'profile-components';
          if (id.includes('components/home')) return 'home-components';
          if (id.includes('components/settings')) return 'settings-components';
          if (id.includes('components/coach')) return 'coach-components';
          if (id.includes('components/leaderboard')) return 'leaderboard-components';
          if (id.includes('components/events')) return 'events-components';
          if (id.includes('components/ui')) return 'ui-components';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  pwa: {
    workbox: {
      maximumFileSizeToCacheInBytes: 3.5 * 1024 * 1024, // 3.5 MB
    },
  },
});