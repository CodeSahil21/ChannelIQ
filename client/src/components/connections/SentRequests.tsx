import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaPaperPlane, FaEye } from 'react-icons/fa';
import { useConnections } from '../../hooks/useConnections';
import { useProfileContext } from '../../pages/Connections';

export const SentRequests = () => {
  const { sentRequests, fetchSentRequests, loading } = useConnections();
  const openProfile = useProfileContext();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: number } | null>(null);

  useEffect(() => {
    fetchSentRequests();
  }, [fetchSentRequests]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (loading && sentRequests.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (sentRequests.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-purple-500/30"
        >
          <FaPaperPlane className="text-4xl text-white" />
        </motion.div>
        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No sent requests</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Start connecting with people</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {sentRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="sent-request-card"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, userId: request.receiver!.id });
            }}
          >
            <div className="sent-request-content">
              <div className="sent-user-avatar">
                {request.receiver?.profilePic ? (
                  <img src={request.receiver.profilePic} alt={request.receiver.fullName || 'Profile'} />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.receiver?.fullName || request.receiver?.email || 'User')}&backgroundColor=2a5298`}
                    alt={request.receiver?.fullName || 'Profile'}
                  />
                )}
              </div>
              <div className="sent-user-info">
                <h3>{request.receiver?.fullName || request.receiver?.email || 'Unknown User'}</h3>
                {!request.receiver?.fullName && request.receiver?.email && <p className="user-email">{request.receiver.email}</p>}
                {request.receiver?.jobTitle && <p className="job-title">{request.receiver.jobTitle}</p>}
                {request.receiver?.department && <p className="department">{request.receiver.department}</p>}
              </div>
            </div>
            <div className="sent-status">
              <FaClock />
              <span>Pending</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              openProfile(contextMenu.userId);
              setContextMenu(null);
            }}
            className="context-menu-item"
          >
            <FaEye /> View Profile
          </button>
        </div>
      )}
    </div>
  );
};
