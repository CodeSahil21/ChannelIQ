import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiUser, HiBriefcase, HiGlobe, HiX, HiArrowRight, HiArrowLeft, HiSparkles } from 'react-icons/hi';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CreateProfileFormData, UserProfileResponse } from '../../types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../../config/api';

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
        `${API_CONFIG.BASE_URL}/api/users/update-profile`,
        cleanedData,
        DEFAULT_AXIOS_CONFIG
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

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      subtitle: 'Update your basic details',
      icon: HiUser,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 2,
      title: 'Professional Details',
      subtitle: 'Update your professional background',
      icon: HiBriefcase,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 3,
      title: 'Skills & Social Links',
      subtitle: 'Update your expertise and connections',
      icon: HiGlobe,
      color: 'from-pink-500 to-red-600'
    }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="edit-profile-step"
          >
            <div className="step-form-grid">
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
            exit={{ opacity: 0, x: -20 }}
            className="edit-profile-step"
          >
            <div className="step-form-grid">
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
              
              <div className="bio-field">
                <label className="bio-label">Bio</label>
                <textarea
                  className="bio-textarea"
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="edit-profile-step"
          >
            <div className="step-form-grid">
              <div className="skills-field">
                <label className="skills-label">Skills</label>
                <input
                  className="skills-input"
                  value={(formData.skills || []).join(', ')}
                  onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  placeholder="JavaScript, React, Node.js (comma separated)"
                />
              </div>
              
              <div className="languages-field">
                <label className="languages-label">Languages</label>
                <input
                  className="languages-input"
                  value={(formData.languages || []).join(', ')}
                  onChange={(e) => setFormData({...formData, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  placeholder="English, Spanish, French (comma separated)"
                />
              </div>
              
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

  const currentStepData = steps[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div className="edit-profile-overlay">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="edit-profile-backdrop"
        onClick={onCancel}
      />
      
      <div className="edit-profile-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="edit-profile-main"
        >
          {/* Header */}
          <div className="edit-profile-header">
            <div className="edit-header-content">
              <div className="step-indicator">
                <div className={`step-icon-wrapper bg-gradient-to-r ${currentStepData.color}`}>
                  <StepIcon className="step-icon" />
                </div>
                <div className="step-info">
                  <h2 className="step-title">{currentStepData.title}</h2>
                  <p className="step-subtitle">{currentStepData.subtitle}</p>
                </div>
              </div>
              
              <button className="edit-close-btn" onClick={onCancel}>
                <HiX />
              </button>
            </div>
            
            <div className="progress-section">
              <div className="progress-bar-container">
                <div className="progress-track">
                  <motion.div 
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="progress-text">{currentStep} of {totalSteps}</span>
              </div>
              
              <div className="step-dots">
                {steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`step-dot ${
                      index + 1 <= currentStep ? 'active' : ''
                    } ${
                      index + 1 === currentStep ? 'current' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="edit-profile-content">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
          
          {/* Navigation */}
          <div className="edit-profile-navigation">
            {currentStep > 1 && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={prevStep}
                className="nav-button prev-button"
              >
                <HiArrowLeft /> Previous
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel}
              className="nav-button cancel-button"
            >
              Cancel
            </Button>
            
            <div className="nav-spacer" />
            
            {currentStep < totalSteps ? (
              <Button 
                type="button" 
                variant="primary" 
                onClick={nextStep}
                disabled={!formData.fullName}
                className="nav-button next-button"
              >
                Next Step <HiArrowRight />
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.fullName}
                className="nav-button update-button"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="button-spinner"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <HiSparkles /> Update Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};