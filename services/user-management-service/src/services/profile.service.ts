import prisma from '../db/index';
import { 
    CreateUser, 
    CreateUserProfile, 
    UserProfileResponse,
    UpdateUserProfile,
    UserSearchResult,
    ActivityType
} from '../utils/types';
import { getCache, setCache, deleteMultipleCache } from '../utils/cache';
import { UserStatus } from '../utils/prismaTypes';
import { logUserActivity } from './activity.service';
import { createDefaultPreferences } from './preference.service';
import { calculateProfileCompletion, buildSearchVector } from '../utils/profileUtils';
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
    
    // Log user creation
    await logUserActivity(
        user.id,
        ActivityType.PROFILE_UPDATE,
        'User account created',
        { email: user.email }
    );
    
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
    
    // Check if profile is already completed
    if (isUserExists.profileCreated) {
        throw new Error("Profile already completed");
    }
    
    // Calculate profile completion percentage
    const completion = calculateProfileCompletion(profileData);
    
    // Create search vector for full-text search - using raw SQL
    const updatedData = {
        ...profileData,
        profileCreated: true,
        profileCompletionPercentage: completion
    };
    
    // Use raw SQL to handle tsvector since Prisma doesn't support it directly
    const searchText = buildSearchVector(profileData);
    
    try {
        // Use a transaction for atomicity - all operations succeed or fail together
        const updatedUser = await prisma.$transaction(async (tx) => {
            // First update the user with the profile data
            const user = await tx.user.update({
                where: { id: id },
                data: updatedData
            });
            
            // Then update the search vector using raw SQL
            if (searchText) {
                await tx.$executeRaw`UPDATE "users" SET "searchVector" = to_tsvector('english', ${searchText}) WHERE "id" = ${id}`;
            }
            
            // Publish event within the transaction - if this fails, transaction rolls back
            try {
                await eventPublisher.publishUserProfileCreated({
                    userId: user.id,
                    email: user.email,
                    fullName: user.fullName || '',
                    profilePic: user.profilePic || ''
                });
                
                console.log(`Published USER_PROFILE_CREATED event for user ${user.id}`);
            } catch (eventError) {
                console.error(`❌ Failed to publish profile event for user ${id}:`, eventError);
                // Just throw - transaction will automatically roll back profile update
                throw new Error("Failed to publish profile event. Please try again later.");
            }
            
            return user;
        });
        
        // Log the activity after transaction completes
        await logUserActivity(
            id,
            ActivityType.PROFILE_UPDATE,
            'Profile created',
            { fields: Object.keys(profileData) }
        );
        
        // Invalidate caches - profile, search, and connections
        await deleteMultipleCache([
            `user:profile:${id}`, 
            `user:profile:completion:${id}`,
            `search:users:*`, // Profile updates affect search results
            `user:connections:${id}`,
            `user:pending-requests:${id}`,
            `user:sent-requests:${id}`
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
    
    // Cache miss - fetch from DB using findUnique (index lookup) without preference
    const profile = await prisma.user.findUnique({
        where: { id: id }
    });
    
    // Check if deleted
    if (!profile || profile.isDeleted) {
        return null;
    }
    
    // Store in cache
    await setCache(cacheKey, profile, 1800); // 30 minutes
    
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
        select: { profileCreated: true, isDeleted: true, fullName: true }
    });
    
    if (!user || user.isDeleted) {
        throw new Error("User does not exist");
    } else if(!user.profileCreated){
        throw new Error("Profile not created yet");
    }
    
    // Check if fullName is being updated
    const isFullNameUpdated = data.fullName && data.fullName !== user.fullName;
    
    // Calculate profile completion percentage
    const completion = calculateProfileCompletion({...data});
    
    // Build search vector text
    const searchText = buildSearchVector(data);
    
    // Update profile with transaction to handle the search vector
    const updatedProfile = await prisma.$transaction(async (tx) => {
        // First update the user with regular data
        const updated = await tx.user.update({
            where: { id: id },
            data: {
                ...data,
                profileCreated: true,
                profileCompletionPercentage: completion
            }
        });
        
        // Then update the search vector using raw SQL
        if (searchText) {
            await tx.$executeRaw`UPDATE "users" SET "searchVector" = to_tsvector('english', ${searchText}) WHERE "id" = ${id}`;
        }
        
        // Publish fullName update event if changed
        if (isFullNameUpdated) {
            try {
                await eventPublisher.publishUserFullNameUpdated({
                    userId: id,
                    fullName: data.fullName!
                });
            } catch (eventError) {
                console.error(`Failed to publish fullName update event for user ${id}:`, eventError);
                throw new Error("Failed to publish fullName update event. Please try again later.");
            }
        }
        
        return updated;
    });
    
    // Log the activity
    await logUserActivity(
        id,
        ActivityType.PROFILE_UPDATE,
        'Profile updated',
        { fields: Object.keys(data) }
    );
    
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


export const deleteUserProfile = async (id: number, deletedBy?: number, userAgent?: string, ipAddress?: string): Promise<void> => {
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
        
        // Also soft delete user preferences
        await tx.userPreference.updateMany({
            where: { userId: id },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        });
        
        // Publish profile deletion event
        try {
            await eventPublisher.publishUserProfileDeleted({ userId: id });
        } catch (eventError) {
            console.error(`Failed to publish profile deletion event for user ${id}:`, eventError);
            throw new Error("Failed to publish profile deletion event. Please try again later.");
        }
    });
    
    // Log the activity
    await logUserActivity(
        deletedBy ?? id,
        ActivityType.ACCOUNT_DEACTIVATION,
        'User account deactivated',
        { userId: id },
        ipAddress,
        userAgent
    );
    
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

export const restoreUser = async (id: number, userAgent?: string, ipAddress?: string): Promise<void> => {
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
        
        // Also restore user preferences if they were soft deleted
        await tx.userPreference.updateMany({
            where: { 
                userId: id,
                isDeleted: true 
            },
            data: {
                isDeleted: false,
                deletedAt: null
            }
        });
    });
    
    // Log the activity
    await logUserActivity(
        id,
        ActivityType.ACCOUNT_DEACTIVATION, // Using existing type since ACCOUNT_REACTIVATION doesn't exist
        'User account reactivated',
        { userId: id },
        ipAddress,
        userAgent
    );
};



// Search users using searchVector (full-text search)
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
        
        const cacheKey = `search:users:${query}:${currentUserId}`;
        
        // Try cache first
        const cached = await getCache<UserSearchResult[]>(cacheKey);
        if (cached) {
            return cached;
        }
        
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    { profileCreated: true },
                    { isDeleted: false },
                    // Using a different approach for the full-text search
                    // since Prisma doesn't support tsvector directly in the query builder
                    {
                        OR: [
                            { fullName: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                            { jobTitle: { contains: query, mode: 'insensitive' } },
                            { department: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                ]
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
        
        // Log the activity
        await logUserActivity(
            userId,
            ActivityType.PROFILE_UPDATE,
            fileName ? 'Profile image updated' : 'Profile image removed',
            { fileName }
        );
        
        // Invalidate caches - profile, search, and connections
        await deleteMultipleCache([
            `user:profile:${userId}`,
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