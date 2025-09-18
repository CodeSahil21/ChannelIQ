import prisma from '../db/index';
import { 
    CreateUser, 
    CreateUserProfile, 
    UserProfileResponse,
    UpdateUserProfile,
    UserSearchResult,
    ActivityType
} from '../utils/types';
import { UserStatus } from '../utils/prismaTypes';
import { logUserActivity } from './activity.service';
import { createDefaultPreferences } from './preference.service';
import { calculateProfileCompletion, buildSearchVector } from '../utils/profileUtils';

// Create a new user
export const CreateUserService = async ({userId, email}: CreateUser) => {
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
        select: { profileCreated: true }
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
    const profile = await prisma.$transaction(async (tx) => {
        // First update the user with the profile data
        const updatedUser = await tx.user.update({
            where: { id: id },
            data: updatedData
        });
        
        // Then update the search vector using raw SQL
        if (searchText) {
            await tx.$executeRaw`UPDATE "users" SET "searchVector" = to_tsvector('english', ${searchText}) WHERE "id" = ${id}`;
        }
        
        return updatedUser;
    });
    
    // Log the activity
    await logUserActivity(
        id,
        ActivityType.PROFILE_UPDATE,
        'Profile created',
        { fields: Object.keys(profileData) }
    );
    
    return profile as UserProfileResponse;
}

// Get user profile by ID
export const getUserProfile = async (id: number): Promise<UserProfileResponse | null> => {
    const profile = await prisma.user.findFirst({
        where: { id: id, isDeleted: false },
        include: {
            preference: true // Include user preferences
        }
    });
    return profile as unknown as UserProfileResponse;
}

// Check if profile is completed
export const checkProfileCompletion = async (id: number): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: { profileCreated: true }
    });
    
    return user?.profileCreated || false;
}

export const updateUserProfile = async(id:number, data:UpdateUserProfile, userAgent?: string, ipAddress?: string):Promise<UserProfileResponse>=>{
    const user = await prisma.user.findFirst({
        where: { 
            id: id, 
            isDeleted: false 
        },
        select:{
            profileCreated: true
        }
    });
    
    if (!user) {
        throw new Error("User does not exist");
    } else if(!user.profileCreated){
        throw new Error("Profile not created yet");
    }
    
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
        
        return updated;
    });
    
    // Log the activity
    await logUserActivity(
        id,
        ActivityType.PROFILE_UPDATE,
        'Profile updated',
        { fields: Object.keys(data) },
        ipAddress,
        userAgent
    );
    
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
        return users.map(user => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            jobTitle: user.jobTitle,
            department: user.department
        }));
    } catch (error) {
        throw error;
    }
};