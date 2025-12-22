import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import { getGroupMessages } from '../services/message.service';
import { z } from 'zod';

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
  res: Response
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

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      });
      return;
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const { limit, cursor } = validationResult.data.query;

    const messages = await getGroupMessages(groupId, userId, limit, cursor);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        hasMore: messages.length === limit,
        cursor: messages.length > 0 ? messages[messages.length - 1]?.id : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);

    if (error.message === 'Not authorized to view messages') {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};