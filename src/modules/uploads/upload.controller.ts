import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { validateFileMagic } from '../../validators/upload.validator';

export const uploadFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        throw ApiError.badRequest('No file uploaded');
    }

    // Validate file content (magic bytes) – prevents spoofed mimetype / executable uploads
    await validateFileMagic(req.file.path, req.file.mimetype);

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/${env.UPLOAD_DIR}/${req.file.filename}`;

    res.status(201).json(
        new ApiResponse(201, 'File uploaded successfully', {
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
        }),
    );
});
