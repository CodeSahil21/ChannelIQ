import React, { useState, useEffect } from 'react';

interface DirectImageProps {
  fileName: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const DirectImage: React.FC<DirectImageProps> = ({ 
  fileName, 
  alt, 
  className, 
  fallback 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileName) {
      setImageUrl(null);
      return;
    }

    // If fileName is already a full URL, use it directly
    if (fileName.startsWith('http')) {
      setImageUrl(fileName);
      return;
    }

    // For MinIO public access, construct direct URL
    const publicUrl = `http://localhost:9000/profile-images/${fileName}`;
    setImageUrl(publicUrl);
  }, [fileName]);

  if (!fileName || error) {
    return <>{fallback}</>;
  }

  if (!imageUrl) {
    return <>{fallback}</>;
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
};

// Keep old export for backward compatibility
export const PresignedImage = DirectImage;