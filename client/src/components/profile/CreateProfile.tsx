import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiUser, HiBriefcase, HiGlobe, HiArrowRight, HiArrowLeft, HiSparkles } from 'react-icons/hi';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CreateProfileFormData } from '../../types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../../config/api';

interface CreateProfileProps {
  onProfileCreated: () => void;
}

export const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateProfileFormData>({
    fullName: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    workEmail: '',
    bio: '',
    location: '',
    timezone: '',
    skills: [],
    languages: [],
    managerId: undefined,
    managerName: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    twitterUrl: ''
  });
  const [skillsText, setSkillsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    // Convert text inputs to arrays before submission
    const skillsArray = skillsText.split(',').map(s => s.trim()).filter(Boolean);
    const languagesArray = languagesText.split(',').map(s => s.trim()).filter(Boolean);

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
      if (skillsArray.length > 0) cleanedData.skills = skillsArray;
      if (languagesArray.length > 0) cleanedData.languages = languagesArray;
      if (formData.managerId) cleanedData.managerId = formData.managerId;
      if (formData.managerName?.trim()) cleanedData.managerName = formData.managerName.trim();
      if (formData.linkedinUrl?.trim()) cleanedData.linkedinUrl = formData.linkedinUrl.trim();
      if (formData.githubUrl?.trim()) cleanedData.githubUrl = formData.githubUrl.trim();
      if (formData.portfolioUrl?.trim()) cleanedData.portfolioUrl = formData.portfolioUrl.trim();
      if (formData.twitterUrl?.trim()) cleanedData.twitterUrl = formData.twitterUrl.trim();

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/users/create-profile`,
        cleanedData,
        DEFAULT_AXIOS_CONFIG
      );
      
      toast.success(response.data.message);
      onProfileCreated();
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
        toast.error('User not found');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to create profile');
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
      subtitle: 'Tell us about yourself',
      icon: HiUser,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 2,
      title: 'Professional Details',
      subtitle: 'Share your professional background',
      icon: HiBriefcase,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 3,
      title: 'Skills & Social Links',
      subtitle: 'Showcase your expertise and connect',
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
            className="create-profile-step"
          >
            <div className="step-form-grid">
              <Input
                label="Full Name *"
                value={formData.fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Enter your full name"
                required
              />
              
              <Input
                label="Job Title"
                value={formData.jobTitle || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, jobTitle: e.target.value})}
                placeholder="Software Engineer"
              />
              
              <Input
                label="Department"
                value={formData.department || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, department: e.target.value})}
                placeholder="Engineering"
              />
              
              <Input
                label="Work Email"
                type="email"
                value={formData.workEmail || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, workEmail: e.target.value})}
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
            className="create-profile-step"
          >
            <div className="step-form-grid">
              <Input
                label="Phone Number"
                value={formData.phoneNumber || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
              
              <Input
                label="Location"
                value={formData.location || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
                placeholder="San Francisco, CA"
              />
              
              <Input
                label="Manager Name"
                value={formData.managerName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, managerName: e.target.value})}
                placeholder="Manager's name"
              />
              
              <div className="bio-field">
                <label className="bio-label">Bio</label>
                <textarea
                  className="bio-textarea"
                  value={formData.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, bio: e.target.value})}
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
            className="create-profile-step"
          >
            <div className="step-form-grid">
              <div className="skills-field">
                <label className="skills-label">Skills</label>
                <textarea
                  className="bio-textarea"
                  value={skillsText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSkillsText(e.target.value)}
                  placeholder="JavaScript, React, Node.js (comma separated)"
                  rows={3}
                />
              </div>
              
              <div className="languages-field">
                <label className="languages-label">Languages</label>
                <textarea
                  className="bio-textarea"
                  value={languagesText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLanguagesText(e.target.value)}
                  placeholder="English, Spanish, French (comma separated)"
                  rows={3}
                />
              </div>
              
              <Input
                label="LinkedIn URL"
                value={formData.linkedinUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, linkedinUrl: e.target.value})}
                placeholder="https://linkedin.com/in/username"
              />
              
              <Input
                label="GitHub URL"
                value={formData.githubUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, githubUrl: e.target.value})}
                placeholder="https://github.com/username"
              />
              
              <Input
                label="Portfolio URL"
                value={formData.portfolioUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, portfolioUrl: e.target.value})}
                placeholder="https://yourportfolio.com"
              />
              
              <Input
                label="Twitter URL"
                value={formData.twitterUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, twitterUrl: e.target.value})}
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
    <div className="enhanced-create-profile">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="create-profile-main"
      >
        {/* Step Header */}
        <div className="create-profile-header">
          <div className="step-indicator">
            <div className={`step-icon-wrapper bg-gradient-to-r ${currentStepData.color}`}>
              <StepIcon className="step-icon" />
            </div>
            <div className="step-info">
              <h2 className="step-title">{currentStepData.title}</h2>
              <p className="step-subtitle">{currentStepData.subtitle}</p>
            </div>
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
        
        {/* Step Content */}
        <div className="create-profile-content">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="create-profile-navigation">
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
              className="nav-button create-button"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="button-spinner"
                  />
                  Creating Profile...
                </>
              ) : (
                <>
                  <HiSparkles /> Create Profile
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};