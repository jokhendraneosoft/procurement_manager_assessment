/**
 * Integration test setup.
 * Runs once before all integration test files.
 */
beforeAll(() => {
    process.env.NODE_ENV = 'test';
});
