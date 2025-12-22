import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import { getUserPreference, updateUserPreference } from '../services/preference.service';

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