import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPreferences } from '../store/themeSlice';
import axios from 'axios';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme.theme);
    
    // Load user preferences
    loadUserPreferences();
  }, []);

  useEffect(() => {
    // Update theme when it changes
    document.documentElement.setAttribute('data-theme', theme.theme);
  }, [theme.theme]);

  const loadUserPreferences = async () => {
    try {
      const response = await axios.get(
        'http://localhost:4000/api/users/preferences',
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const prefs = response.data.data;
        const normalizedPrefs = {
          ...prefs,
          theme: prefs.theme?.toLowerCase() as 'light' | 'dark'
        };
        dispatch(setPreferences(normalizedPrefs));
      }
    } catch (err) {
      // Silently fail - use default preferences
    }
  };

  return <>{children}</>;
};