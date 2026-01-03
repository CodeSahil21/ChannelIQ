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
      <div className="empty-state-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="empty-state-content"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="empty-state-icon blocked-icon"
          >
            <FaShieldAlt />
          </motion.div>
          <p className="empty-state-title">No blocked users</p>
          <p className="empty-state-subtitle">Your block list is empty</p>
        </motion.div>
      </div>
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
                    <img 
                      src={user.profilePic.startsWith('http') ? user.profilePic : `http://localhost:9000/profile-images/${user.profilePic}`} 
                      alt={user.fullName || 'Profile'}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.email || 'User')}&backgroundColor=6b7280`;
                      }}
                    />
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
