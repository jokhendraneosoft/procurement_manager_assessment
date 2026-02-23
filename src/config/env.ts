import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
    const val = process.env[key];
    if (!val) throw new Error(`Missing required environment variable: ${key}`);
    return val;
};

const jwtSecret = required('JWT_SECRET');
const isProd = process.env.NODE_ENV === 'production';
if (isProd && jwtSecret.length < 32) {
    console.warn(
        '⚠️  JWT_SECRET is shorter than 32 characters. Use a longer secret in production.',
    );
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseInt(process.env.PORT ?? '5000', 10),
    MONGODB_URI: required('MONGODB_URI'),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
    UPLOAD_DIR: process.env.UPLOAD_DIR ?? 'uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE ?? '5242880', 10),
    isDev: (process.env.NODE_ENV ?? 'development') === 'development',
    isProd,
};
