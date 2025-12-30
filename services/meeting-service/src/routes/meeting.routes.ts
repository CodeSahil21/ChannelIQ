import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createMeetingController,
  searchMeetingController,
  getUserMeetingsController,
  getMeetingController,
  updateMeetingController,
  cancelMeetingController,
  startMeetingController,
  endMeetingController,
  joinMeetingController,
  leaveMeetingController,
  getLiveKitTokenController,
  setPasswordController,
  removePasswordController,
  getPasswordStatusController,
  promoteToCoHostController,
  demoteCoHostController,
} from '../controllers/meeting.controller';
import { authenticateAndRequireMeetingUser } from '../middleware/auth';

const router = Router();

// Rate limiting for join attempts
const joinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many join attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password attempts
const passwordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many password attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});


// Public routes
router.get('/search/:meetingId', authenticateAndRequireMeetingUser,searchMeetingController);
router.get('/:id/password/status', authenticateAndRequireMeetingUser,getPasswordStatusController);

// Protected routes
router.post('/', authenticateAndRequireMeetingUser,createMeetingController);
router.get('/', authenticateAndRequireMeetingUser,getUserMeetingsController);
router.get('/:id', authenticateAndRequireMeetingUser, getMeetingController);
router.put('/:id', authenticateAndRequireMeetingUser, updateMeetingController);
router.delete('/:id', authenticateAndRequireMeetingUser, cancelMeetingController);
// Meeting lifecycle
router.post('/:id/start', authenticateAndRequireMeetingUser, startMeetingController);
router.post('/:id/end', authenticateAndRequireMeetingUser, endMeetingController);
router.post('/:id/join', authenticateAndRequireMeetingUser, joinRateLimit, joinMeetingController);
router.post('/:id/leave', authenticateAndRequireMeetingUser, leaveMeetingController);
// LiveKit token
router.get('/:id/livekit-token', authenticateAndRequireMeetingUser,  getLiveKitTokenController);

// Password management
router.put('/:id/password', authenticateAndRequireMeetingUser, passwordRateLimit, setPasswordController);
router.delete('/:id/password', authenticateAndRequireMeetingUser, removePasswordController);
// Role management
router.post('/:id/promote', authenticateAndRequireMeetingUser, promoteToCoHostController);
router.post('/:id/demote', authenticateAndRequireMeetingUser, demoteCoHostController);

export default router;