import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import { getUserPreference, updateUserPreference } from '../services/preference.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export const getUserPreferenceController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.id;
        const preferences = await getUserPreference(userId);

        if (!preferences) {
            throw new ApiError(404, "User preferences not found");
        }

        const response = new ApiResponse(200, preferences, "Preferences retrieved successfully");
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

export const updateUserPreferenceController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.id;
        const updatedPreferences = await updateUserPreference(userId, req.body);

        const response = new ApiResponse(200, updatedPreferences, "Preferences updated successfully");
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};