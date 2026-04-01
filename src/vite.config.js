import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
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
    // Patch vite-plugin-pwa and workbox-build to raise the 2MB asset cache limit to 10MB.
    // Runs at buildStart (before closeBundle where the error fires) and patches all
    // relevant JS files regardless of their hashed chunk filename.
    {
      name: 'patch-workbox-file-size-limit',
      enforce: 'post',
      buildStart() {
        const dirsToCheck = [
          path.resolve(__dirname, 'node_modules/vite-plugin-pwa/dist'),
          path.resolve(__dirname, 'node_modules/workbox-build/build'),
          path.resolve(__dirname, 'node_modules/workbox-build/dist'),
        ];
        for (const dir of dirsToCheck) {
          if (!fs.existsSync(dir)) continue;
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs'));
          for (const file of files) {
            const filePath = path.join(dir, file);
            let content;
            try { content = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }
            // Patch both the literal byte value and any expression forms
            let patched = content
              .replace(/\b2097152\b/g, '10485760')
              .replace(/2\s*\*\s*1024\s*\*\s*1024/g, '10485760');
            if (patched !== content) {
              fs.writeFileSync(filePath, patched, 'utf-8');
            }
          }
        }
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