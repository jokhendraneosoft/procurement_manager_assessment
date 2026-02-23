/** @type {import('jest').Config} */
const base = require('./jest.config.js');

module.exports = {
    ...base,
    displayName: 'integration',
    testMatch: ['**/tests/integration/**/*.integration.test.ts'],
    testTimeout: 15000,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.integration.ts'],
};
