import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnections } from '../../hooks/useConnections';

export const ConnectionNotificationBadge = () => {
  const { stats, fetchStats } = useConnections();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats || stats.totalPendingConnections === 0) return null;

  return (
    <AnimatePresence>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
      >
        {stats.totalPendingConnections > 9 ? '9+' : stats.totalPendingConnections}
      </motion.span>
    </AnimatePresence>
  );
};
