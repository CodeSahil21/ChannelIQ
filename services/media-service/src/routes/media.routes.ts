import { Router } from 'express';
import { uploadProfileImage, deleteProfileImage, uploadGroupProfileImage, deleteGroupProfileImage } from '../controllers/media.controller';
import { upload } from '../utils/multer';
import { uploadRateLimit, protectRoute } from '../middleware/middleware';

const router = Router();

router.post('/upload-profile-image', protectRoute, uploadRateLimit, upload.single('profileImage'), uploadProfileImage);
router.delete('/delete-profile-image', protectRoute, deleteProfileImage);

router.post('/group-profile-images/:groupId/upload', protectRoute, uploadRateLimit, upload.single('groupProfileImage'), uploadGroupProfileImage);
router.delete('/group-profile-images/:groupId/delete', protectRoute, deleteGroupProfileImage);

export default router;