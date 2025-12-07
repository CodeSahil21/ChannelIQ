import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUserCircle, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaLinkedin, FaGithub, FaGlobe, FaTwitter } from 'react-icons/fa';
import { userApi } from '../../api/user.api';
import { useConnections } from '../../hooks/useConnections';
import type { UserProfileResponse, ConnectionStatusString } from '../../types';

interface UserProfileModalProps {
  userId: number | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusString | null>(null);
  const [message, setMessage] = useState('');
  const { sendRequest, getConnectionStatus } = useConnections();

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchConnectionStatus();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await userApi.fetchUserProfile(userId);
      if (res.data.success) {
        setProfile(res.data.data || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    if (!userId) return;
    const status = await getConnectionStatus(userId);
    setConnectionStatus(status);
  };

  const handleSendRequest = async () => {
    if (!userId) return;
    await sendRequest({ receiverId: userId, message });
    setMessage('');
    fetchConnectionStatus();
  };

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="user-profile-modal"
      >
        <div className="modal-header">
          <h2>User Profile</h2>
          <button onClick={onClose} className="close-modal-btn">
            <FaTimes />
          </button>
        </div>

        {loading ? (
          <div className="profile-loading">Loading profile...</div>
        ) : profile ? (
          <div className="profile-modal-content">
            <div className="profile-modal-header">
              <div className="profile-modal-avatar">
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt={profile.fullName || ''} />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <div className="profile-modal-info">
                <h3>{profile.fullName || 'No Name'}</h3>
                {profile.jobTitle && (
                  <p className="profile-modal-job">
                    <FaBriefcase /> {profile.jobTitle}
                  </p>
                )}
                {profile.department && (
                  <p className="profile-modal-dept">
                    <FaBuilding /> {profile.department}
                  </p>
                )}
                {profile.location && (
                  <p className="profile-modal-location">
                    <FaMapMarkerAlt /> {profile.location}
                  </p>
                )}
              </div>
            </div>

            {profile.bio && (
              <div className="profile-modal-section">
                <h4>About</h4>
                <p>{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="profile-modal-section">
                <h4>Skills</h4>
                <div className="profile-modal-tags">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl || profile.twitterUrl) && (
              <div className="profile-modal-section">
                <h4>Links</h4>
                <div className="profile-modal-links">
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                      <FaLinkedin /> LinkedIn
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link github">
                      <FaGithub /> GitHub
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="social-link portfolio">
                      <FaGlobe /> Portfolio
                    </a>
                  )}
                  {profile.twitterUrl && (
                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                      <FaTwitter /> Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {connectionStatus === 'NONE' && (
              <div className="profile-modal-section">
                <h4>Send Connection Request</h4>
                <textarea
                  placeholder="Add a message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="connection-message-input"
                  rows={3}
                />
                <button onClick={handleSendRequest} className="btn btn-primary">
                  Send Request
                </button>
              </div>
            )}

            {connectionStatus === 'PENDING' && (
              <div className="connection-status-badge pending">Request Pending</div>
            )}

            {connectionStatus === 'CONNECTED' && (
              <div className="connection-status-badge connected">Already Connected</div>
            )}

            {connectionStatus === 'BLOCKED' && (
              <div className="connection-status-badge blocked">Blocked</div>
            )}

            {connectionStatus === 'SELF' && (
              <div className="connection-status-badge self">This is your profile</div>
            )}
          </div>
        ) : (
          <div className="profile-error">Profile not found</div>
        )}
      </motion.div>
    </div>
  );
};
