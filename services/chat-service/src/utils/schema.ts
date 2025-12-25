import { z } from 'zod';
import { GroupRole } from '@prisma/client';

// Helper schemas
const positiveIntSchema = z.string()
  .regex(/^\d+$/, 'Must be a valid number')
  .transform(Number)
  .refine(val => val > 0, 'Must be a positive number');

const uuidSchema = z.string().uuid('Invalid UUID format');

// 1. Create Group Schema
export const createGroupSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Group name is required')
      .max(100, 'Group name must be 100 characters or less')
      .trim(),
    description: z.string()
      .max(500, 'Description must be 500 characters or less')
      .optional(),
    isPrivate: z.boolean().default(false),
    imageUrl: z.string().url('Invalid image URL').optional(),
    maxMembers: z.number()
      .int()
      .min(2, 'Group must allow at least 2 members')
      .max(1000, 'Maximum 1000 members allowed')
      .default(256),
  }),
});

// 2. Get Group By ID Schema
export const getGroupByIdSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
});

// 3. Get My Groups Schema
export const getMyGroupsSchema = z.object({
  query: z.object({}).optional(),
});

// 4. Search Groups Schema
export const searchGroupsSchema = z.object({
  query: z.object({
    search: z.string()
      .min(2, 'Search term must be at least 2 characters')
      .max(100, 'Search term must be 100 characters or less'),
    page: z.string()
      .optional()
      .default('1')
      .transform(val => parseInt(val, 10))
      .refine(val => val > 0, 'Page must be positive'),
    limit: z.string()
      .optional()
      .default('20')
      .transform(val => parseInt(val, 10))
      .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

// 5. Get Group Members Schema
export const getGroupMembersSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
});

// 6. Invite User Schema
export const inviteUserSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
  body: z.object({
    targetUserId: z.number()
      .int()
      .positive('Target user ID must be positive'),
    message: z.string()
      .max(200, 'Message must be 200 characters or less')
      .optional(),
  }),
});

// 7. Join Group Schema
export const joinGroupSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
  body: z.object({
    message: z.string()
      .max(200, 'Message must be 200 characters or less')
      .optional(),
  }),
});

// 8. Get Pending Requests Schema
export const getPendingRequestsSchema = z.object({
  query: z.object({}).optional(),
});

// 9. Respond To Request Schema
export const respondToRequestSchema = z.object({
  params: z.object({
    requestId: uuidSchema,
  }),
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED'], {
      message: 'Status must be ACCEPTED or REJECTED',
    }),
  }),
});

// 10. Update Group Schema
export const updateGroupSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
  body: z.object({
    name: z.string()
      .min(1, 'Group name cannot be empty')
      .max(100, 'Group name must be 100 characters or less')
      .trim()
      .optional(),
    description: z.string()
      .max(500, 'Description must be 500 characters or less')
      .optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    isPrivate: z.boolean().optional(),
    maxMembers: z.number()
      .int()
      .min(2, 'Group must allow at least 2 members')
      .max(1000, 'Maximum 1000 members allowed')
      .optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// 11. Remove Member Schema
export const removeMemberSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
    userId: positiveIntSchema,
  }),
});

// 12. Delete Group Schema
export const deleteGroupSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
});

// 13. Update Member Role Schema
export const updateMemberRoleSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
    userId: positiveIntSchema,
  }),
  body: z.object({
    role: z.nativeEnum(GroupRole, {
      message: 'Invalid role. Must be ADMIN, CO_ADMIN, or MEMBER',
    }),
  }),
});

// 14. Update Member Settings Schema
export const updateMemberSettingsSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
  body: z.object({
    isMuted: z.boolean().optional(),
    muteUntil: z.string()
      .datetime('Invalid datetime format')
      .nullable()
      .optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

// 15. Pin Message Schema
export const pinMessageSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
    messageId: uuidSchema,
  }),
});

// 16. Unpin Message Schema
export const unpinMessageSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
    messageId: uuidSchema,
  }),
});

// 17. Get Pinned Messages Schema
export const getPinnedMessagesSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
});

// 18. Create Announcement Schema
export const createAnnouncementSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
  body: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(100, 'Title must be 100 characters or less')
      .trim(),
    content: z.string()
      .min(1, 'Content is required')
      .max(1000, 'Content must be 1000 characters or less')
      .trim(),
  }),
});

// 19. Get Announcements Schema
export const getAnnouncementsSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
});

// 20. Create Poll Schema
export const createPollSchema = z.object({
  params: z.object({
    groupId: uuidSchema,
  }),
  body: z.object({
    question: z.string()
      .min(1, 'Question is required')
      .max(200, 'Question must be 200 characters or less')
      .trim(),
    options: z.array(z.string().min(1, 'Option cannot be empty').max(100, 'Option must be 100 characters or less'))
      .min(2, 'Poll must have at least 2 options')
      .max(10, 'Poll cannot have more than 10 options'),
    allowMultiple: z.boolean().default(false),
    expiresAt: z.string()
      .datetime('Invalid datetime format')
      .optional(),
  }),
});

// 21. Get Poll Schema
export const getPollSchema = z.object({
  params: z.object({
    messageId: uuidSchema,
  }),
});

// 22. Delete Poll Schema
export const deletePollSchema = z.object({
  params: z.object({
    messageId: uuidSchema,
  }),
});

// Export validation helper
export const validateRequest = <T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> => {
  return schema.parse(data);
};