import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="loader-spinner"></div>
      </div>
      <p className="loader-text">Loading...</p>
    </div>
  );
};