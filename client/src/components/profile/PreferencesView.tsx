import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { HiCog, HiMoon, HiSun, HiBell, HiGlobe } from 'react-icons/hi';
import { Button } from '../ui/Button';
import { setPreferences as setThemePreferences } from '../../store/themeSlice';
import type { UserPreference, UpdatePreferencesData } from '../../types';
import type { RootState } from '../../store';
import axios from 'axios';
import toast from 'react-hot-toast';

export const PreferencesView: React.FC = () => {
  const dispatch = useDispatch();
  const themeState = useSelector((state: RootState) => state.theme);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdatePreferencesData>({
    theme: themeState.theme?.toUpperCase() || 'LIGHT',
    language: themeState.language || 'en',
    timezone: themeState.timezone || 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    connectionRequests: true,
    profileViews: true,
    profileVisibility: 'PUBLIC',
    showOnlineStatus: true,
    showLastSeen: true,
    appearInSearch: true,
    showSuggestions: true
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get(
        'http://localhost:4000/api/users/preferences',
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const prefs = response.data.data;
        setPreferences(prefs);
        const themeValue = (prefs.theme?.toLowerCase() || 'light') as 'light' | 'dark';
        setFormData({
          theme: prefs.theme || 'LIGHT',
          language: prefs.language || 'en',
          timezone: prefs.timezone || 'UTC',
          emailNotifications: prefs.emailNotifications ?? true,
          pushNotifications: prefs.pushNotifications ?? true,
          connectionRequests: prefs.connectionRequests ?? true,
          profileViews: prefs.profileViews ?? true,
          profileVisibility: prefs.profileVisibility || 'PUBLIC',
          showOnlineStatus: prefs.showOnlineStatus ?? true,
          showLastSeen: prefs.showLastSeen ?? true,
          appearInSearch: prefs.appearInSearch ?? true,
          showSuggestions: prefs.showSuggestions ?? true
        });
        dispatch(setThemePreferences({ theme: themeValue, language: prefs.language, timezone: prefs.timezone }));
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No preferences found, use defaults
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to load preferences');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const dataToSend = {
        ...formData,
        theme: formData.theme?.toUpperCase()
      };
      
      const response = await axios.put(
        'http://localhost:4000/api/users/preferences',
        dataToSend,
        { withCredentials: true }
      );
      
      toast.success(response.data.message);
      const themeValue = formData.theme?.toLowerCase() as 'light' | 'dark';
      dispatch(setThemePreferences({ theme: themeValue, language: formData.language, timezone: formData.timezone }));
      setPreferences(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 400) {
        toast.error(err.response.data.message || 'Validation failed');
      } else if (err.response?.status === 404) {
        toast.error('Failed to update preferences. Please try again.');
        toast.error('User not found');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to save preferences');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="preferences-loading">
        <div className="loading-spinner"></div>
        <p>Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="preferences-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="preferences-card"
      >
        <div className="preferences-header">
          <div className="header-content">
            <HiCog className="header-icon" />
            <div>
              <h1 className="preferences-title">Preferences</h1>
              <p className="preferences-subtitle">Customize your experience</p>
            </div>
          </div>
        </div>

        <div className="preferences-content">
          <div className="preference-section">
            <div className="section-header">
              <HiSun className="section-icon" />
              <h3>Appearance</h3>
            </div>
            
            <div className="preference-item">
              <div className="preference-info">
                <label>Theme</label>
                <p>Choose your preferred color scheme</p>
              </div>
              <div className="theme-selector">
                <button
                  type="button"
                  className={`theme-option ${formData.theme?.toLowerCase() === 'light' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, theme: 'LIGHT'})}
                >
                  <HiSun />
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-option ${formData.theme?.toLowerCase() === 'dark' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, theme: 'DARK'})}
                >
                  <HiMoon />
                  Dark
                </button>
              </div>
            </div>
          </div>

          <div className="preference-section">
            <div className="section-header">
              <HiBell className="section-icon" />
              <h3>Notifications</h3>
            </div>
            
            <div className="preference-item">
              <div className="preference-info">
                <label>Email Notifications</label>
                <p>Receive email notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications ?? true}
                  onChange={(e) => setFormData({...formData, emailNotifications: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Push Notifications</label>
                <p>Receive push notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.pushNotifications ?? true}
                  onChange={(e) => setFormData({...formData, pushNotifications: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Connection Requests</label>
                <p>Get notified about connection requests</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.connectionRequests ?? true}
                  onChange={(e) => setFormData({...formData, connectionRequests: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Profile Views</label>
                <p>Get notified when someone views your profile</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.profileViews ?? true}
                  onChange={(e) => setFormData({...formData, profileViews: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="preference-section">
            <div className="section-header">
              <HiCog className="section-icon" />
              <h3>Privacy</h3>
            </div>
            
            <div className="preference-item">
              <div className="preference-info">
                <label>Profile Visibility</label>
                <p>Control who can see your profile</p>
              </div>
              <select
                value={formData.profileVisibility || 'PUBLIC'}
                onChange={(e) => setFormData({...formData, profileVisibility: e.target.value as any})}
                className="preference-select">
                <option value="PUBLIC">Public</option>
                <option value="CONNECTIONS_ONLY">Connections Only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Show Online Status</label>
                <p>Let others see when you're online</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.showOnlineStatus ?? true}
                  onChange={(e) => setFormData({...formData, showOnlineStatus: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Show Last Seen</label>
                <p>Display your last active time</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.showLastSeen ?? true}
                  onChange={(e) => setFormData({...formData, showLastSeen: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Appear in Search</label>
                <p>Allow others to find you in search</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.appearInSearch ?? true}
                  onChange={(e) => setFormData({...formData, appearInSearch: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label>Show Suggestions</label>
                <p>Receive personalized suggestions</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.showSuggestions ?? true}
                  onChange={(e) => setFormData({...formData, showSuggestions: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="preference-section">
            <div className="section-header">
              <HiGlobe className="section-icon" />
              <h3>Localization</h3>
            </div>
            
            <div className="preference-item">
              <div className="preference-info">
                <label>Language</label>
                <p>Select your preferred language</p>
              </div>
              <select
                value={formData.language || 'en'}
                onChange={(e) => setFormData({...formData, language: e.target.value})}
                className="preference-select"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            
            <div className="preference-item">
              <div className="preference-info">
                <label>Timezone</label>
                <p>Set your local timezone</p>
              </div>
              <select
                value={formData.timezone || 'UTC'}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                className="preference-select"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="preferences-actions">
          <Button onClick={handleSave} variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};