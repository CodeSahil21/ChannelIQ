import { motion } from 'framer-motion';
import { FaUserCircle, FaEllipsisV } from 'react-icons/fa';
import { useState } from 'react';
import { PresignedImage } from '../ui/PresignedImage';
import type { ConnectionUser } from '../../types/connection.types';

interface ConnectionCardProps {
  user: ConnectionUser;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export const ConnectionCard = ({ user, actions, onClick }: ConnectionCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          {user.profilePic ? (
            <PresignedImage
              key={user.profilePic}
              fileName={user.profilePic}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              fallback={
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <FaUserCircle className="w-9 h-9 text-white" />
                </div>
              }
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <FaUserCircle className="w-9 h-9 text-white" />
            </div>
          )}
          {user.isOnline && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white dark:border-gray-900 rounded-full shadow-lg"
            >
              <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
            </motion.span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{user.fullName}</h3>
          {user.jobTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">{user.jobTitle}</p>
          )}
          {user.department && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg inline-block">{user.department}</p>
          )}
        </div>

        {actions && (
          <div className="relative flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <FaEllipsisV className="text-gray-600 dark:text-gray-400" />
            </motion.button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 min-w-[180px] border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {actions}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
