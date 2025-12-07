import React, { useState } from 'react';
import { PageTransition } from '../ui/PageTransition';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PageTransition>
      <div className="home-layout">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onNavigate={() => {}}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </PageTransition>
  );
};
