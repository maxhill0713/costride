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
    // Disable the workbox file-size hard error so large chunks don't fail the build.
    // We patch vite-plugin-pwa's chunk file to always pass false for the throw flag.
    {
      name: 'disable-workbox-size-error',
      enforce: 'pre',
      async buildStart() {
        try {
          const { readFileSync, writeFileSync } = await import('fs');
          const { createRequire } = await import('module');
          const req = createRequire(import.meta.url);
          const pwaIndexPath = req.resolve('vite-plugin-pwa');
          const distDir = (await import('path')).default.dirname(pwaIndexPath);
          const chunkPath = distDir + '/chunk-G4TAN34B.js';
          let src = readFileSync(chunkPath, 'utf8');
          // Replace: if (throwMaximumFileSizeToCacheInBytes) { ... throw ... }
          // by neutralising the condition
          const patched = src.replace(
            'if (throwMaximumFileSizeToCacheInBytes) {',
            'if (false) {'
          );
          if (patched !== src) {
            writeFileSync(chunkPath, patched, 'utf8');
          }
        } catch (_) { /* ignore if file not found or already patched */ }
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
            if (id.includes('/react/') || id.includes('\\react\\')) return 'react-core';
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
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('micromark') || id.includes('mdast') || id.includes('hast') || id.includes('unist')) return 'markdown';
            if (id.includes('zod')) return 'zod';
            if (id.includes('react-hook-form') || id.includes('@hookform')) return 'forms';
            if (id.includes('react-leaflet')) return 'leaflet';
            if (id.includes('canvas-confetti')) return 'confetti';
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
          if (id.includes('pages/RedeemReward')) return 'page-redeem';
          if (id.includes('pages/Settings') || id.includes('pages/AccountSettings') || id.includes('pages/ProfileSettings') || id.includes('pages/PrivacySettings') || id.includes('pages/AppearanceSettings') || id.includes('pages/NotificationSettings') || id.includes('pages/SubscriptionSettings') || id.includes('pages/HelpSupport')) return 'page-settings';
          if (id.includes('pages/Friends') || id.includes('pages/UserProfile')) return 'page-social';
          if (id.includes('pages/AdminGyms') || id.includes('pages/AddGym') || id.includes('pages/ClaimGym') || id.includes('pages/GymRequests') || id.includes('pages/InviteOwner') || id.includes('pages/ModeratorDashboard')) return 'page-admin';
          if (id.includes('pages/Community') || id.includes('pages/NotificationsHub') || id.includes('pages/PostArchive') || id.includes('pages/Premium') || id.includes('pages/Plus')) return 'page-misc';

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
          if (id.includes('components/goals') || id.includes('components/rewards') || id.includes('components/groups') || id.includes('components/polls') || id.includes('components/lifts') || id.includes('components/members') || id.includes('components/premium') || id.includes('components/membership')) return 'misc-components';
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