import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPencil, HiTrash, HiMail, HiPhone, HiLocationMarker, HiOfficeBuilding, HiUser, HiGlobe, HiCamera } from 'react-icons/hi';
import { Button } from '../ui/Button';
import { PresignedImage } from '../ui/PresignedImage';
import { EditProfile } from './EditProfile';
import { DeleteProfileModal } from './DeleteProfileModal';
import { ProfileImageModal } from './ProfileImageModal';
import type { UserProfileResponse } from '../../types';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ProfileViewProps {
  onProfileDeleted: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onProfileDeleted }) => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        'http://localhost:4000/api/users/get-profile',
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Profile data loaded
        setProfile(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to load profile');
      }
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="inline-loader">
        <div className="theme-loader medium">
          <div className="theme-loader-spinner"></div>
        </div>
        <p className="theme-loader-text">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h3>Profile not found</h3>
        <p>Unable to load your profile information</p>
      </div>
    );
  }

  return (
    <div className="profile-view-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-view-card"
      >
        <div className="profile-view-header">
          <div className="profile-avatar">
            {profile.profilePic ? (
              <PresignedImage
                key={profile.profilePic}
                fileName={profile.profilePic}
                alt={profile.fullName || 'Profile'}
                className="avatar-image"
                fallback={
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.fullName || profile.email)}&backgroundColor=2a5298`}
                    alt={profile.fullName || 'Profile'}
                    className="avatar-image"
                    loading="lazy"
                    decoding="async"
                  />
                }
              />
            ) : (
              <img 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.fullName || profile.email)}&backgroundColor=2a5298`}
                alt={profile.fullName || 'Profile'}
                className="avatar-image"
                loading="lazy"
                decoding="async"
              />
            )}
            <button 
              className="avatar-edit-btn" 
              onClick={() => setShowImageModal(true)}
              title="Edit profile image"
            >
              <HiCamera />
            </button>
          </div>
          
          <div className="profile-basic-info">
            <h1 className="profile-name">{profile.fullName}</h1>
            {profile.jobTitle && (
              <p className="profile-job-title">{profile.jobTitle}</p>
            )}
            {profile.department && (
              <p className="profile-department">{profile.department}</p>
            )}
          </div>
          
          <div className="profile-actions">
            <Button onClick={() => setIsEditing(true)} variant="secondary" className="edit-profile-btn">
              <HiPencil /> Edit
            </Button>
            <Button onClick={() => setShowDeleteModal(true)} variant="secondary" className="delete-profile-btn">
              <HiTrash /> Delete
            </Button>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="info-grid">
              {profile.workEmail && (
                <div className="info-item">
                  <HiMail className="info-icon" />
                  <div>
                    <label>Work Email</label>
                    <p>{profile.workEmail}</p>
                  </div>
                </div>
              )}
              
              {profile.phoneNumber && (
                <div className="info-item">
                  <HiPhone className="info-icon" />
                  <div>
                    <label>Phone</label>
                    <p>{profile.phoneNumber}</p>
                  </div>
                </div>
              )}
              
              {profile.location && (
                <div className="info-item">
                  <HiLocationMarker className="info-icon" />
                  <div>
                    <label>Location</label>
                    <p>{profile.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="profile-section">
              <h3 className="section-title">About</h3>
              <p className="bio-text">{profile.bio}</p>
            </div>
          )}

          {(profile.skills && profile.skills.length > 0) && (
            <div className="profile-section">
              <h3 className="section-title">Skills</h3>
              <div className="tags-container">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {(profile.languages && profile.languages.length > 0) && (
            <div className="profile-section">
              <h3 className="section-title">Languages</h3>
              <div className="tags-container">
                {profile.languages.map((language, index) => (
                  <span key={index} className="language-tag">{language}</span>
                ))}
              </div>
            </div>
          )}

          {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl || profile.twitterUrl) && (
            <div className="profile-section">
              <h3 className="section-title"><HiGlobe className="section-icon" /> Social Links</h3>
              <div className="social-links">
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    LinkedIn
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link github">
                    GitHub
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="social-link portfolio">
                    Portfolio
                  </a>
                )}
                {profile.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                    Twitter
                  </a>
                )}
              </div>
            </div>
          )}

          {profile.managerName && (
            <div className="profile-section">
              <h3 className="section-title">Reporting</h3>
              <div className="info-item">
                <HiOfficeBuilding className="info-icon" />
                <div>
                  <label>Manager</label>
                  <p>{profile.managerName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      
      {isEditing && profile && (
        <EditProfile
          profile={profile}
          onCancel={() => setIsEditing(false)}
          onUpdate={(updatedProfile) => {
            setProfile(updatedProfile);
            setIsEditing(false);
          }}
        />
      )}
      
      <DeleteProfileModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          setShowDeleteModal(false);
          onProfileDeleted();
        }}
      />
      
      <ProfileImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        currentImageUrl={profile?.profilePic}
        currentFileName={profile?.profilePic}
        onImageUpdate={(fileName) => {
          // Image updated
          if (profile) {
            setProfile({ ...profile, profilePic: fileName });
          }
        }}
      />
    </div>
  );
};