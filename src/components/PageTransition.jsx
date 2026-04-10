import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Sub-settings pages that should never animate (they handle their own transitions or none)
const NO_ANIMATE_PAGES = new Set([
  '/AccountSettings',
  '/ProfileSettings',
  '/PrivacySettings',
  '/AppearanceSettings',
  '/NotificationSettings',
  '/SubscriptionSettings',
  '/HelpSupport',
  '/PostArchive',
]);

// Module-level set — persists across navigations, resets on full page reload
const visitedPaths = new Set();
let previousPath = null;

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const isFirstVisit = !visitedPaths.has(pathname);

  const comingFromSubSettings = NO_ANIMATE_PAGES.has(previousPath);
  previousPath = pathname;
  visitedPaths.add(pathname);

  if (NO_ANIMATE_PAGES.has(pathname)) {
    return <>{children}</>;
  }

  // Skip animation when returning to /Settings from a sub-settings page
  if (pathname === '/Settings' && comingFromSubSettings) {
    return <>{children}</>;
  }

  if (!isFirstVisit) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}