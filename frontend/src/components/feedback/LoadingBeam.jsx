import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export function LoadingBeam() {
  const loading = useAppStore((s) => s.loading);
  const aiLoading = useAppStore((s) => s.aiLoading);
  const active = loading || aiLoading;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-0 right-0 top-0 z-[60] h-[2px] overflow-hidden bg-white/5"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
