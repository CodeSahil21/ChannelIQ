import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUnlock, FaShieldAlt, FaEye } from 'react-icons/fa';
import { useConnections } from '../../hooks/useConnections';
import { useProfileContext } from '../../pages/Connections';

export const BlockedUsers = () => {
  const { blockedUsers, fetchBlockedUsers, unblockUser, loading } = useConnections();
  const openProfile = useProfileContext();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: number } | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (loading && blockedUsers.length === 0) {
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

  if (blockedUsers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-gray-500/30"
        >
          <FaShieldAlt className="text-4xl text-white" />
        </motion.div>
        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No blocked users</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your block list is empty</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {blockedUsers.map((blocked, index) => {
          const user = blocked.receiver?.id ? blocked.receiver : blocked.sender!;
          return (
            <motion.div
              key={blocked.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="blocked-user-card"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, userId: user.id });
              }}
            >
              <div className="blocked-user-content">
                <div className="blocked-user-avatar">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.fullName} />
                  ) : (
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.email || 'User')}&backgroundColor=6b7280`}
                      alt={user.fullName || user.email || 'Profile'}
                    />
                  )}
                </div>
                <div className="blocked-user-info">
                  <h3>{user.fullName || user.email || 'Unknown User'}</h3>
                  {!user.fullName && user.email && <p className="user-email">{user.email}</p>}
                  {user.jobTitle && <p className="job-title">{user.jobTitle}</p>}
                  {user.department && <p className="department">{user.department}</p>}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => unblockUser(user.id)}
                className="btn-unblock"
              >
                <FaUnlock /> Unblock
              </motion.button>
            </motion.div>
          );
        })}
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
