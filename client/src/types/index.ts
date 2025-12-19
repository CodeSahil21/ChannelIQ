export interface User {
  id: number;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends AuthFormData {}

export interface LoginFormData extends AuthFormData {}

export interface ForgotPasswordFormData {
  email: string;
}

export interface VerifyOtpFormData {
  email: string;
  otp: string;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export * from './user.types';
export * from './connection.types';
export * from './group.types';

// Additional types for profile operations
export interface CreateProfileFormData {
  fullName: string;
  profilePic?: string;
  jobTitle?: string;
  department?: string;
  phoneNumber?: string;
  workEmail?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  skills?: string[];
  languages?: string[];
  managerId?: number;
  managerName?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  twitterUrl?: string;
}

export interface UserPreference {
  id: number;
  userId: number;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  connectionRequests?: boolean;
  profileViews?: boolean;
  profileVisibility?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
  theme?: string;
  language?: string;
  timezone?: string;
  appearInSearch?: boolean;
  showSuggestions?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesData {
  theme?: string;
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  connectionRequests?: boolean;
  profileViews?: boolean;
  profileVisibility?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
  appearInSearch?: boolean;
  showSuggestions?: boolean;
}