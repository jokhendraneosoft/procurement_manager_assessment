import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { upload } from './upload.service';
import { uploadFile } from './upload.controller';

const router = Router();

router.use(authenticate);

// Allow any authenticated user to upload (IMs need it for answers)
router.post('/', upload.single('file'), uploadFile);

export default router;
