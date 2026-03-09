import { motion } from 'framer-motion';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: 8 },
};

const PAGE_TRANSITION = {
  duration: 0.3,
  ease: [0.34, 1.2, 0.64, 1],
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    >
      {children}
    </motion.div>
  );
}