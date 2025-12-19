import { Router } from 'express';
import {
  createGroupController,
  getGroupByIdController,
  getMyGroupsController,
  searchGroupsController,
  getGroupMembersController,
  inviteUserController,
  joinGroupController,
  getPendingRequestsController,
  respondToRequestController,
  updateGroupController,
  removeMemberController,
  deleteGroupController,
  updateMemberRoleController,
  updateMemberSettingsController,
  pinMessageController,
  unpinMessageController,
  getPinnedMessagesController,
  createAnnouncementController,
} from '../controllers/group.controller';
import { authenticateAndRequireChatUser } from '../middleware/middleware';

const router = Router();

// Group Management
router.post('/create', authenticateAndRequireChatUser, createGroupController);
router.get('/my-groups', authenticateAndRequireChatUser, getMyGroupsController);
router.get('/search', authenticateAndRequireChatUser, searchGroupsController);
router.get('/:groupId', authenticateAndRequireChatUser, getGroupByIdController);
router.put('/:groupId', authenticateAndRequireChatUser, updateGroupController);
router.delete('/:groupId', authenticateAndRequireChatUser, deleteGroupController);

// Member Management
router.get('/:groupId/members', authenticateAndRequireChatUser, getGroupMembersController);
router.post('/:groupId/invite', authenticateAndRequireChatUser, inviteUserController);
router.post('/:groupId/join', authenticateAndRequireChatUser, joinGroupController);
router.delete('/:groupId/members/:userId', authenticateAndRequireChatUser, removeMemberController);
router.put('/:groupId/members/:userId/role', authenticateAndRequireChatUser, updateMemberRoleController);
router.put('/:groupId/settings', authenticateAndRequireChatUser, updateMemberSettingsController);

// Request Management
router.get('/requests/pending', authenticateAndRequireChatUser, getPendingRequestsController);
router.put('/requests/:requestId', authenticateAndRequireChatUser, respondToRequestController);

// Message Management
router.post('/:groupId/messages/:messageId/pin', authenticateAndRequireChatUser, pinMessageController);
router.delete('/:groupId/messages/:messageId/pin', authenticateAndRequireChatUser, unpinMessageController);
router.get('/:groupId/messages/pinned', authenticateAndRequireChatUser, getPinnedMessagesController);
router.post('/:groupId/announcements', authenticateAndRequireChatUser, createAnnouncementController);

export default router;
