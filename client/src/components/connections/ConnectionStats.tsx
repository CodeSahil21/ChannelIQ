import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaClock, FaPaperPlane, FaBan } from 'react-icons/fa';
import { useConnections } from '../../hooks/useConnections';

export const ConnectionStats = () => {
  const { stats, fetchStats } = useConnections();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!stats) return null;

  const statCards = [
    {
      icon: FaUsers,
      value: stats.totalAcceptedConnections,
      label: 'Connections',
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      shadowColor: 'shadow-blue-500/40',
    },
    {
      icon: FaClock,
      value: stats.totalPendingConnections,
      label: 'Pending',
      gradient: 'from-orange-500 via-orange-600 to-red-500',
      shadowColor: 'shadow-orange-500/40',
    },
    {
      icon: FaPaperPlane,
      value: stats.totalSentConnections || 0,
      label: 'Sent',
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      shadowColor: 'shadow-purple-500/40',
    },
    {
      icon: FaBan,
      value: stats.totalBlockedUsers || 0,
      label: 'Blocked',
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      shadowColor: 'shadow-gray-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-xl ${card.shadowColor} relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full -ml-8 -mb-8" />
            <div className="relative z-10">
              <Icon className="text-3xl mb-3 opacity-90" />
              <p className="text-3xl font-bold mb-1">{card.value}</p>
              <p className="text-sm opacity-90 font-medium">{card.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
