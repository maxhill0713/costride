import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Module-level set — persists across navigations, resets on full page reload
const visitedPaths = new Set();

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const isFirstVisit = !visitedPaths.has(pathname);

  // Mark as visited after first render
  React.useEffect(() => {
    visitedPaths.add(pathname);
  }, [pathname]);

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