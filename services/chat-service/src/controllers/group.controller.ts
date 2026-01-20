import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import {
  createGroupSchema,
  getGroupByIdSchema,
  searchGroupsSchema,
  getGroupMembersSchema,
  inviteUserSchema,
  joinGroupSchema,
  respondToRequestSchema,
  updateGroupSchema,
  removeMemberSchema,
  deleteGroupSchema,
  updateMemberRoleSchema,
  updateMemberSettingsSchema,
  pinMessageSchema,
  unpinMessageSchema,
  getPinnedMessagesSchema,
  createAnnouncementSchema,
  getAnnouncementsSchema,
  createPollSchema,
  getPollSchema,
  deletePollSchema,
} from '../utils/schema';
import {
  CreateGroup,
  getMyGroups,
  getGroupDetails,
  searchGroups,
  getGroupMembers,
  inviteUserToGroup,
  joinGroupRequest,
  getPendingRequests,
  respondToRequest,
  updateGroup,
  removeMember,
  deleteGroup,
  updateMemberRole,
  updateMemberSettings,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  createAnnouncement,
  getAnnouncements,
  createPoll,
  getPoll,
  getPolls,
  deletePoll,
} from '../services/group.service';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors';
import { 
  emitAnnouncementCreated, 
  emitPollCreated, 
  emitPollDeleted, 
  emitMessagePinned, 
  emitMessageUnpinned 
} from '../socket/emitters';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export const createGroupController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = createGroupSchema.safeParse({ body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const groupData = validationResult.data.body;
    const createGroupInput = {
      name: groupData.name,
      isPrivate: groupData.isPrivate,
      maxMembers: groupData.maxMembers,
      ...(groupData.description !== undefined && { description: groupData.description }),
      ...(groupData.imageUrl !== undefined && { imageUrl: groupData.imageUrl }),
    };
    
    const group = await CreateGroup(createGroupInput, userId);
    const response = new ApiResponse(201, group, 'Group created successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getGroupByIdController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = getGroupByIdSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const group = await getGroupDetails(groupId, userId);

    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    const response = new ApiResponse(200, group, 'Group retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof ForbiddenError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const getMyGroupsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const groups = await getMyGroups(userId);
    const response = new ApiResponse(200, groups, 'User groups retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const searchGroupsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = searchGroupsSchema.safeParse({ query: req.query });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const { search, page, limit } = validationResult.data.query;
    const result = await searchGroups(search, page, limit);
    const response = new ApiResponse(200, result, 'Groups retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getGroupMembersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = getGroupMembersSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const members = await getGroupMembers(groupId, userId);
    const response = new ApiResponse(200, members, 'Group members retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const inviteUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = inviteUserSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const inviteData = validationResult.data.body;
    const inviteInput = {
      targetUserId: inviteData.targetUserId,
      ...(inviteData.message !== undefined && { message: inviteData.message }),
    };

    const invite = await inviteUserToGroup(groupId, userId, inviteInput);
    const response = new ApiResponse(201, invite, 'Invitation sent successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof ConflictError) return next(new ApiError(409, error.message));
    next(error);
  }
};

export const joinGroupController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = joinGroupSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const { message } = validationResult.data.body;
    const result = await joinGroupRequest(groupId, userId, message);
    const response = new ApiResponse(201, result, 'Join request sent successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error.message === 'Group not found') return next(new ApiError(404, error.message));
    if (error.message === 'You are already a member of this group' || 
        error.message === 'You already have a pending join request for this group' ||
        error.message === 'Group has reached maximum capacity') {
      return next(new ApiError(409, error.message));
    }
    next(error);
  }
};

export const getPendingRequestsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const requests = await getPendingRequests(userId);
    const response = new ApiResponse(200, requests, 'Pending requests retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const respondToRequestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = respondToRequestSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { requestId } = validationResult.data.params;
    const { status } = validationResult.data.body;
    const result = await respondToRequest(requestId, userId, { status });
    const response = new ApiResponse(200, result, `Request ${status.toLowerCase()} successfully`);
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error.message === 'Request not found') return next(new ApiError(404, error.message));
    if (error.message === 'This request has already been processed' ||
        error.message === 'User is already a member of this group' ||
        error.message === 'Group has reached maximum capacity') {
      return next(new ApiError(409, error.message));
    }
    if (error.message === 'You do not have permission to respond to this request') {
      return next(new ApiError(403, error.message));
    }
    next(error);
  }
};

export const updateGroupController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = updateGroupSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const updateData = validationResult.data.body;
    const updateGroupInput = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const updatedGroup = await updateGroup(groupId, userId, updateGroupInput);
    const response = new ApiResponse(200, updatedGroup, 'Group updated successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error.message === 'Group not found') return next(new ApiError(404, error.message));
    if (error.message === 'You are not a member of this group' ||
        error.message === 'Only admins can update group information') {
      return next(new ApiError(403, error.message));
    }
    if (error.message === 'Maximum members must be at least 2' ||
        error.message?.includes('Cannot reduce max members below current member count')) {
      return next(new ApiError(400, error.message));
    }
    next(error);
  }
};

export const removeMemberController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = removeMemberSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const currentUserId = req.user!.id;
    const { groupId, userId: targetUserId } = validationResult.data.params;
    const result = await removeMember(groupId, targetUserId, currentUserId);
    const response = new ApiResponse(200, result, 'Member removed successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error.message === 'Group not found' || error.message === 'Target user is not a member of this group') {
      return next(new ApiError(404, error.message));
    }
    if (error.message === 'You are not a member of this group' ||
        error.message === 'Only admins can remove members from the group' ||
        error.message === 'Cannot remove the group creator' ||
        error.message === 'Co-admins cannot remove admins' ||
        error.message === 'Co-admins cannot remove other co-admins' ||
        error.message?.includes('You are the only admin')) {
      return next(new ApiError(403, error.message));
    }
    next(error);
  }
};

export const deleteGroupController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = deleteGroupSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const result = await deleteGroup(groupId, userId);
    const response = new ApiResponse(200, result, 'Group deleted successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error.message === 'Group not found') return next(new ApiError(404, error.message));
    if (error.message === 'Only the group creator can delete the group') {
      return next(new ApiError(403, error.message));
    }
    next(error);
  }
};

export const updateMemberRoleController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = updateMemberRoleSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const currentUserId = req.user!.id;
    const { groupId, userId: targetUserId } = validationResult.data.params;
    const { role } = validationResult.data.body;
    const updatedMember = await updateMemberRole(groupId, targetUserId, currentUserId, { role });
    const response = new ApiResponse(200, updatedMember, 'Member role updated successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof ValidationError) return next(new ApiError(400, error.message));
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return next(new ApiError(403, error.message));
    }
    if (error instanceof ConflictError) return next(new ApiError(409, error.message));
    next(error);
  }
};

export const updateMemberSettingsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = updateMemberSettingsSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const settingsData = validationResult.data.body;
    const settings = Object.fromEntries(
      Object.entries(settingsData).filter(([_, value]) => value !== undefined)
    );

    const updatedMember = await updateMemberSettings(groupId, userId, settings);
    const response = new ApiResponse(200, updatedMember, 'Member settings updated successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const pinMessageController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = pinMessageSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId, messageId } = validationResult.data.params;
    const pinnedMessage = await pinMessage(groupId, messageId, userId);
    emitMessagePinned(groupId, messageId, req.user!.fullName);
    const response = new ApiResponse(201, pinnedMessage, 'Message pinned successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    if (error instanceof ConflictError) return next(new ApiError(409, error.message));
    next(error);
  }
};

export const unpinMessageController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = unpinMessageSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId, messageId } = validationResult.data.params;
    const result = await unpinMessage(groupId, messageId, userId);
    emitMessageUnpinned(groupId, messageId, req.user!.fullName);
    const response = new ApiResponse(200, result, 'Message unpinned successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error.message === 'Message is not pinned') return next(new ApiError(404, error.message));
    if (error.message === 'Only admins can unpin messages') return next(new ApiError(403, error.message));
    next(error);
  }
};

export const getPinnedMessagesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = getPinnedMessagesSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const pinnedMessages = await getPinnedMessages(groupId, userId);
    const response = new ApiResponse(200, pinnedMessages, 'Pinned messages retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const createAnnouncementController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = createAnnouncementSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const announcementData = validationResult.data.body;
    const announcement = await createAnnouncement(groupId, userId, announcementData);
    emitAnnouncementCreated(groupId, announcement.id, announcement.content || '', req.user!.fullName);
    const response = new ApiResponse(201, announcement, 'Announcement created successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const getAnnouncementsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = getAnnouncementsSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const announcements = await getAnnouncements(groupId, userId);
    const response = new ApiResponse(200, announcements, 'Announcements retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const createPollController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = createPollSchema.safeParse({ params: req.params, body: req.body });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const pollData = validationResult.data.body;
    const createPollInput = {
      question: pollData.question,
      options: pollData.options,
      allowMultiple: pollData.allowMultiple,
      ...(pollData.expiresAt !== undefined && { expiresAt: pollData.expiresAt }),
    };

    const poll = await createPoll(groupId, userId, createPollInput);
    emitPollCreated(groupId, poll.id, poll.poll.question, req.user!.fullName);
    const response = new ApiResponse(201, poll, 'Poll created successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof ValidationError) return next(new ApiError(400, error.message));
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const getPollController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = getPollSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { messageId } = validationResult.data.params;
    const poll = await getPoll(messageId, userId);
    const response = new ApiResponse(200, poll, 'Poll retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const deletePollController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = deletePollSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { messageId } = validationResult.data.params;
    const result = await deletePoll(messageId, userId);

    if (result.success && result.poll) {
      emitPollDeleted(result.poll.message.groupId, messageId, req.user!.fullName);
    }

    const response = new ApiResponse(200, result, 'Poll deleted successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof NotFoundError) return next(new ApiError(404, error.message));
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};

export const getPollsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = getAnnouncementsSchema.safeParse({ params: req.params });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      throw new ApiError(400, 'Validation failed', fieldErrors);
    }

    const userId = req.user!.id;
    const { groupId } = validationResult.data.params;
    const polls = await getPolls(groupId, userId);
    const response = new ApiResponse(200, polls, 'Polls retrieved successfully');
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) return next(new ApiError(403, error.message));
    next(error);
  }
};