import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PageTransition } from '../ui/PageTransition';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type { RootState } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useSelector((state: RootState) => state.theme.theme);

  // Apply theme class to body for consistent theming
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    return () => {
      document.body.className = '';
    };
  }, [theme]);

  return (
    <PageTransition>
      <div className="home-layout">
        <Navbar onMenuClick={() => setSidebarOpen(true)} theme={theme} />
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          theme={theme}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </PageTransition>
  );
};
