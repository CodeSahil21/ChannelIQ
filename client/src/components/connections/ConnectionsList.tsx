import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserMinus, FaBan, FaUserFriends, FaEye } from 'react-icons/fa';
import { useConnections } from '../../hooks/useConnections';
import { useProfileContext } from '../../pages/Connections';

const ConnectionsListComponent = () => {
  const { connections, fetchConnections, removeConnection, blockUser, loading } = useConnections();
  const openProfile = useProfileContext();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: number } | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleRemoveConnection = useCallback((userId: number) => {
    removeConnection(userId);
  }, [removeConnection]);

  const handleBlockUser = useCallback((userId: number) => {
    blockUser(userId);
  }, [blockUser]);

  const handleContextMenu = useCallback((e: React.MouseEvent, userId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, userId });
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (loading && connections.length === 0) {
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

  if (connections.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-content">
          <div className="empty-state-icon">
            <FaUserFriends />
          </div>
          <h3 className="empty-state-title">No connections yet</h3>
          <p className="empty-state-subtitle">Start connecting with people</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {connections.map((user, index) => (
          <motion.div
            key={user.connectionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="connection-card"
            onContextMenu={(e) => handleContextMenu(e, user.id)}
          >
            <div className="connection-card-content">
              <div className="connection-user-avatar">
                {user.profilePic ? (
                  <img 
                    src={user.profilePic.startsWith('http') ? user.profilePic : `http://localhost:9000/profile-images/${user.profilePic}`} 
                    alt={user.fullName}
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}&backgroundColor=2a5298`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}&backgroundColor=2a5298`}
                    alt={user.fullName}
                  />
                )}
                {user.isOnline && <div className="online-indicator" />}
              </div>
              <div className="connection-user-info">
                <h3>{user.fullName}</h3>
                {user.jobTitle && <p className="job-title">{user.jobTitle}</p>}
                {user.department && <p className="department">{user.department}</p>}
              </div>
            </div>
            <div className="connection-actions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRemoveConnection(user.id)}
                className="btn-remove"
              >
                <FaUserMinus /> Remove
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBlockUser(user.id)}
                className="btn-block"
              >
                <FaBan /> Block
              </motion.button>
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

export const ConnectionsList = memo(ConnectionsListComponent);
