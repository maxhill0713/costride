import React, { useEffect } from 'react';

/*
 * Duolingo-style page transitions
 * ────────────────────────────────
 * • Tab right  → fade + slide in from right  (translateX 18px → 0)
 * • Tab left   → fade + slide in from left   (translateX -18px → 0)
 * • Push / URL → fade + tiny lift            (translateY 12px → 0)
 *
 * No dual-slot rendering. No layout collapse.
 * React remounts the div on key change → CSS animation restarts cleanly.
 */

const STYLE_ID = 'page-transition-keyframes';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes _pt_fromRight {
      from { opacity: 0; transform: translateX(18px); }
      to   { opacity: 1; transform: translateX(0);    }
    }
    @keyframes _pt_fromLeft {
      from { opacity: 0; transform: translateX(-18px); }
      to   { opacity: 1; transform: translateX(0);     }
    }
    @keyframes _pt_fromBelow {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes _pt_fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

const ANIMATION_MAP = {
  left:  '_pt_fromRight',  // moving to a right tab → new page arrives from right
  right: '_pt_fromLeft',   // moving to a left tab  → new page arrives from left
  up:    '_pt_fromBelow',  // push / deep nav       → lifts up from below
  down:  '_pt_fade',       // back nav              → simple fade
};

/**
 * Props
 * ─────
 * direction – 'left' | 'right' | 'up' | 'down'
 * duration  – ms (default 230)
 * children  – page content
 *
 * Usage: apply key={pageKey} on <PageTransition> from the parent so React
 * remounts this component (and restarts the CSS animation) on every navigation.
 *
 *   <PageTransition key={transitionKey} direction={transitionDir}>
 *     {children}
 *   </PageTransition>
 */
export default function PageTransition({
  children,
  direction = 'up',
  duration = 230,
}) {
  useEffect(() => { injectStyles(); }, []);

  const animName = ANIMATION_MAP[direction] ?? '_pt_fromBelow';
  const easing   = 'cubic-bezier(0.25, 0.85, 0.35, 1)';

  return (
    <div
      style={{
        animation: `${animName} ${duration}ms ${easing} both`,
        willChange: 'opacity, transform',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}
