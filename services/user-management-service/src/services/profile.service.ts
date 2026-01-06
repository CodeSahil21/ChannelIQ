import prisma from '../db/index';
import { 
    CreateUser, 
    CreateUserProfile, 
    UserProfileResponse,
    UpdateUserProfile,
    UserSearchResult
} from '../utils/types';
import { getCache, setCache, deleteMultipleCache } from '../utils/cache';
import { UserStatus } from '../utils/prismaTypes';
import { createDefaultPreferences } from './preference.service';
import { eventPublisher } from '../kafka/publisher';

// Create a new user
export const CreateUserService = async ({userId, email}: CreateUser): Promise<{ id: number; email: string; profileCreated: boolean; status: UserStatus; isDeleted: boolean; createdAt: Date; updatedAt: Date }> => {
    // Check if user exists
    const isUserExists = await prisma.user.findUnique({
        where: { email: email }
    });
    if (isUserExists) {
        throw new Error("User already exists");
    }
    
    // Create the user
    const user = await prisma.user.create({
        data: {
            id: userId,
            email: email,
            profileCreated: false,
            status: UserStatus.ACTIVE,
            isDeleted: false
        },
    });
    
    // Create default preferences
    await createDefaultPreferences(user.id);
    
    return user;
}

export const createProfile = async (id: number, profileData: CreateUserProfile): Promise<UserProfileResponse> => {
    const isUserExists = await prisma.user.findUnique({
        where: { id: id, isDeleted: false },
        select: { profileCreated: true, email: true }
    });
    
    if (!isUserExists) {
        throw new Error("User does not exist");
    }
    
    if (isUserExists.profileCreated) {
        throw new Error("Profile already completed");
    }
    
    // Prepare update data
    const updatedData = {
        ...profileData,
        profileCreated: true
    };
    
    try {
        // Single optimized update
        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: updatedData
        });
        
        // Publish profile created event
        try {
            await eventPublisher.publishUserProfileCreated({
                userId: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName || '',
                profilePic: updatedUser.profilePic || ''
            });
        } catch (eventError) {
            console.error('Failed to publish profile created event:', eventError);
        }
        
        // Invalidate caches
        await deleteMultipleCache([
            `user:profile:${id}`, 
            `user:profile:completion:${id}`,
            `search:users:*`
        ]);
        
        return updatedUser as UserProfileResponse;
        
    } catch (error: any) {
        console.error('Error creating user profile:', error);
        throw new Error(`Failed to create profile: ${error.message || 'Unknown error'}`);
    }
}
// Get user profile by ID
export const getUserProfile = async (id: number): Promise<UserProfileResponse | null> => {
    const cacheKey = `user:profile:${id}`;
    
    // Try cache first
    const cached = await getCache<UserProfileResponse>(cacheKey);
    if (cached) {
        return cached;
    }
    
    // Optimized query with only necessary fields
    const profile = await prisma.user.findUnique({
        where: { 
            id: id,
            isDeleted: false,
            status: { not: UserStatus.DELETED }
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
            jobTitle: true,
            department: true,
            phoneNumber: true,
            workEmail: true,
            status: true,
            profileCreated: true,
            profileCompletionPercentage: true,
            skills: true,
            languages: true,
            bio: true,
            location: true,
            timezone: true,
            managerId: true,
            managerName: true,
            linkedinUrl: true,
            githubUrl: true,
            portfolioUrl: true,
            twitterUrl: true,
            isOnline: true,
            lastSeen: true,
            createdAt: true,
            updatedAt: true
        }
    });
    
    if (!profile) {
        return null;
    }
    
    // Store in cache with longer TTL
    await setCache(cacheKey, profile, 3600); // 1 hour
    
    return profile as unknown as UserProfileResponse;
}

// Check if profile is completed
export const checkProfileCompletion = async (id: number): Promise<boolean> => {
    const cacheKey = `user:profile:completion:${id}`;
    
    const cached = await getCache<boolean>(cacheKey);
    if (cached !== null && cached !== undefined) {
        return cached;
    }
    
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: { profileCreated: true }
    });
    
    const result = user?.profileCreated || false;
    await setCache(cacheKey, result, 1800); // 30 minutes
    
    return result;
}

export const updateUserProfile = async(id:number, data:UpdateUserProfile):Promise<UserProfileResponse>=>{
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: { profileCreated: true, isDeleted: true, fullName: true, email: true, profilePic: true }
    });
    
    if (!user || user.isDeleted) {
        throw new Error("User does not exist");
    } else if(!user.profileCreated){
        throw new Error("Profile not created yet");
    }
    
    // Check if fullName is being updated
    const isFullNameUpdated = data.fullName && data.fullName !== user.fullName;
    
    // Update profile with transaction for consistency
    const updatedProfile = await prisma.$transaction(async (tx) => {
        // First update the user with regular data
        const updated = await tx.user.update({
            where: { id: id },
            data: {
                ...data,
                profileCreated: true
            }
        });
        
        // Publish fullName update event if changed
        if (isFullNameUpdated) {
            try {
                await eventPublisher.publishUserFullNameUpdated({
                    userId: id,
                    email: user.email,
                    fullName: data.fullName!,
                    profilePic: updated.profilePic || ''
                });
            } catch (eventError) {
                console.error(`Failed to publish fullName update event for user ${id}:`, eventError);
            }
        }
        
        // Publish general profile update event for other changes
        if (!isFullNameUpdated && Object.keys(data).length > 0) {
            try {
                await eventPublisher.publishUserProfileUpdated({
                    userId: id,
                    email: user.email,
                    fullName: updated.fullName || '',
                    profilePic: updated.profilePic || ''
                });
            } catch (eventError) {
                console.error(`Failed to publish profile update event for user ${id}:`, eventError);
            }
        }
        
        return updated;
    });
    
    // Invalidate caches - profile, search, and connections
    await deleteMultipleCache([
        `user:profile:${id}`, 
        `user:profile:completion:${id}`,
        `search:users:*`, // Profile updates affect search results
        `user:connections:${id}`,
        `user:pending-requests:${id}`,
        `user:sent-requests:${id}`
    ]);
    
    return updatedProfile as UserProfileResponse;
}


export const deleteUserProfile = async (id: number, deletedBy?: number): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        // Soft delete the user
        await tx.user.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy ?? id,
                status: UserStatus.DELETED
            }
        });
    });
    
    // Invalidate caches - profile, search, and connections
    await deleteMultipleCache([
        `user:profile:${id}`, 
        `user:profile:completion:${id}`,
        `search:users:*`,
        `user:connections:${id}`,
        `user:pending-requests:${id}`,
        `user:sent-requests:${id}`
    ]);
};

export const restoreUser = async (id: number): Promise<void> => {
    // Use a transaction to ensure consistency when restoring a user
    await prisma.$transaction(async (tx) => {
        // Restore the user
        await tx.user.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
                status: UserStatus.ACTIVE
            }
        });
    });
    
    // Invalidate caches after restoration
    await deleteMultipleCache([
        `user:profile:${id}`, 
        `user:profile:completion:${id}`,
        `search:users:*`
    ]);
};



// Search users using simple text matching
export const searchUsers = async (
    query: string, 
    currentUserId: number,
    limit: number = 20,
    offset: number = 0
): Promise<UserSearchResult[]> => {
    try {
        if (query.length < 2) {
            return [];
        }
        
        const cacheKey = `search:users:${query}:${currentUserId}:${limit}:${offset}`;
        
        // Try cache first
        const cached = await getCache<UserSearchResult[]>(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Optimized single query with proper WHERE conditions
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                profileCreated: true,
                isDeleted: false,
                status: UserStatus.ACTIVE,
                // Use indexed fields for better performance
                fullName: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                profilePic: true,
                jobTitle: true,
                department: true
            },
            take: limit,
            skip: offset,
            orderBy: { fullName: 'asc' }
        });
        
        const results = users.map(user => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            jobTitle: user.jobTitle,
            department: user.department
        }));
        
        // Store in cache
        await setCache(cacheKey, results, 300); // 5 minutes
        
        return results;
    } catch (error) {
        throw error;
    }
};

export const updateUserProfileImage = async (userId: number, fileName: string | null): Promise<void> => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { profilePic: fileName }
        });
        
        // Invalidate caches - profile, search, and connections
        await deleteMultipleCache([
            `user:profile:${userId}`,
            `user:profile:completion:${userId}`,
            `search:users:*`, // Invalidate all search caches
            `user:connections:${userId}`,
            `user:pending-requests:${userId}`,
            `user:sent-requests:${userId}`,
            `user:blocked:${userId}`
        ]);
        
        console.log(`✅ Profile image ${fileName ? 'updated' : 'removed'} for user ${userId}`);
    } catch (error) {
        console.error(`❌ Failed to update profile image for user ${userId}:`, error);
        throw error;
    }
};

// Bulk user lookup with caching optimization
export const getBulkUserProfiles = async (userIds: number[]): Promise<UserProfileResponse[]> => {
    if (userIds.length === 0) return [];
    
    const results: UserProfileResponse[] = [];
    const uncachedIds: number[] = [];
    
    // Check cache for each user
    for (const userId of userIds) {
        const cacheKey = `user:profile:${userId}`;
        const cached = await getCache<UserProfileResponse>(cacheKey);
        if (cached) {
            results.push(cached);
        } else {
            uncachedIds.push(userId);
        }
    }
    
    // Fetch uncached users in bulk
    if (uncachedIds.length > 0) {
        const profiles = await prisma.user.findMany({
            where: {
                id: { in: uncachedIds },
                isDeleted: false,
                status: { not: UserStatus.DELETED }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                profilePic: true,
                jobTitle: true,
                department: true,
                phoneNumber: true,
                workEmail: true,
                status: true,
                profileCreated: true,
                profileCompletionPercentage: true,
                skills: true,
                languages: true,
                bio: true,
                location: true,
                timezone: true,
                managerId: true,
                managerName: true,
                linkedinUrl: true,
                githubUrl: true,
                portfolioUrl: true,
                twitterUrl: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        // Cache and add to results
        for (const profile of profiles) {
            const cacheKey = `user:profile:${profile.id}`;
            await setCache(cacheKey, profile, 3600); // 1 hour
            results.push(profile as unknown as UserProfileResponse);
        }
    }
    
    // Sort results to match original order
    return userIds.map(id => results.find(profile => profile.id === id)).filter(Boolean) as UserProfileResponse[];
};