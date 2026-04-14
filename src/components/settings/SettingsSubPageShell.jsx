/**
 * Shared animated shell for all Settings sub-pages.
 * Slides in from the right on mount, slides out to the right when back is pressed.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_BG = 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)';

const slideVariants = {
  hidden:  { x: '100%', opacity: 1 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 36, mass: 1 } },
  exit:    { x: '100%', opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } },
};

export default function SettingsSubPageShell({ title, children, rightContent }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  const handleBack = () => {
    setVisible(false);
    setTimeout(() => navigate(createPageUrl('Settings') + '?back=true'), 320);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sub-page"
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            minHeight: '100dvh',
            background: PAGE_BG,
            color: '#fff',
            fontFamily: 'inherit',
            overflowY: 'auto',
          }}
        >
          {/* Sticky header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(15, 23, 37, 0.95)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '2px solid rgba(59, 130, 246, 0.4)',
            padding: '10px 16px',
            paddingTop: 'max(env(safe-area-inset-top), 10px)',
          }}>
            <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={handleBack}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft style={{ width: 22, height: 22, color: '#94a3b8' }} />
              </button>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: '#fff', flex: 1 }}>{title}</span>
              {rightContent}
            </div>
          </div>

          <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 60px' }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}