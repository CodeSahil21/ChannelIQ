import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { CreateProfile } from '../components/profile/CreateProfile';
import { ProfileView } from '../components/profile/ProfileView';
import axios from 'axios';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
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
        <div className="dashboard-loading">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!profileData || profileData.profileCreated === false ? (
        <CreateProfile onProfileCreated={handleProfileCreated} />
      ) : (
        <ProfileView onProfileDeleted={handleProfileDeleted} />
      )}
    </Layout>
  );
};
