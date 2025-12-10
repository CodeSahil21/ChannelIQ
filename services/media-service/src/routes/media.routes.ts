import { Router } from 'express';
import { uploadProfileImage, deleteProfileImage } from '../controllers/media.controller';
import { upload } from '../utils/multer';
import { uploadRateLimit, protectRoute } from '../middleware/middleware';

const router = Router();

router.post('/upload-profile-image', protectRoute, uploadRateLimit, upload.single('profileImage'), uploadProfileImage);
router.delete('/delete-profile-image', protectRoute, deleteProfileImage);

export default router;