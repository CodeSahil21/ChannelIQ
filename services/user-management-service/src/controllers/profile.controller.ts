import { Response } from 'express';
import { CreateUserProfileSchema, UpdateUserProfileSchema, searchUsersSchema } from '../utils/schema';
import { createProfile, updateUserProfile, getUserProfile, deleteUserProfile, restoreUser, searchUsers } from '../services/profile.service';
import { AuthenticatedRequest, CreateUserProfile } from '../utils/types';

export const createProfileController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const validationResult = CreateUserProfileSchema.safeParse(req.body);
        
        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        const profileData = validationResult.data;
        const userId = req.user!.id;

        // Generate random avatar if not provided
        const idx = Math.floor(Math.random() * 100) + 1;
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}`;

        // Create sanitized profile data
        const sanitizedProfileData: CreateUserProfile = {
            fullName: profileData.fullName,
            profilePic:  randomAvatar,
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
        
        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: newProfile
        });
       
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Error creating profile:', error);
        
        if (err.message === "User does not exist") {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        if (err.message === "Profile already completed") {
            res.status(400).json({
                success: false,
                message: "Profile has already been created"
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const updateProfileController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
   try{
    const validationResult = UpdateUserProfileSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
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
            res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
            return;
        }

        const updatedProfile = await updateUserProfile(userId, sanitizedUpdateData);

        res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile
        });

   }catch(error:unknown){
    const err = error as { message?: string };
    console.error('Error creating profile:', error);

            if (err.message === "User does not exist") {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        if (err.message === "Profile not created yet") {
            res.status(400).json({
                success: false,
                message: "Profile not created yet"
            });
            return;
        }
        res.status(500).json({
        success: false,
        message: "Internal server error"
        });
        
   }
}


export const getProfileController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const profile = await getUserProfile(userId);
        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error: unknown) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const fetchUserProfileController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId || "");
        
        // ✅ ADD VALIDATION
        if (isNaN(userId) || userId <= 0) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
            return;
        }

        const profile = await getUserProfile(userId);
        if (!profile) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    }catch (error: unknown) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}   
export const deleteProfileController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        await deleteUserProfile(userId, userId, userAgent, ipAddress as string);
        
        res.status(200).json({
            success: true,
            message: "Profile deleted successfully"
        });
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Error deleting profile:', error);
        if (err.message === "User does not exist") {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        if (err.message === "Profile not created yet") {
            res.status(400).json({
                success: false,
                message: "Profile not created yet"
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const restoreUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId || '0');
        
        if (isNaN(userId) || userId <= 0) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
            return;
        }
        
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        await restoreUser(userId, userAgent, ipAddress as string);
        
        res.status(200).json({ success: true, message: "User restored successfully" });
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Error restoring user:', error);
        res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};

export const searchUsersController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const validationResult = searchUsersSchema.safeParse(req.query);
        
        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        const { query, limit = 10 } = validationResult.data;
        const currentUserId = req.user!.id;
        
        const users = await searchUsers(query, currentUserId, limit);
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error: unknown) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


