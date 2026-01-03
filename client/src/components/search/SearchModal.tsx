import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaUserCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { userApi } from '../../api/user.api';
import type { UserSearchResult } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (userId: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onUserClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await userApi.searchUsers(searchQuery);
      if (res.data.success) {
        setResults(res.data.data || []);
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="search-modal"
      >
        <div className="search-modal-header">
          <h2>Search Users</h2>
          <button onClick={onClose} className="close-modal-btn">
            <FaTimes />
          </button>
        </div>

        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        <div className="search-results">
          {loading && <div className="search-loading">Searching...</div>}
          
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="search-empty">No users found</div>
          )}

          <AnimatePresence>
            {results.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => {
                  onUserClick(user.id);
                  onClose();
                }}
                className="search-result-item"
              >
                <div className="search-result-avatar">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.fullName || ''} />
                  ) : (
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.email)}&backgroundColor=2a5298`}
                      alt={user.fullName || 'Profile'}
                    />
                  )}
                </div>
                <div className="search-result-info">
                  <h3>{user.fullName || 'No Name'}</h3>
                  <p className="search-result-email">{user.email}</p>
                  {user.jobTitle && <p className="search-result-job">{user.jobTitle}</p>}
                  {user.department && <p className="search-result-dept">{user.department}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
