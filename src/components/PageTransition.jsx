import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

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

let previousPath = null;

export default function PageTransition({ children }) {
  const { pathname } = useLocation();

  const skipAnim = NO_ANIMATE_PAGES.has(pathname) ||
    (pathname === '/Settings' && NO_ANIMATE_PAGES.has(previousPath));

  previousPath = pathname;

  if (skipAnim) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ x: '5%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}