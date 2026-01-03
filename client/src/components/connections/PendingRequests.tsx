import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTimes, FaEnvelope, FaEye } from 'react-icons/fa';
import { useConnections } from '../../hooks/useConnections';
import { useProfileContext } from '../../pages/Connections';

export const PendingRequests = () => {
  const { pendingRequests, fetchPendingRequests, acceptRequest, declineRequest, loading } = useConnections();
  const openProfile = useProfileContext();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: number } | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (loading && pendingRequests.length === 0) {
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

  if (pendingRequests.length === 0) {
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
            className="empty-state-icon"
          >
            <FaEnvelope />
          </motion.div>
          <p className="empty-state-title">No pending requests</p>
          <p className="empty-state-subtitle">You're all caught up! 🎉</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {pendingRequests.map((request, index) => (
          <motion.div
            key={request.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="request-card"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, userId: request.sender!.id });
            }}
          >
            <div className="request-card-content">
              <div className="request-user-avatar">
                {request.sender?.profilePic ? (
                  <img 
                    src={request.sender.profilePic.startsWith('http') ? request.sender.profilePic : `http://localhost:9000/profile-images/${request.sender.profilePic}`} 
                    alt={request.sender.fullName || 'Profile'}
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.sender?.fullName || request.sender?.email || 'User')}&backgroundColor=2a5298`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(request.sender?.fullName || request.sender?.email || 'User')}&backgroundColor=2a5298`}
                    alt={request.sender?.fullName || 'Profile'}
                  />
                )}
              </div>
              <div className="request-user-info">
                <h3>{request.sender?.fullName || request.sender?.email || 'Unknown User'}</h3>
                {!request.sender?.fullName && request.sender?.email && <p className="user-email">{request.sender.email}</p>}
                {request.sender?.jobTitle && <p className="job-title">{request.sender.jobTitle}</p>}
                {request.sender?.department && <p className="department">{request.sender.department}</p>}
                {request.message && (
                  <p className="request-message">"{request.message}"</p>
                )}
              </div>
            </div>
            <div className="request-actions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => acceptRequest(request.id)}
                className="btn-accept"
              >
                <FaCheck /> Accept
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => declineRequest(request.id)}
                className="btn-decline"
              >
                <FaTimes /> Decline
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
