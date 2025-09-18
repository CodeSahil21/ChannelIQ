import { ConnectionStatus, UserStatus, ActivityType } from '@prisma/client';

export * from '@prisma/client';

// Export the existing types with the new ones
export { ConnectionStatus, UserStatus, ActivityType };

// Preference visibility type for user profiles
export enum PreferenceVisibilityType {
    PUBLIC = 'PUBLIC',
    CONNECTIONS_ONLY = 'CONNECTIONS_ONLY',
    PRIVATE = 'PRIVATE'
}

export interface UserPreferenceUpdate {
    // Notification preferences
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    connectionRequests?: boolean;
    profileViews?: boolean;
    
    // Privacy settings
    profileVisibility?: PreferenceVisibilityType;
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
    
    // Display preferences
    theme?: string;
    language?: string;
    timezone?: string;
    
    // Search and discovery
    appearInSearch?: boolean;
    showSuggestions?: boolean;
}