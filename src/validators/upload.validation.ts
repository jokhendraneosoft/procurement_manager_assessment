import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { ApiError } from '../utils/ApiError';

function readFirstBytes(filePath: string, length: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const stream = createReadStream(filePath, { start: 0, end: length - 1 });
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
        });
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

/**
 * Allowed image types only. SVG excluded (can carry XSS).
 * Extension is derived from mimetype only (never from client filename).
 */
export const ALLOWED_IMAGE_TYPES: Record<string, { ext: string; magic: number[][] }> = {
    'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
    'image/png': { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
    'image/gif': { ext: '.gif', magic: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] },
    'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] }, // RIFF; WEBP at 8-11 checked below
};

export const ALLOWED_MIMETYPES = new Set<string>(Object.keys(ALLOWED_IMAGE_TYPES));

/** Check file content matches declared mimetype (magic bytes). Prevents spoofed mimetype. */
export async function validateFileMagic(filePath: string, mimetype: string): Promise<void> {
    const config = ALLOWED_IMAGE_TYPES[mimetype];
    if (!config) throw ApiError.badRequest('Invalid file type');

    const buf = await readFirstBytes(filePath, 12);
    let matches = config.magic.some((signature) => {
        if (buf.length < signature.length) return false;
        return signature.every((byte, i) => buf[i] === byte);
    });

    if (mimetype === 'image/webp' && matches) {
        matches = buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    }

    if (!matches) {
        await fs.unlink(filePath).catch(() => {});
        throw ApiError.badRequest('File content does not match declared type. Only image files are allowed.');
    }
}

/** Ensure upload dir is under cwd to prevent path traversal via UPLOAD_DIR. */
export function getSafeUploadDir(baseDir: string): string {
    const cwd = process.cwd();
    const resolved = path.resolve(cwd, baseDir);
    const relative = path.relative(cwd, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('UPLOAD_DIR must resolve to a path inside the project directory');
    }
    return resolved;
}
