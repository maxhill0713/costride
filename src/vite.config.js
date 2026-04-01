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
          let modified = code.replace(/^\s*['"]use client['"];?\s*\n?/gm, '');
          if (modified !== code) return { code: modified };
        }
      },
    },
    base44Plugin(),
    // Patch vite-plugin-pwa's bundled chunk to suppress the maximumFileSizeToCacheInBytes error.
    // The chunk contains `logWorkboxResult` which throws when a file exceeds 2MB.
    // We replace the hard-coded 2MB default with 10MB by transforming the chunk source.
    {
      name: 'patch-workbox-file-size-limit',
      enforce: 'pre',
      resolveId(id) {
        // Let normal resolution happen
        return null;
      },
      load(id) {
        if (id.includes('vite-plugin-pwa') && id.includes('chunk-')) {
          // Will be handled in transform
        }
        return null;
      },
      transform(code, id) {
        // Patch workbox-build's default maximumFileSizeToCacheInBytes (2097152 = 2MB) to 10MB
        if (id.includes('workbox-build') && code.includes('maximumFileSizeToCacheInBytes')) {
          return {
            code: code.replace(/maximumFileSizeToCacheInBytes:\s*2\s*\*\s*1024\s*\*\s*1024/g, 'maximumFileSizeToCacheInBytes: 10 * 1024 * 1024')
                       .replace(/maximumFileSizeToCacheInBytes:\s*2097152/g, 'maximumFileSizeToCacheInBytes: 10485760'),
            map: null,
          };
        }
        // Also patch vite-plugin-pwa's chunk that contains logWorkboxResult
        if (id.includes('vite-plugin-pwa') && code.includes('maximumFileSizeToCacheInBytes')) {
          return {
            code: code.replace(/2\s*\*\s*1024\s*\*\s*1024/g, '10 * 1024 * 1024')
                       .replace(/\b2097152\b/g, '10485760'),
            map: null,
          };
        }
        return null;
      },
    },
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
          if (id.includes('components/dashboard/TabCoachMembers')) return 'coach-members';
          if (id.includes('components/dashboard/TabCoachSchedule')) return 'coach-schedule';
          if (id.includes('components/dashboard/TabCoachToday')) return 'coach-today';
          if (id.includes('components/dashboard/TabCoachAnalytics')) return 'coach-analytics';
          if (id.includes('components/dashboard/TabCoachContent')) return 'coach-content';
          if (id.includes('components/dashboard/TabCoachProfile')) return 'coach-profile';
          if (id.includes('components/dashboard/TabAnalytics')) return 'gym-analytics';
          if (id.includes('components/dashboard/TabMembers')) return 'gym-members';
          if (id.includes('components/dashboard/TabOverview')) return 'gym-overview';
          if (id.includes('components/dashboard/TabEngagement')) return 'gym-engagement';
          if (id.includes('components/dashboard/TabRewards')) return 'gym-rewards';
          if (id.includes('components/dashboard/TabGym')) return 'gym-tab';
          if (id.includes('components/dashboard/TabContent')) return 'gym-content';
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
});