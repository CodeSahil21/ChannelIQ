import React, { useEffect, memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPreferences } from '../store/themeSlice';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = memo(({ children }) => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const loadUserPreferences = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/users/preferences`,
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
  }, [dispatch]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme.theme);
  }, []);

  useEffect(() => {
    // Only load preferences if user is authenticated
    if (user) {
      loadUserPreferences();
    }
  }, [user, loadUserPreferences]);

  useEffect(() => {
    // Update theme when it changes
    document.documentElement.setAttribute('data-theme', theme.theme);
  }, [theme.theme]);

  return <>{children}</>;
});

ThemeProvider.displayName = 'ThemeProvider';