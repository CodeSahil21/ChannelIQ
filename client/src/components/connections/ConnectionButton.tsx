import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaUserCheck, FaClock, FaBan, FaUserMinus } from 'react-icons/fa';
import { useConnections } from '../../hooks/useConnections';
import { SendRequestModal } from './SendRequestModal';
import type { ConnectionStatusString } from '../../types/connection.types';

interface ConnectionButtonProps {
  userId: number;
  userName: string;
}

export const ConnectionButton = ({ userId, userName }: ConnectionButtonProps) => {
  const [status, setStatus] = useState<ConnectionStatusString | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { getConnectionStatus, removeConnection, blockUser, loading } = useConnections();

  useEffect(() => {
    loadStatus();
  }, [userId]);

  const loadStatus = async () => {
    const result = await getConnectionStatus(userId);
    setStatus(result);
  };

  const handleRemove = async () => {
    await removeConnection(userId);
    loadStatus();
  };

  const handleBlock = async () => {
    await blockUser(userId);
    loadStatus();
  };

  if (status === 'SELF') return null;

  const buttonConfig = {
    NONE: {
      icon: FaUserPlus,
      text: 'Connect',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
      onClick: () => setShowModal(true),
    },
    SENT: {
      icon: FaClock,
      text: 'Pending',
      className: 'bg-yellow-500 text-white cursor-not-allowed',
      onClick: () => {},
    },
    RECEIVED: {
      icon: FaClock,
      text: 'Respond',
      className: 'bg-green-600 hover:bg-green-700 text-white',
      onClick: () => {},
    },
    CONNECTED: {
      icon: FaUserCheck,
      text: 'Connected',
      className: 'bg-gray-600 hover:bg-gray-700 text-white',
      onClick: handleRemove,
    },
    BLOCKED: {
      icon: FaBan,
      text: 'Blocked',
      className: 'bg-red-600 text-white cursor-not-allowed',
      onClick: () => {},
    },
  };

  const config = status ? buttonConfig[status] : null;
  if (!config) return null;

  const Icon = config.icon;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={config.onClick}
        disabled={loading || status === 'SENT' || status === 'BLOCKED'}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${config.className}`}
      >
        <Icon />
        {config.text}
      </motion.button>

      <SendRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        receiverId={userId}
        receiverName={userName}
      />
    </>
  );
};
