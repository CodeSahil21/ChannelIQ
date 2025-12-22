import { Router } from 'express';
import { getMessagesController } from '../controllers/message.controller';
import { authenticateAndRequireChatUser } from '../middleware/middleware';

const router = Router();

router.get('/:groupId/messages', authenticateAndRequireChatUser, getMessagesController);

export default router;