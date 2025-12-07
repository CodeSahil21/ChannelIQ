import prisma from '../db/index';


/**
 * Get user preferences
 * @param userId The ID of the user whose preferences to retrieve
 * @throws Error if the user does not exist
 * @returns The user's preferences or null if not found
 */
export const getUserPreference = async (userId: number): Promise<unknown | null> => {
    // Check if user exists first
    const userExists = await prisma.user.findFirst({
        where: { 
            id: userId,
            isDeleted: false 
        },
        select: { id: true }
    });

    if (!userExists) {
        throw new Error('User not found');
    }
    
    try {
        return await prisma.userPreference.findUnique({
            where: { 
                userId,
                isDeleted: false
            }
        });
    } catch (error) {
        console.error(`Error fetching preferences for user ${userId}:`, error);
        throw new Error('Failed to retrieve user preferences');
    }
};

/**
 * Update user preferences
 * @param userId The ID of the user whose preferences to update
 * @param data The preference data to update
 * @throws Error if user does not exist, preferences don't exist, or invalid data
 * @returns Updated preference object
 */
export const updateUserPreference = async (userId: number, data: Record<string, unknown>): Promise<unknown> => {
    // Validate user exists
    const userExists = await prisma.user.findFirst({
        where: { 
            id: userId,
            isDeleted: false 
        },
        select: { id: true }
    });

    if (!userExists) {
        throw new Error('User not found');
    }

    // Check if preferences exist for this user
    const preferencesExist = await prisma.userPreference.findUnique({
        where: { 
            userId,
            isDeleted: false
        },
        select: { userId: true }
    });

    if (!preferencesExist) {
        throw new Error('User preferences not found. Please create preferences first.');
    }

    // Ensure we're only updating valid preference fields with proper validation
    const validData: Record<string, unknown> = {};
    
    try {
        // Notification preferences - validate booleans
        if (data.emailNotifications !== undefined) {
            if (typeof data.emailNotifications !== 'boolean') {
                throw new Error('emailNotifications must be a boolean value');
            }
            validData.emailNotifications = data.emailNotifications;
        }
        
        if (data.pushNotifications !== undefined) {
            if (typeof data.pushNotifications !== 'boolean') {
                throw new Error('pushNotifications must be a boolean value');
            }
            validData.pushNotifications = data.pushNotifications;
        }
        
        if (data.connectionRequests !== undefined) {
            if (typeof data.connectionRequests !== 'boolean') {
                throw new Error('connectionRequests must be a boolean value');
            }
            validData.connectionRequests = data.connectionRequests;
        }
        
        if (data.profileViews !== undefined) {
            if (typeof data.profileViews !== 'boolean') {
                throw new Error('profileViews must be a boolean value');
            }
            validData.profileViews = data.profileViews;
        }
        
        // Privacy settings
        if (data.profileVisibility !== undefined && data.profileVisibility !== null) {
            if (typeof data.profileVisibility !== 'string' || !['PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE'].includes(data.profileVisibility)) {
                throw new Error('profileVisibility must be one of: PUBLIC, CONNECTIONS_ONLY, PRIVATE');
            }
            validData.profileVisibility = data.profileVisibility;
        }
        
        if (data.showOnlineStatus !== undefined) {
            if (typeof data.showOnlineStatus !== 'boolean') {
                throw new Error('showOnlineStatus must be a boolean value');
            }
            validData.showOnlineStatus = data.showOnlineStatus;
        }
        
        if (data.showLastSeen !== undefined) {
            if (typeof data.showLastSeen !== 'boolean') {
                throw new Error('showLastSeen must be a boolean value');
            }
            validData.showLastSeen = data.showLastSeen;
        }
        
        // Display preferences
        if (data.theme !== undefined && data.theme !== null) {
            if (typeof data.theme !== 'string' || !['LIGHT', 'DARK', 'SYSTEM'].includes(data.theme)) {
                throw new Error('theme must be one of: LIGHT, DARK, SYSTEM');
            }
            validData.theme = data.theme;
        }
        
        if (data.language !== undefined) {
            // Simple validation for language codes (could be more sophisticated)
            if (typeof data.language !== 'string' || data.language.length < 2) {
                throw new Error('language must be a valid language code');
            }
            validData.language = data.language;
        }
        
        if (data.timezone !== undefined) {
            if (typeof data.timezone !== 'string') {
                throw new Error('timezone must be a string');
            }
            validData.timezone = data.timezone;
        }
        
        // Search and discovery
        if (data.appearInSearch !== undefined) {
            if (typeof data.appearInSearch !== 'boolean') {
                throw new Error('appearInSearch must be a boolean value');
            }
            validData.appearInSearch = data.appearInSearch;
        }
        
        if (data.showSuggestions !== undefined) {
            if (typeof data.showSuggestions !== 'boolean') {
                throw new Error('showSuggestions must be a boolean value');
            }
            validData.showSuggestions = data.showSuggestions;
        }

        // If no valid fields to update
        if (Object.keys(validData).length === 0) {
            throw new Error('No valid preference fields provided for update');
        }

        return await prisma.userPreference.update({
            where: { userId },
            data: validData
        });
    } catch (error: any) {
        if (error.message.includes('must be')) {
            // Rethrow validation errors
            throw error;
        } else {
            console.error(`Error updating preferences for user ${userId}:`, error);
            throw new Error('Failed to update user preferences');
        }
    }
};

/**
 * Create default preferences for a user
 * Should be called when a new user is created
 * @param userId The ID of the user to create preferences for
 * @throws Error if user does not exist or if creating preferences fails
 * @returns The created preference object
 */
export const createDefaultPreferences = async (userId: number): Promise<unknown> => {
    try {
        // Check if user exists
        const userExists = await prisma.user.findFirst({
            where: { 
                id: userId,
                isDeleted: false 
            },
            select: { id: true }
        });

        if (!userExists) {
            throw new Error('Cannot create preferences for non-existent user');
        }
        
        // Check for existing preferences
        const existingPrefs = await prisma.userPreference.findUnique({
            where: { userId }
        });

        if (existingPrefs) {
            if (existingPrefs.isDeleted) {
                // If preferences were soft-deleted, restore them
                return await prisma.userPreference.update({
                    where: { userId },
                    data: { isDeleted: false, deletedAt: null }
                });
            }
            return existingPrefs;
        }

        // Create new preferences with explicit defaults
        return await prisma.userPreference.create({
            data: {
                userId,
                emailNotifications: true,
                pushNotifications: true,
                connectionRequests: true,
                profileViews: true,
                profileVisibility: 'PUBLIC',
                showOnlineStatus: true,
                showLastSeen: true,
                theme: 'LIGHT',
                language: 'en',
                timezone: 'UTC',
                appearInSearch: true,
                showSuggestions: true
            }
        });
    } catch (error: any) {
        console.error(`Error creating default preferences for user ${userId}:`, error);
        if (error.message.includes('Cannot create preferences')) {
            throw error;
        } else {
            throw new Error('Failed to create default preferences');
        }
    }
};

/**
 * Soft delete user preferences
 * @param userId The ID of the user whose preferences to delete
 * @throws Error if preferences don't exist or deletion fails
 * @returns The updated preference object
 */
export const softDeletePreference = async (userId: number): Promise<unknown> => {
    try {
        // Check if preferences exist
        const preferencesExist = await prisma.userPreference.findFirst({
            where: { 
                userId,
                isDeleted: false
            },
            select: { userId: true }
        });

        if (!preferencesExist) {
            throw new Error('User preferences not found or already deleted');
        }

        return await prisma.userPreference.update({
            where: { userId },
            data: {
                isDeleted: true,
                deletedAt: new Date()
                // Note: deletedBy field may not exist in the schema for UserPreference
                // If you want to track who deleted it, add this field to the schema
            }
        });
    } catch (error: any) {
        console.error(`Error soft-deleting preferences for user ${userId}:`, error);
        if (error.message.includes('not found')) {
            throw error;
        } else {
            throw new Error('Failed to delete user preferences');
        }
    }
};