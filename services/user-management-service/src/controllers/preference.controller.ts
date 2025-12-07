import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import { getUserPreference, updateUserPreference } from '../services/preference.service';
import { logUserActivity } from '../services/activity.service';
import { ActivityType } from '../utils/prismaTypes';

export const getUserPreferenceController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const preferences = await getUserPreference(userId);

        if (!preferences) {
            res.status(404).json({
                success: false,
                message: "User preferences not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: preferences
        });
    } catch (error: unknown) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateUserPreferenceController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const updatedPreferences = await updateUserPreference(userId, req.body);

        // Log the activity
        await logUserActivity(
            userId,
            ActivityType.PROFILE_UPDATE,
            'User updated preferences',
            { fields: Object.keys(req.body) },
            req.ip || undefined,
            req.headers['user-agent'] || undefined
        );

        res.status(200).json({
            success: true,
            message: "Preferences updated successfully",
            data: updatedPreferences
        });
    } catch (error: unknown) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};