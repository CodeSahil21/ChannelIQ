import { Response } from 'express';
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

// 1. Create Group Controller
export const createGroupController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = createGroupSchema.safeParse({ body: req.body });

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
    const groupData = validationResult.data.body;
    
    // Filter out undefined values
    const createGroupInput = {
      name: groupData.name,
      isPrivate: groupData.isPrivate,
      maxMembers: groupData.maxMembers,
      ...(groupData.description !== undefined && { description: groupData.description }),
      ...(groupData.imageUrl !== undefined && { imageUrl: groupData.imageUrl }),
    };
    
    const group = await CreateGroup(createGroupInput, userId);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group,
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// 2. Get Group By ID Controller
export const getGroupByIdController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = getGroupByIdSchema.safeParse({ params: req.params });

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

    const group = await getGroupDetails(groupId, userId);

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Error fetching group:', error);

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof ForbiddenError) {
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

// 3. Get My Groups Controller
export const getMyGroupsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const groups = await getMyGroups(userId);

    res.status(200).json({
      success: true,
      message: 'User groups retrieved successfully',
      data: groups,
    });
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 4. Search Groups Controller
export const searchGroupsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = searchGroupsSchema.safeParse({ query: req.query });

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

    const { search, page, limit } = validationResult.data.query;
    const result = await searchGroups(search, page, limit);

    res.status(200).json({
      success: true,
      message: 'Groups retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error searching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 5. Get Group Members Controller
export const getGroupMembersController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = getGroupMembersSchema.safeParse({ params: req.params });

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

    const members = await getGroupMembers(groupId, userId);

    res.status(200).json({
      success: true,
      message: 'Group members retrieved successfully',
      data: members,
    });
  } catch (error: any) {
    console.error('Error fetching group members:', error);

    if (error instanceof UnauthorizedError) {
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

// 6. Invite User Controller
export const inviteUserController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = inviteUserSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const inviteData = validationResult.data.body;
    
    // Filter out undefined values
    const inviteInput = {
      targetUserId: inviteData.targetUserId,
      ...(inviteData.message !== undefined && { message: inviteData.message }),
    };

    const invite = await inviteUserToGroup(groupId, userId, inviteInput);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invite,
    });
  } catch (error: any) {
    console.error('Error inviting user:', error);

    if (error instanceof UnauthorizedError) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof ConflictError) {
      res.status(409).json({
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

// 7. Join Group Controller
export const joinGroupController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = joinGroupSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const { message } = validationResult.data.body;

    const result = await joinGroupRequest(groupId, userId, message);

    res.status(201).json({
      success: true,
      message: 'Join request sent successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error joining group:', error);

    if (error.message === 'Group not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error.message === 'You are already a member of this group' ||
      error.message === 'You already have a pending join request for this group' ||
      error.message === 'Group has reached maximum capacity'
    ) {
      res.status(409).json({
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

// 8. Get Pending Requests Controller
export const getPendingRequestsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const requests = await getPendingRequests(userId);

    res.status(200).json({
      success: true,
      message: 'Pending requests retrieved successfully',
      data: requests,
    });
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// 9. Respond To Request Controller
export const respondToRequestController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = respondToRequestSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const { requestId } = validationResult.data.params;
    const { status } = validationResult.data.body;

    const result = await respondToRequest(requestId, userId, { status });

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error responding to request:', error);

    if (error.message === 'Request not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error.message === 'This request has already been processed' ||
      error.message === 'User is already a member of this group' ||
      error.message === 'Group has reached maximum capacity'
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === 'You do not have permission to respond to this request') {
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

// 10. Update Group Controller
export const updateGroupController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = updateGroupSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const updateData = validationResult.data.body;
    
    // Filter out undefined values
    const updateGroupInput = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const updatedGroup = await updateGroup(groupId, userId, updateGroupInput);

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: updatedGroup,
    });
  } catch (error: any) {
    console.error('Error updating group:', error);

    if (error.message === 'Group not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error.message === 'You are not a member of this group' ||
      error.message === 'Only admins can update group information'
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error.message === 'Maximum members must be at least 2' ||
      error.message?.includes('Cannot reduce max members below current member count')
    ) {
      res.status(400).json({
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

// 11. Remove Member Controller
export const removeMemberController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = removeMemberSchema.safeParse({ params: req.params });

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

    const currentUserId = req.user!.id;
    const { groupId, userId: targetUserId } = validationResult.data.params;

    const result = await removeMember(groupId, targetUserId, currentUserId);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error removing member:', error);

    if (error.message === 'Group not found' || error.message === 'Target user is not a member of this group') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error.message === 'You are not a member of this group' ||
      error.message === 'Only admins can remove members from the group' ||
      error.message === 'Cannot remove the group creator' ||
      error.message === 'Co-admins cannot remove admins' ||
      error.message === 'Co-admins cannot remove other co-admins' ||
      error.message?.includes('You are the only admin')
    ) {
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

// 12. Delete Group Controller
export const deleteGroupController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = deleteGroupSchema.safeParse({ params: req.params });

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

    const result = await deleteGroup(groupId, userId);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error deleting group:', error);

    if (error.message === 'Group not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === 'Only the group creator can delete the group') {
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

// 13. Update Member Role Controller
export const updateMemberRoleController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = updateMemberRoleSchema.safeParse({
      params: req.params,
      body: req.body,
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

    const currentUserId = req.user!.id;
    const { groupId, userId: targetUserId } = validationResult.data.params;
    const { role } = validationResult.data.body;

    const updatedMember = await updateMemberRole(groupId, targetUserId, currentUserId, { role });

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: updatedMember,
    });
  } catch (error: any) {
    console.error('Error updating member role:', error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof ConflictError) {
      res.status(409).json({
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

// 14. Update Member Settings Controller
export const updateMemberSettingsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = updateMemberSettingsSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const settingsData = validationResult.data.body;
    
    // Filter out undefined values
    const settings = Object.fromEntries(
      Object.entries(settingsData).filter(([_, value]) => value !== undefined)
    );

    const updatedMember = await updateMemberSettings(groupId, userId, settings);

    res.status(200).json({
      success: true,
      message: 'Member settings updated successfully',
      data: updatedMember,
    });
  } catch (error: any) {
    console.error('Error updating member settings:', error);

    if (error instanceof UnauthorizedError) {
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

// 15. Pin Message Controller
export const pinMessageController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = pinMessageSchema.safeParse({ params: req.params });

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
    const { groupId, messageId } = validationResult.data.params;

    const pinnedMessage = await pinMessage(groupId, messageId, userId);

    // Emit real-time event
    emitMessagePinned(groupId, messageId, req.user!.fullName);

    res.status(201).json({
      success: true,
      message: 'Message pinned successfully',
      data: pinnedMessage,
    });
  } catch (error: any) {
    console.error('Error pinning message:', error);

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof ConflictError) {
      res.status(409).json({
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

// 16. Unpin Message Controller
export const unpinMessageController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = unpinMessageSchema.safeParse({ params: req.params });

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
    const { groupId, messageId } = validationResult.data.params;

    const result = await unpinMessage(groupId, messageId, userId);

    // Emit real-time event
    emitMessageUnpinned(groupId, messageId, req.user!.fullName);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error unpinning message:', error);

    if (error.message === 'Message is not pinned') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === 'Only admins can unpin messages') {
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

// 17. Get Pinned Messages Controller
export const getPinnedMessagesController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = getPinnedMessagesSchema.safeParse({ params: req.params });

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

    const pinnedMessages = await getPinnedMessages(groupId, userId);

    res.status(200).json({
      success: true,
      message: 'Pinned messages retrieved successfully',
      data: pinnedMessages,
    });
  } catch (error: any) {
    console.error('Error fetching pinned messages:', error);

    if (error instanceof UnauthorizedError) {
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

// 18. Create Announcement Controller
export const createAnnouncementController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = createAnnouncementSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const announcementData = validationResult.data.body;

    const announcement = await createAnnouncement(groupId, userId, announcementData);

    // Emit real-time event
    emitAnnouncementCreated(groupId, announcement.id, announcement.content || '', req.user!.fullName);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement,
    });
  } catch (error: any) {
    console.error('Error creating announcement:', error);

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
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

// 19. Get Announcements Controller
export const getAnnouncementsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = getAnnouncementsSchema.safeParse({ params: req.params });

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

    const announcements = await getAnnouncements(groupId, userId);

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: announcements,
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);

    if (error instanceof UnauthorizedError) {
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

// 20. Create Poll Controller
export const createPollController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = createPollSchema.safeParse({
      params: req.params,
      body: req.body,
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
    const pollData = validationResult.data.body;

    // Filter out undefined values to match CreatePollInput type
    const createPollInput = {
      question: pollData.question,
      options: pollData.options,
      allowMultiple: pollData.allowMultiple,
      ...(pollData.expiresAt !== undefined && { expiresAt: pollData.expiresAt }),
    };

    const poll = await createPoll(groupId, userId, createPollInput);

    // Emit real-time event
    emitPollCreated(groupId, poll.id, poll.poll.question, req.user!.fullName);

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: poll,
    });
  } catch (error: any) {
    console.error('Error creating poll:', error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
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

// 21. Get Poll Controller
export const getPollController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = getPollSchema.safeParse({ params: req.params });

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
    const { messageId } = validationResult.data.params;

    const poll = await getPoll(messageId, userId);

    res.status(200).json({
      success: true,
      message: 'Poll retrieved successfully',
      data: poll,
    });
  } catch (error: any) {
    console.error('Error fetching poll:', error);

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
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

// 22. Delete Poll Controller
export const deletePollController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = deletePollSchema.safeParse({ params: req.params });

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
    const { messageId } = validationResult.data.params;

    const result = await deletePoll(messageId, userId);

    // Emit real-time event - need to get groupId from result
    if (result.success && result.poll) {
      emitPollDeleted(result.poll.message.groupId, messageId, req.user!.fullName);
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error deleting poll:', error);

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
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

// 23. Get Polls Controller
export const getPollsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = getAnnouncementsSchema.safeParse({ params: req.params });

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

    const polls = await getPolls(groupId, userId);

    res.status(200).json({
      success: true,
      message: 'Polls retrieved successfully',
      data: polls,
    });
  } catch (error: any) {
    console.error('Error fetching polls:', error);

    if (error instanceof UnauthorizedError) {
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