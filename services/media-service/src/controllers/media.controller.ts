import { Response } from 'express';
import { deleteProfileImageSchema } from '../utils/validation';
import storageService from '../services/storage.service';
import { publishMediaEvent } from '../kafka/publisher';
import { AuthenticatedRequest } from '../utils/types';

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

