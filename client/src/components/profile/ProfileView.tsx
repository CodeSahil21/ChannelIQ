import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPencil, HiTrash, HiMail, HiPhone, HiLocationMarker, HiOfficeBuilding, HiUser, HiGlobe, HiCamera, HiSparkles, HiAcademicCap, HiChat } from 'react-icons/hi';
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
      <div className="profile-loading-container">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="profile-loading-spinner"
        />
        <p className="profile-loading-text">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="profile-error-content"
        >
          <div className="profile-error-icon">
            <HiUser />
          </div>
          <h3 className="profile-error-title">Profile not found</h3>
          <p className="profile-error-subtitle">Unable to load your profile information</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="enhanced-profile-view">
      {/* Profile Hero Section */}
      <div className="profile-view-hero">
        <div className="profile-hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="profile-hero-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-avatar-section"
          >
            <div className="profile-avatar-wrapper">
              {profile.profilePic ? (
                <PresignedImage
                  key={profile.profilePic}
                  fileName={profile.profilePic}
                  alt={profile.fullName || 'Profile'}
                  className="profile-avatar-image"
                  fallback={
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.fullName || profile.email)}&backgroundColor=2a5298`}
                      alt={profile.fullName || 'Profile'}
                      className="profile-avatar-image"
                    />
                  }
                />
              ) : (
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.fullName || profile.email)}&backgroundColor=2a5298`}
                  alt={profile.fullName || 'Profile'}
                  className="profile-avatar-image"
                />
              )}
              <button 
                className="avatar-edit-button" 
                onClick={() => setShowImageModal(true)}
                title="Edit profile image"
              >
                <HiCamera />
              </button>
            </div>
            
            <div className="profile-hero-info">
              <h1 className="profile-hero-name">{profile.fullName}</h1>
              {profile.jobTitle && (
                <p className="profile-hero-title">{profile.jobTitle}</p>
              )}
              {profile.department && (
                <p className="profile-hero-department">{profile.department}</p>
              )}
              
              <div className="profile-hero-badges">
                <div className="profile-badge">
                  <HiSparkles className="badge-icon" />
                  <span>Professional</span>
                </div>
                {profile.skills && profile.skills.length > 0 && (
                  <div className="profile-badge">
                    <HiAcademicCap className="badge-icon" />
                    <span>{profile.skills.length} Skills</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="profile-hero-actions"
          >
            <Button onClick={() => setIsEditing(true)} variant="primary" className="profile-action-btn">
              <HiPencil /> Edit Profile
            </Button>
            <Button onClick={() => setShowDeleteModal(true)} variant="secondary" className="profile-action-btn danger">
              <HiTrash /> Delete
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Profile Content Sections */}
      <div className="profile-content-container">
        <div className="profile-content-grid">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="profile-section-card"
          >
            <div className="section-header">
              <HiMail className="section-icon" />
              <h3 className="section-title">Contact Information</h3>
            </div>
            
            <div className="contact-info-grid">
              {profile.workEmail && (
                <div className="contact-item">
                  <HiMail className="contact-icon" />
                  <div className="contact-details">
                    <label>Work Email</label>
                    <p>{profile.workEmail}</p>
                  </div>
                </div>
              )}
              
              {profile.phoneNumber && (
                <div className="contact-item">
                  <HiPhone className="contact-icon" />
                  <div className="contact-details">
                    <label>Phone</label>
                    <p>{profile.phoneNumber}</p>
                  </div>
                </div>
              )}
              
              {profile.location && (
                <div className="contact-item">
                  <HiLocationMarker className="contact-icon" />
                  <div className="contact-details">
                    <label>Location</label>
                    <p>{profile.location}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* About Section */}
          {profile.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="profile-section-card bio-section"
            >
              <div className="section-header">
                <HiChat className="section-icon" />
                <h3 className="section-title">About</h3>
              </div>
              <p className="bio-content">{profile.bio}</p>
            </motion.div>
          )}

          {/* Skills Section */}
          {(profile.skills && profile.skills.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="profile-section-card"
            >
              <div className="section-header">
                <HiAcademicCap className="section-icon" />
                <h3 className="section-title">Skills & Expertise</h3>
              </div>
              <div className="skills-grid">
                {profile.skills.map((skill, index) => (
                  <motion.span 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="skill-tag"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Languages Section */}
          {(profile.languages && profile.languages.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="profile-section-card"
            >
              <div className="section-header">
                <HiGlobe className="section-icon" />
                <h3 className="section-title">Languages</h3>
              </div>
              <div className="languages-grid">
                {profile.languages.map((language, index) => (
                  <span key={index} className="language-tag">{language}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Social Links */}
          {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl || profile.twitterUrl) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="profile-section-card"
            >
              <div className="section-header">
                <HiGlobe className="section-icon" />
                <h3 className="section-title">Social Links</h3>
              </div>
              <div className="social-links-grid">
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link github">
                    <span>GitHub</span>
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="social-link portfolio">
                    <span>Portfolio</span>
                  </a>
                )}
                {profile.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                    <span>Twitter</span>
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* Manager Information */}
          {profile.managerName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="profile-section-card"
            >
              <div className="section-header">
                <HiOfficeBuilding className="section-icon" />
                <h3 className="section-title">Reporting Structure</h3>
              </div>
              <div className="manager-info">
                <HiUser className="manager-icon" />
                <div className="manager-details">
                  <label>Reports to</label>
                  <p>{profile.managerName}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <AnimatePresence>
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
      </AnimatePresence>
      
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
          if (profile) {
            setProfile({ ...profile, profilePic: fileName });
          }
        }}
      />
    </div>
  );
};