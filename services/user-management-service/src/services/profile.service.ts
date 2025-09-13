import prisma from '../db/index'
import { 
    CreateUser, 
    CreateUserProfile, 
    UserProfileResponse,
    UpdateUserProfile,
    UserSearchResult,
} from '../utils/types';


// Create a new user
export const CreateUserService = async ({userId, email}: CreateUser) => {
    // Check if user exists
    const isUserExists = await prisma.user.findUnique({
        where: { email: email }
    });

    if (isUserExists) {
        throw new Error("User already exists");
    }
    
    const user = await prisma.user.create({
        data: {
            id: userId,
            email: email,
            profileCreated: false, // Initially false
        },
    });
    return user;
}

export const createProfile = async (id: number, profileData: CreateUserProfile): Promise<UserProfileResponse> => {
    const isUserExists = await prisma.user.findUnique({
        where: { id: id },
        select: { profileCreated: true}
    });

    if (!isUserExists) {
        throw new Error("User does not exist");
    }

    // Check if profile is already completed
    if (isUserExists.profileCreated) {
        throw new Error("Profile already completed");
    }

    const profile = await prisma.user.update({
        where: { id: id },
        data: {
            ...profileData,
            profileCreated: true, // Mark as completed
        },
    });
    
    return profile as UserProfileResponse;
}

// Get user profile by ID
export const getUserProfile = async (id: number): Promise<UserProfileResponse | null> => {
    const profile = await prisma.user.findUnique({
        where: { id: id }
    });
    
    return profile as UserProfileResponse;
}

// Check if profile is completed
export const checkProfileCompletion = async (id: number): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: { profileCreated: true }
    });
    
    return user?.profileCreated || false;
}

export const updateUserProfile = async(id:number,data:UpdateUserProfile):Promise<UserProfileResponse>=>{
    const user = await prisma.user.findUnique({
        where: { id: id },
        select:{
            profileCreated:true
        }
    });

    if (!user) {
        throw new Error("User does not exist");
    }else if(!user.profileCreated){
        throw new Error("Profile not created yet");
    }

    const updatedProfile = await prisma.user.update({
        where: { id: id },
        data: {
            ...data,
            profileCreated: true 
        }
    });

    return updatedProfile as UserProfileResponse;
}

export const deleteUserProfile = async (id: number): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: { profileCreated: true }
    });

    if (!user) {
        throw new Error("User does not exist");
    } else if (!user.profileCreated) {
        throw new Error("Profile not created yet");
    }

    await prisma.user.delete({
        where: { id: id }
    });
}


// Search users by name or email
// ✅ REPLACE THE EXISTING searchUsers FUNCTION
export const searchUsers = async (
    query: string, 
    currentUserId: number,
    limit: number = 20,
    offset: number = 0
): Promise<UserSearchResult[]> => {
    try {
        // ✅ ADD QUERY LENGTH VALIDATION
        if (query.length < 2) {
            return []; // Don't search for very short queries
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } }, // Exclude current user
                    { profileCreated: true }, // Only show users with completed profiles
                    {
                        OR: [
                            { fullName: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
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