import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { ALLOWED_MIMETYPES, ALLOWED_IMAGE_TYPES, getSafeUploadDir } from '../../validators/upload.validator';

// Resolve upload dir under cwd only (prevents path traversal via env)
const uploadDir = getSafeUploadDir(env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Extension from our whitelist only – never use client originalname (path traversal / double extension)
        const config = ALLOWED_IMAGE_TYPES[file.mimetype];
        const ext = config ? config.ext : '.bin';
        cb(null, `file-${uniqueSuffix}${ext}`);
    },
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest('Only image files are allowed (JPEG, PNG, GIF, WebP).'));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: env.MAX_FILE_SIZE },
    fileFilter,
});
