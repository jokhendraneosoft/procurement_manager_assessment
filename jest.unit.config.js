/** @type {import('jest').Config} */
const base = require('./jest.config.js');

module.exports = {
    ...base,
    displayName: 'unit',
    testMatch: ['**/tests/unit/**/*.test.ts'],
    testTimeout: 5000,
};
