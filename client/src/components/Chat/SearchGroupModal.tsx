import React, { useState, useEffect } from 'react';
import { HiX, HiSearch } from 'react-icons/hi';
import { SearchGroupsCards } from './SearchGroupsCards';
import { useGroups } from '../../hooks/useGroups';

interface SearchGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchGroupModal: React.FC<SearchGroupModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchResults, loading, searchGroups, clearSearchResults } = useGroups();



  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchGroups(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      clearSearchResults();
    }
  }, [searchQuery, searchGroups, clearSearchResults]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      clearSearchResults();
    }
  }, [isOpen, clearSearchResults]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <h2>Search Groups</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="search-input-wrapper">
          <HiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search public groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Searching groups...</p>
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="search-empty">
              <p>Enter at least 2 characters to search for groups</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="search-empty">
              <p>No groups found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="search-results-list">
              {searchResults.map(group => (
                <SearchGroupsCards key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SearchGroupModal };
export default SearchGroupModal;