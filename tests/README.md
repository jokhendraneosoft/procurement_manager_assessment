# Backend tests

## Structure

- **`unit/`** – Unit tests for utils, validators, and services (mocked dependencies).
- **`integration/`** – API route tests using supertest (mocked DB/external deps).
- **`setup.integration.ts`** – Runs before integration tests (e.g. `NODE_ENV=test`).

## Commands

| Command | Description |
|--------|-------------|
| `npm test` | Run all tests (watch mode) |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:coverage` | Run all tests with coverage report |

## Conventions

- Unit tests: `tests/unit/**/*.test.ts` (mirrors `src/` layout).
- Integration tests: `tests/integration/**/*.integration.test.ts`.
- Use `@/` path alias for imports from `src/` (e.g. `import { ApiError } from '@/utils/ApiError'`).
- Mock external deps (DB, repos) in tests; integration tests mock `@/config/db` so no real MongoDB is required.
- Use `tests/helpers/authHelper.ts` for generating JWT tokens in integration tests (e.g. `getAdminToken()`, `getPMToken()`).

## Test coverage (necessary modules)

| Area | Unit | Integration |
|------|------|-------------|
| Utils | ApiError, ApiResponse, asyncHandler | — |
| Middleware | validate, error | — |
| Validators | auth (loginSchema) | — |
| Auth | auth.service | POST /api/v1/auth/login |
| Users | user.service | GET/POST /api/v1/users, GET /api/v1/users/:id |
| Orders | order.service | GET/POST /api/v1/orders, GET /api/v1/orders/:id |
| Health | — | GET /health, GET /health/ready |
