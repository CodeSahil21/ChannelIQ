import { Response } from 'express';
import { deleteProfileImageSchema, deleteGroupProfileImageSchema, deleteMessageFileSchema } from '../utils/validation';
import storageService from '../services/storage.service';
import { publishMediaEvent } from '../kafka/publisher';
import { AuthenticatedRequest, MessageType } from '../utils/types';

const getMessageType = (mimeType: string): MessageType => {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'FILE';
};

export const uploadProfileImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id.toString();
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        msg: 'No file uploaded'
      });
      return;
    }

    const { fileName, fileUrl } = await storageService.uploadFile(req.file, userId);

    // Publish Kafka event
    await publishMediaEvent({
      eventType: 'PROFILE_IMAGE_UPLOADED',
      userId,
      imageUrl: fileUrl,
      timestamp: new Date().toISOString(),
      metadata: {
        fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      }
    });

    res.status(200).json({
      success: true,
      msg: 'Profile image uploaded successfully',
      data: {
        fileName,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        msg: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to upload profile image'
    });
  }
};

export const deleteProfileImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id.toString();
    const { fileName } = deleteProfileImageSchema.parse(req.body);

    await storageService.deleteFile(fileName);

    // Publish Kafka event
    await publishMediaEvent({
      eventType: 'PROFILE_IMAGE_DELETED',
      userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      msg: 'Profile image deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Delete error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        msg: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to delete profile image'
    });
  }
};

export const uploadGroupProfileImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id.toString();
    const { groupId } = req.params;
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        msg: 'No file uploaded'
      });
      return;
    }

    if (!groupId) {
      res.status(400).json({
        success: false,
        msg: 'Group ID is required'
      });
      return;
    }

    const { fileName, fileUrl } = await storageService.uploadFile(req.file, `group-${groupId}`);

    // Publish Kafka event
    await publishMediaEvent({
      eventType: 'GROUP_PROFILE_IMAGE_UPLOADED',
      userId,
      imageUrl: fileUrl,
      timestamp: new Date().toISOString(),
      metadata: {
        fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        groupId,
      }
    });

    res.status(200).json({
      success: true,
      msg: 'Group profile image uploaded successfully',
      data: {
        fileName,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        groupId
      }
    });

  } catch (error: any) {
    console.error('❌ Group upload error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        msg: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to upload group profile image'
    });
  }
};

export const deleteGroupProfileImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id.toString();
    const { groupId } = req.params;
    const { fileName } = deleteGroupProfileImageSchema.parse(req.body);

    if (!groupId) {
      res.status(400).json({
        success: false,
        msg: 'Group ID is required'
      });
      return;
    }

    await storageService.deleteFile(fileName);

    // Publish Kafka event
    await publishMediaEvent({
      eventType: 'GROUP_PROFILE_IMAGE_DELETED',
      userId,
      timestamp: new Date().toISOString(),
      metadata: {
        groupId,
      }
    });

    res.status(200).json({
      success: true,
      msg: 'Group profile image deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Group delete error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        msg: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to delete group profile image'
    });
  }
};

export const uploadMessageFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id.toString();
    const { groupId } = req.params;
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        msg: 'No file uploaded'
      });
      return;
    }

    if (!groupId) {
      res.status(400).json({
        success: false,
        msg: 'Group ID is required'
      });
      return;
    }

    const { fileName, fileUrl } = await storageService.uploadFile(req.file, `messages/${groupId}`);
    const messageType = getMessageType(req.file.mimetype);

    // Publish Kafka event
    await publishMediaEvent({
      eventType: 'MESSAGE_FILE_UPLOADED',
      userId,
      imageUrl: fileUrl,
      timestamp: new Date().toISOString(),
      metadata: {
        fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        groupId,
        messageType,
      }
    });

    res.status(200).json({
      success: true,
      msg: 'Message file uploaded successfully',
      data: {
        fileName,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        groupId,
        messageType
      }
    });

  } catch (error: any) {
    console.error('❌ Message file upload error:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to upload message file'
    });
  }
};
export const deleteMessageFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id.toString();
    const { groupId } = req.params;
    const { fileName } = deleteMessageFileSchema.parse(req.body);

    if (!groupId) {
      res.status(400).json({
        success: false,
        msg: 'Group ID is required'
      });
      return;
    }

    await storageService.deleteFile(fileName);

    // Publish Kafka event
    await publishMediaEvent({
      eventType: 'MESSAGE_FILE_DELETED',
      userId,
      timestamp: new Date().toISOString(),
      metadata: {
        fileName,
        groupId,
      }
    });

    res.status(200).json({
      success: true,
      msg: 'Message file deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Message file delete error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        msg: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to delete message file'
    });
  }
};