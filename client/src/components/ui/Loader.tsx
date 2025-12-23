import React from 'react';

interface LoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Loader: React.FC<LoaderProps> = ({ text = 'Loading...', size = 'medium' }) => {
  return (
    <div className="theme-loader-container">
      <div className={`theme-loader ${size}`}>
        <div className="theme-loader-spinner"></div>
      </div>
      <p className="theme-loader-text">{text}</p>
    </div>
  );
};