

const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME || 'profile-images';

export const getPublicImageUrl = (fileName: string): string | null => {
  if (!fileName) return null;
  
  // Skip external URLs - return them as-is
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  
  // Return direct MinIO public URL
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${fileName}`;
};

export const processProfileImages = (profiles: any[]): any[] => {
  return profiles.map((profile) => {
    if (profile.profilePic) {
      const publicUrl = getPublicImageUrl(profile.profilePic);
      return { ...profile, profilePic: publicUrl };
    }
    return profile;
  });
};

export const processSingleProfileImage = (profile: any): any => {
  if (profile && profile.profilePic) {
    const publicUrl = getPublicImageUrl(profile.profilePic);
    return { ...profile, profilePic: publicUrl };
  }
  return profile;
};