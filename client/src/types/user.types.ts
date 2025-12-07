export interface UserProfileResponse {
  id: number;
  fullName: string | null;
  email: string;
  profilePic: string | null;
  jobTitle: string | null;
  department: string | null;
  phoneNumber: string | null;
  workEmail: string | null;
  profileCreated: boolean;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  skills: string[];
  languages: string[];
  managerId: number | null;
  managerName: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  twitterUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileRequest {
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

export type UpdateProfileRequest = Partial<CreateProfileRequest>;

export interface UserPreferenceResponse {
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

export type UpdatePreferencesRequest = Partial<Omit<UserPreferenceResponse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface UserSearchResult {
  id: number;
  fullName: string | null;
  email: string;
  profilePic: string | null;
  jobTitle: string | null;
  department: string | null;
}
