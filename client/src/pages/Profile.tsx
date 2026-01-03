import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiSparkles, HiShieldCheck, HiLightningBolt } from 'react-icons/hi';
import { Layout } from '../components/layout/Layout';
import { CreateProfile } from '../components/profile/CreateProfile';
import { ProfileView } from '../components/profile/ProfileView';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkProfile = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        'http://localhost:4000/api/users/get-profile',
        { withCredentials: true }
      );
      const data = response.data.data;
      if (data && data.profileCreated !== false) {
        setProfileData(data);
      } else {
        setProfileData({ profileCreated: false });
      }
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setProfileData({ profileCreated: false });
      } else {
        toast.error('Failed to check profile status');
        setProfileData({ profileCreated: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
  }, []);

  const handleProfileCreated = () => {
    checkProfile();
  };

  const handleProfileDeleted = () => {
    setProfileData({ profileCreated: false });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="profile-loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="profile-loading-spinner"
          />
          <p className="profile-loading-text">Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="enhanced-profile-container">
        {!profileData || profileData.profileCreated === false ? (
          <>
            {/* Hero Section for Profile Creation */}
            <div className="profile-hero-section">
              <div className="profile-hero-content">
                <div className="profile-hero-badge">
                  <HiUser className="hero-badge-icon" />
                  <span>Professional Profile</span>
                </div>
                
                <h1 className="profile-hero-title">
                  Build Your Professional Identity
                </h1>
                
                <p className="profile-hero-subtitle">
                  Create a comprehensive profile to showcase your skills, experience, and connect with colleagues
                </p>
                
                <div className="profile-hero-features">
                  <div className="hero-feature">
                    <HiShieldCheck className="hero-feature-icon" />
                    <span>Secure & Private</span>
                  </div>
                  
                  <div className="hero-feature">
                    <HiLightningBolt className="hero-feature-icon" />
                    <span>Quick Setup</span>
                  </div>
                  
                  <div className="hero-feature">
                    <HiSparkles className="hero-feature-icon" />
                    <span>Professional</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-hero-visual">
                <div className="profile-visualization">
                  <div className="profile-node profile-node--center">
                    <HiUser />
                    <span>You</span>
                  </div>
                  
                  <div className="profile-node profile-node--skill">
                    <span>Skills</span>
                  </div>
                  
                  <div className="profile-node profile-node--experience">
                    <span>Experience</span>
                  </div>
                  
                  <div className="profile-node profile-node--network">
                    <span>Network</span>
                  </div>
                </div>
              </div>
            </div>
            
            <CreateProfile onProfileCreated={handleProfileCreated} />
          </>
        ) : (
          <ProfileView onProfileDeleted={handleProfileDeleted} />
        )}
      </div>
    </Layout>
  );
};

export default Profile;
export { Profile };
