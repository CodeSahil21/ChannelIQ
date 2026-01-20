import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import { getGroupMessages } from '../services/message.service';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

const getMessagesSchema = z.object({
  params: z.object({
    groupId: z.string().uuid('Invalid group ID')
  }),
  query: z.object({
    limit: z.string().optional().default('50').transform(val => parseInt(val, 10)),
    cursor: z.string().uuid().optional()
  })
});

export const getMessagesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validationResult = getMessagesSchema.safeParse({
      params: req.params,
      query: req.query
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const { limit, cursor } = validationResult.data.query;

    const messages = await getGroupMessages(groupId, userId, limit, cursor);

    const responseData = {
      messages,
      pagination: {
        hasMore: messages.length === limit,
        cursor: messages.length > 0 ? messages[messages.length - 1]?.id : null
      }
    };

    const response = new ApiResponse(200, responseData, 'Messages retrieved successfully');
    res.status(response.statusCode).json(response);

  } catch (error: any) {
    if (error.message === 'Not authorized to view messages') {
      return next(new ApiError(403, error.message));
    }
    next(error);
  }
};