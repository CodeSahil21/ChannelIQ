import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiBriefcase, HiGlobe, HiX } from 'react-icons/hi';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { TagInput } from '../ui/TagInput';
import { Button } from '../ui/Button';
import type { CreateProfileFormData, UserProfileResponse } from '../../types';
import axios from 'axios';
import toast from 'react-hot-toast';

interface EditProfileProps {
  profile: UserProfileResponse;
  onCancel: () => void;
  onUpdate: (updatedProfile: UserProfileResponse) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ profile, onCancel, onUpdate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateProfileFormData>({
    fullName: profile.fullName || '',
    profilePic: profile.profilePic || '',
    jobTitle: profile.jobTitle || '',
    department: profile.department || '',
    phoneNumber: profile.phoneNumber || '',
    workEmail: profile.workEmail || '',
    bio: profile.bio || '',
    location: profile.location || '',
    timezone: profile.timezone || '',
    skills: profile.skills || [],
    languages: profile.languages || [],
    managerId: profile.managerId || undefined,
    managerName: profile.managerName || '',
    linkedinUrl: profile.linkedinUrl || '',
    githubUrl: profile.githubUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    twitterUrl: profile.twitterUrl || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setIsLoading(true);

    try {
      const cleanedData: Partial<CreateProfileFormData> = {
        fullName: formData.fullName.trim()
      };

      if (formData.profilePic?.trim()) cleanedData.profilePic = formData.profilePic.trim();
      if (formData.jobTitle?.trim()) cleanedData.jobTitle = formData.jobTitle.trim();
      if (formData.department?.trim()) cleanedData.department = formData.department.trim();
      if (formData.phoneNumber?.trim()) cleanedData.phoneNumber = formData.phoneNumber.trim();
      if (formData.workEmail?.trim()) cleanedData.workEmail = formData.workEmail.trim();
      if (formData.bio?.trim()) cleanedData.bio = formData.bio.trim();
      if (formData.location?.trim()) cleanedData.location = formData.location.trim();
      if (formData.timezone?.trim()) cleanedData.timezone = formData.timezone.trim();
      if (formData.skills && formData.skills.length > 0) cleanedData.skills = formData.skills;
      if (formData.languages && formData.languages.length > 0) cleanedData.languages = formData.languages;
      if (formData.managerId) cleanedData.managerId = formData.managerId;
      if (formData.managerName?.trim()) cleanedData.managerName = formData.managerName.trim();
      if (formData.linkedinUrl?.trim()) cleanedData.linkedinUrl = formData.linkedinUrl.trim();
      if (formData.githubUrl?.trim()) cleanedData.githubUrl = formData.githubUrl.trim();
      if (formData.portfolioUrl?.trim()) cleanedData.portfolioUrl = formData.portfolioUrl.trim();
      if (formData.twitterUrl?.trim()) cleanedData.twitterUrl = formData.twitterUrl.trim();

      const response = await axios.put(
        'http://localhost:4000/api/users/update-profile',
        cleanedData,
        { withCredentials: true }
      );
      
      toast.success(response.data.message);
      onUpdate(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 400) {
        if (err.response.data.errors) {
          err.response.data.errors.forEach((error: { field: string; message: string }) => {
            toast.error(`${error.field}: ${error.message}`);
          });
        } else {
          toast.error(err.response.data.message || 'Validation failed');
        }
      } else if (err.response?.status === 404) {
        toast.error('Profile not found');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));



  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <HiUser className="step-icon" />
              <h3>Basic Information</h3>
              <p>Update your basic details</p>
            </div>
            
            <div className="form-grid">
              <Input
                label="Full Name *"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Enter your full name"
                required
              />
              
              <Input
                label="Job Title"
                value={formData.jobTitle || ''}
                onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                placeholder="Software Engineer"
              />
              
              <Input
                label="Department"
                value={formData.department || ''}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="Engineering"
              />
              
              <Input
                label="Work Email"
                type="email"
                value={formData.workEmail || ''}
                onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
                placeholder="your.name@company.com"
              />
            </div>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <HiBriefcase className="step-icon" />
              <h3>Professional Details</h3>
              <p>Update your professional background</p>
            </div>
            
            <div className="form-grid">
              <Input
                label="Phone Number"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
              
              <Input
                label="Location"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="San Francisco, CA"
              />
              
              <Input
                label="Manager Name"
                value={formData.managerName || ''}
                onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                placeholder="Manager's name"
              />
              
              <TextArea
                label="Bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <HiGlobe className="step-icon" />
              <h3>Skills & Social Links</h3>
              <p>Update your expertise and connections</p>
            </div>
            
            <div className="form-grid">
              <TagInput
                label="Skills"
                value={formData.skills || []}
                onChange={(skills) => setFormData({...formData, skills})}
                placeholder="Add a skill and press Enter"
              />
              
              <TagInput
                label="Languages"
                value={formData.languages || []}
                onChange={(languages) => setFormData({...formData, languages})}
                placeholder="Add a language and press Enter"
              />
              
              <Input
                label="LinkedIn URL"
                value={formData.linkedinUrl || ''}
                onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                placeholder="https://linkedin.com/in/username"
              />
              
              <Input
                label="GitHub URL"
                value={formData.githubUrl || ''}
                onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                placeholder="https://github.com/username"
              />
              
              <Input
                label="Portfolio URL"
                value={formData.portfolioUrl || ''}
                onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                placeholder="https://yourportfolio.com"
              />
              
              <Input
                label="Twitter URL"
                value={formData.twitterUrl || ''}
                onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})}
                placeholder="https://twitter.com/username"
              />
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="edit-profile-overlay">
      <div className="edit-profile-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="edit-profile-card"
        >
          <div className="edit-profile-header">
            <h1 className="profile-main-title">Edit Profile</h1>
            <button className="close-edit-btn" onClick={onCancel}>
              <HiX />
            </button>
          </div>
          
          <div className="progress-bar">
            <div className="progress-track">
              <div 
                className="progress-fill"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <span className="progress-text">{currentStep} of {totalSteps}</span>
          </div>
          
          <div>
            {renderStep()}
            
            <div className="form-actions">
              {currentStep > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  Previous
                </Button>
              )}
              
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              
              {currentStep < totalSteps ? (
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={nextStep}
                  disabled={!formData.fullName}
                >
                  Next Step
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={handleSubmit} disabled={isLoading || !formData.fullName}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};