import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createMeeting,
  searchMeeting,
  getUserMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  startMeeting,
  endMeeting,
  joinMeeting,
  leaveMeeting,
  setPassword,
  removePassword,
  promoteToCoHost,
  demoteCoHost,
} from '../services/meeting.service';
import { LiveKitService } from '../services/livekit.service';
import {
  createMeetingSchema,
  updateMeetingSchema,
  joinMeetingSchema,
  passwordSchema,
  roleChangeSchema,
  paginationSchema,
} from '../utils/validation';
import { publishMeetingEvent } from '../kafka/publisher';
import {
  emitParticipantJoined,
  emitParticipantLeft,
  emitParticipantRoleChanged,
  emitMeetingStarted,
  emitMeetingEnded
} from '../services/meetingSocket.service';

const liveKitService = new LiveKitService();

export const createMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = createMeetingSchema.safeParse(req.body);

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

    const meeting = await createMeeting(req.user!.id, validationResult.data);
    
    await publishMeetingEvent({
      type: 'MEETING_CREATED',
      meetingId: meeting.id,
      userId: req.user!.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting,
    });
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

export const searchMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const meeting = await searchMeeting(meetingId);
    
    if (!meeting) {
      res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: meeting,
    });
  } catch (error: any) {
    console.error('Error searching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserMeetingsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = paginationSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
      });
      return;
    }

    const { page, limit } = validationResult.data;
    const meetings = await getUserMeetings(req.user!.id, page, limit);
    
    res.json({
      success: true,
      data: meetings,
    });
  } catch (error: any) {
    console.error('Error fetching user meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await getMeetingById(id, req.user!.id);
    
    if (!meeting) {
      res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: meeting,
    });
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = updateMeetingSchema.safeParse(req.body);

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

    const { id } = req.params;
    const meeting = await updateMeeting(id, req.user!.id, validationResult.data);
    
    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting,
    });
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await cancelMeeting(id, req.user!.id);
    
    res.json({
      success: true,
      message: 'Meeting cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const startMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await startMeeting(id, req.user!.id);
    
    await publishMeetingEvent({
      type: 'MEETING_STARTED',
      meetingId: id,
      userId: req.user!.id,
      timestamp: new Date().toISOString(),
    });

    // Emit real-time event
    await emitMeetingStarted({
      meetingId: id,
      hostId: req.user!.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Meeting started successfully',
    });
  } catch (error: any) {
    console.error('Error starting meeting:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const endMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await endMeeting(id, req.user!.id);
    
    await publishMeetingEvent({
      type: 'MEETING_ENDED',
      meetingId: id,
      userId: req.user!.id,
      timestamp: new Date().toISOString(),
    });

    // Emit real-time event
    await emitMeetingEnded({
      meetingId: id,
      hostId: req.user!.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Meeting ended successfully',
    });
  } catch (error: any) {
    console.error('Error ending meeting:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = joinMeetingSchema.safeParse(req.body);

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

    const { id } = req.params;
    const result = await joinMeeting(id, req.user!.id, validationResult.data);
    
    await publishMeetingEvent({
      type: 'PARTICIPANT_JOINED',
      meetingId: id,
      userId: req.user!.id,
      data: { role: result.role },
      timestamp: new Date().toISOString(),
    });

    // Emit real-time event
    await emitParticipantJoined({
      meetingId: id,
      userId: req.user!.id,
      userName: result.userName,
      userEmail: result.userEmail,
      role: result.role,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Joined meeting successfully',
      data: { role: result.role },
    });
  } catch (error: any) {
    console.error('Error joining meeting:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLiveKitTokenController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await getMeetingById(id, req.user!.id);
    
    if (!meeting) {
      res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
      return;
    }

    const participant = meeting.participants?.find(p => p.userId === req.user!.id);
    if (!participant) {
      res.status(403).json({
        success: false,
        message: 'Not a meeting participant',
      });
      return;
    }

    const token = await liveKitService.generateToken(id, req.user!.id, participant.role);
    const wsUrl = liveKitService.getWsUrl();
    
    console.log('Generated token type:', typeof token);
    console.log('Generated token value:', token);
    
    res.json({
      success: true,
      data: { 
        token: String(token), 
        wsUrl: String(wsUrl) 
      },
    });
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const setPasswordController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = passwordSchema.safeParse(req.body);

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

    const { id } = req.params;
    const { password } = validationResult.data;
    await setPassword(id, req.user!.id, password);
    
    res.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error: any) {
    console.error('Error setting password:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removePasswordController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await removePassword(id, req.user!.id);
    
    res.json({
      success: true,
      message: 'Password removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing password:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPasswordStatusController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await searchMeeting(id);
    
    if (!meeting) {
      res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: { passwordEnabled: meeting.passwordEnabled },
    });
  } catch (error: any) {
    console.error('Error getting password status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const promoteToCoHostController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = roleChangeSchema.safeParse(req.body);

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

    const { id } = req.params;
    const { userId } = validationResult.data;
    const result = await promoteToCoHost(id, req.user!.id, userId);
    
    // Emit real-time event
    await emitParticipantRoleChanged({
      meetingId: id,
      userId,
      userName: result.userName,
      oldRole: 'PARTICIPANT',
      newRole: 'CO_HOST',
      changedBy: req.user!.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'User promoted to co-host successfully',
    });
  } catch (error: any) {
    console.error('Error promoting to co-host:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const leaveMeetingController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await leaveMeeting(id, req.user!.id);
    
    // Emit real-time event
    await emitParticipantLeft({
      meetingId: id,
      userId: req.user!.id,
      userName: result.userName,
      userEmail: result.userEmail,
      role: result.role,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Left meeting successfully',
    });
  } catch (error: any) {
    console.error('Error leaving meeting:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const demoteCoHostController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validationResult = roleChangeSchema.safeParse(req.body);

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

    const { id } = req.params;
    const { userId } = validationResult.data;
    const result = await demoteCoHost(id, req.user!.id, userId);
    
    // Emit real-time event
    await emitParticipantRoleChanged({
      meetingId: id,
      userId,
      userName: result.userName,
      oldRole: 'CO_HOST',
      newRole: 'PARTICIPANT',
      changedBy: req.user!.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Co-host demoted successfully',
    });
  } catch (error: any) {
    console.error('Error demoting co-host:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};