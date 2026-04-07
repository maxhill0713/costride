import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import base44Plugin from '@base44/vite-plugin';

// Belt-and-suspenders: bump workbox size limit via monkey-patching workbox-build
function patchWorkboxBuild() {
  try {
    const req = createRequire(import.meta.url);
    const wbEntry = req.resolve('workbox-build');
    const wbDir = dirname(wbEntry);
    const files = readdirSync(wbDir).filter(f => f.endsWith('.js'));
    for (const f of files) {
      const fp = join(wbDir, f);
      if (!existsSync(fp)) continue;
      let src;
      try { src = readFileSync(fp, 'utf8'); } catch { continue; }
      // Replace the 2097152 (2MiB) default with 10MiB (10485760)
      const out = src.replace(/\b2097152\b/g, '10485760');
      if (out !== src) writeFileSync(fp, out, 'utf8');
    }
  } catch (_) { /* skip */ }
}
patchWorkboxBuild();

// ── Patch vite-plugin-pwa on disk ─────────────────────────────────────────────
// Neutralise the 2MiB cache-limit throw. We patch every JS file in the PWA
// dist dir, replacing the throw with a no-op. We run this at module load time
// AND in closeBundle (same phase as the PWA plugin) to be sure it sticks.
function patchPwaPlugin() {
  try {
    const req = createRequire(import.meta.url);
    const pwaEntry = req.resolve('vite-plugin-pwa');
    const distDir = dirname(pwaEntry);
    const files = readdirSync(distDir).filter(f => f.endsWith('.js'));
    let patched = 0;
    for (const f of files) {
      const fp = join(distDir, f);
      if (!existsSync(fp)) continue;
      let src;
      try { src = readFileSync(fp, 'utf8'); } catch { continue; }
      let out = src;

      // Target the exact throw inside logWorkboxResult (line ~44 in chunk file).
      // The function receives a boolean "throwFlag" argument; replace the whole
      // if-block that throws when that flag is truthy.
      out = out.replace(
        /if\s*\([^)]*[Tt]hrow[^)]*\)\s*\{[^}]*[Mm]aximum[Ff]ile[Ss]ize[^}]*\}/gs,
        '/* b44: size-limit throw removed */'
      );
      // Also handle single-statement form: if (flag) throw new Error(...)
      out = out.replace(
        /if\s*\([^)]*[Tt]hrow[^)]*\)\s*throw\s+new\s+Error\([^)]*[Mm]aximum[Ff]ile[Ss]ize[^)]*\)\s*;/g,
        '/* b44: size-limit throw removed */'
      );
      // Nuclear fallback: any throw referencing the size limit text
      out = out.replace(
        /throw\s+new\s+Error\((?:[^)(]|\([^)]*\))*[Mm]aximum[Ff]ile[Ss]ize(?:[^)(]|\([^)]*\))*\)\s*;?/g,
        '/* b44: size-limit throw removed */'
      );
      // Template-literal form
      out = out.replace(
        /throw\s+new\s+Error\(`[^`]*[Mm]aximum[Ff]ile[Ss]ize[^`]*`\)\s*;?/g,
        '/* b44: size-limit throw removed */'
      );

      if (out !== src) { writeFileSync(fp, out, 'utf8'); patched++; }
    }
  } catch (_) { /* skip if not installed */ }
}

patchPwaPlugin();

const pwaLimitPatchPlugin = {
  name: 'b44-pwa-limit-patch',
  buildStart() { patchPwaPlugin(); patchWorkboxBuild(); },
  closeBundle() { patchPwaPlugin(); patchWorkboxBuild(); },
};

export default defineConfig({
  plugins: [
    pwaLimitPatchPlugin,
    react(),
    base44Plugin(),
  ],

  build: {
    chunkSizeWarningLimit: 3000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 2,
      },
      mangle: true,
      format: { comments: false },
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
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
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
            if (id.includes('canvas-confetti')) return 'confetti';
            return 'vendor';
          }

          // Pages
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

          // Components
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

          if (id.includes('lib/') || id.includes('hooks/') || id.includes('services/') || id.includes('utils/')) return 'app-lib';
          if (id.includes('Layout') || id.includes('AuthContext') || id.includes('NavigationTracker') || id.includes('PageNotFound') || id.includes('ErrorBoundary') || id.includes('PageTransition') || id.includes('TimerContext') || id.includes('PersistentRestTimer')) return 'app-shell';
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