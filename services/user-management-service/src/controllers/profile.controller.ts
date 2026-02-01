import { Response, NextFunction } from 'express';
import { CreateUserProfileSchema, UpdateUserProfileSchema, searchUsersSchema } from '../utils/schema';
import { createProfile, updateUserProfile, getUserProfile, deleteUserProfile, restoreUser, searchUsers } from '../services/profile.service';
import { processSingleProfileImage, processProfileImages } from '../services/image.service';
import { AuthenticatedRequest, CreateUserProfile } from '../utils/types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export const createProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = CreateUserProfileSchema.safeParse(req.body);
        
        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const profileData = validationResult.data;
        const userId = req.user!.id;

        // Create sanitized profile data
        const sanitizedProfileData: CreateUserProfile = {
            fullName: profileData.fullName,
            timezone: profileData.timezone || "UTC",
            skills: profileData.skills || [],
            languages: profileData.languages || [],
        };

        // Add optional fields only if they exist
        if (profileData.jobTitle) sanitizedProfileData.jobTitle = profileData.jobTitle;
        if (profileData.department) sanitizedProfileData.department = profileData.department;
        if (profileData.phoneNumber) sanitizedProfileData.phoneNumber = profileData.phoneNumber;
        if (profileData.workEmail) sanitizedProfileData.workEmail = profileData.workEmail;
        if (profileData.bio) sanitizedProfileData.bio = profileData.bio;
        if (profileData.location) sanitizedProfileData.location = profileData.location;
        if (profileData.managerId) sanitizedProfileData.managerId = profileData.managerId;
        if (profileData.managerName) sanitizedProfileData.managerName = profileData.managerName;
        if (profileData.linkedinUrl) sanitizedProfileData.linkedinUrl = profileData.linkedinUrl;
        if (profileData.githubUrl) sanitizedProfileData.githubUrl = profileData.githubUrl;
        if (profileData.portfolioUrl) sanitizedProfileData.portfolioUrl = profileData.portfolioUrl;
        if (profileData.twitterUrl) sanitizedProfileData.twitterUrl = profileData.twitterUrl;
      
        const newProfile = await createProfile(userId, sanitizedProfileData);
        
        const response = new ApiResponse(201, newProfile, "Profile created successfully");
        res.status(response.statusCode).json(response);
       
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message === "User does not exist") {
            return next(new ApiError(404, "User not found"));
        }

        if (err.message === "Profile already completed") {
            return next(new ApiError(400, "Profile has already been created"));
        }

        next(error);
    }
}

export const updateProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
   try{
    const validationResult = UpdateUserProfileSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }
     
        const profileData = validationResult.data;
        const userId = req.user!.id;
        
        // Create sanitized update data - everything is optional
        const sanitizedUpdateData: Partial<CreateUserProfile> = {};

        // Only add fields that are present in the request
        if (profileData.fullName !== undefined) sanitizedUpdateData.fullName = profileData.fullName;
        if (profileData.profilePic !== undefined) sanitizedUpdateData.profilePic = profileData.profilePic;
        if (profileData.jobTitle !== undefined) sanitizedUpdateData.jobTitle = profileData.jobTitle;
        if (profileData.department !== undefined) sanitizedUpdateData.department = profileData.department;
        if (profileData.phoneNumber !== undefined) sanitizedUpdateData.phoneNumber = profileData.phoneNumber;
        if (profileData.workEmail !== undefined) sanitizedUpdateData.workEmail = profileData.workEmail;
        if (profileData.bio !== undefined) sanitizedUpdateData.bio = profileData.bio;
        if (profileData.location !== undefined) sanitizedUpdateData.location = profileData.location;
        if (profileData.timezone !== undefined) sanitizedUpdateData.timezone = profileData.timezone;
        if (profileData.skills !== undefined) sanitizedUpdateData.skills = profileData.skills;
        if (profileData.languages !== undefined) sanitizedUpdateData.languages = profileData.languages;
        if (profileData.managerId !== undefined) sanitizedUpdateData.managerId = profileData.managerId;
        if (profileData.managerName !== undefined) sanitizedUpdateData.managerName = profileData.managerName;
        if (profileData.linkedinUrl !== undefined) sanitizedUpdateData.linkedinUrl = profileData.linkedinUrl;
        if (profileData.githubUrl !== undefined) sanitizedUpdateData.githubUrl = profileData.githubUrl;
        if (profileData.portfolioUrl !== undefined) sanitizedUpdateData.portfolioUrl = profileData.portfolioUrl;
        if (profileData.twitterUrl !== undefined) sanitizedUpdateData.twitterUrl = profileData.twitterUrl;

        // Check if there's actually data to update
        if (Object.keys(sanitizedUpdateData).length === 0) {
            throw new ApiError(400, "No valid fields provided for update");
        }

        const updatedProfile = await updateUserProfile(userId, sanitizedUpdateData);

        const response = new ApiResponse(200, updatedProfile, "Profile updated successfully");
        res.status(response.statusCode).json(response);

   }catch(error:unknown){
    const err = error as { message?: string };

        if (err.message === "User does not exist") {
            return next(new ApiError(404, "User not found"));
        }

        if (err.message === "Profile not created yet") {
            return next(new ApiError(400, "Profile not created yet"));
        }
        
        next(error);
   }
}


export const getProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.id;
        const profile = await getUserProfile(userId);
        const processedProfile = processSingleProfileImage(profile);
        
        const response = new ApiResponse(200, processedProfile, "Profile retrieved successfully");
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
}

export const fetchUserProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId as string || "");
        
        if (isNaN(userId) || userId <= 0) {
            throw new ApiError(400, "Invalid user ID");
        }

        const profile = await getUserProfile(userId);
        if (!profile) {
            throw new ApiError(404, "User not found");
        }

        const processedProfile = processSingleProfileImage(profile);
        const response = new ApiResponse(200, processedProfile, "Profile retrieved successfully");
        res.status(response.statusCode).json(response);
    }catch (error: unknown) {
        next(error);
    }
}   
export const deleteProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.id;
        
        await deleteUserProfile(userId, userId);
        
        const response = new ApiResponse(200, null, "Profile deleted successfully");
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message === "User does not exist") {
            return next(new ApiError(404, "User not found"));
        }
        if (err.message === "Profile not created yet") {
            return next(new ApiError(400, "Profile not created yet"));
        }
        
        next(error);
    }
}

export const restoreUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId as string || '0');
        
        if (isNaN(userId) || userId <= 0) {
            throw new ApiError(400, "Invalid user ID");
        }
        
        await restoreUser(userId);
        
        const response = new ApiResponse(200, null, "User restored successfully");
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

export const searchUsersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = searchUsersSchema.safeParse(req.query);
        
        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const { query, limit = 10 } = validationResult.data;
        const currentUserId = req.user!.id;
        
        const users = await searchUsers(query, currentUserId, limit);
        const processedUsers = processProfileImages(users);
        
        const response = new ApiResponse(200, processedUsers, "Users retrieved successfully");
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};


