# Procurement API (Backend)

Production-grade REST API for Procurement Management. Built with **Node.js**, **TypeScript**, **Express 5**, and **MongoDB** (Mongoose).

---

## Prerequisites

- **Node.js** ≥ 24.0.0
- **MongoDB** (local or remote instance)
- npm or yarn

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Environment setup

Copy the example env file and set your values:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable       | Description                          | Example                          |
|----------------|--------------------------------------|----------------------------------|
| `MONGODB_URI`  | MongoDB connection string            | `mongodb://localhost:27017/procurement_db` |
| `JWT_SECRET`   | Secret for JWT signing (min 32 chars in prod) | Strong random string        |
| `PORT`         | Server port (optional)               | `5000`                           |
| `NODE_ENV`     | `development` or `production`        | `development`                    |

See `.env.example` for all options (`JWT_EXPIRES_IN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `FRONTEND_URL`).

### 3. Run the server

**Development** (watch mode, no build):

```bash
npm run dev
```

**Production** (build then run):

```bash
npm run build
npm start
```

By default the API runs at **http://localhost:5000** (or the port in `.env`).

---

## API Overview

### Base URL

- Local: `http://localhost:5000`
- All API routes are versioned under `/api/v1/`.

### Public endpoints (no auth)

| Method | Path           | Description                    |
|--------|----------------|--------------------------------|
| GET    | `/health`      | Liveness check                 |
| GET    | `/health/ready`| Readiness (checks MongoDB)     |
| POST   | `/api/v1/auth/login` | Login (email+password or mobile+password) |
| GET    | `/api-docs`    | Swagger UI                     |
| GET    | `/api-docs.json` | OpenAPI spec (JSON)         |

### Protected endpoints (require `Authorization: Bearer <token>`)

| Area     | Base path              | Description                |
|----------|------------------------|----------------------------|
| Auth     | `/api/v1/auth`         | Logout                     |
| Users    | `/api/v1/users`        | CRUD, list, assign PM     |
| Orders   | `/api/v1/orders`       | CRUD, list by role         |
| Checklists | `/api/v1/checklists` | CRUD                       |
| Answers  | `/api/v1/answers`      | Submit/view answers        |
| Uploads  | `/api/v1/uploads`      | Image upload               |

Roles: `admin`, `procurement_manager`, `inspection_manager`, `client`. Access is enforced per route.

### Interacting with the API

1. **Login** to get a JWT:

   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"yourpassword"}'
   ```

   Response includes `data.token`. Use it in subsequent requests:

   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/v1/users
   ```

2. **Swagger UI** at `http://localhost:5000/api-docs` for trying endpoints interactively (you can add the token via “Authorize”).

3. **Response shape**  
   - Success: `{ success: true, statusCode, message, data, timestamp }`  
   - Error: `{ success: false, statusCode, message, errors? }`

---

## Scripts

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Start dev server (watch)              |
| `npm run build`      | Compile TypeScript to `dist/`         |
| `npm start`          | Run production build                  |
| `npm run lint`       | Type-check (tsc --noEmit)             |
| `npm test`           | Run all tests (watch)                 |
| `npm run test:unit`  | Unit tests only                       |
| `npm run test:integration` | Integration tests only          |
| `npm run test:coverage`    | All tests + coverage report     |

---

## Testing

Tests use **Jest** and live under `tests/`:

- **Unit:** `tests/unit/` — utils, validators, services (mocked repos).
- **Integration:** `tests/integration/` — HTTP routes with supertest (DB mocked).

No real MongoDB is required for tests. See **tests/README.md** for structure, commands, and coverage details.

```bash
npm run test:unit          # Unit only
npm run test:integration   # Integration only
npm run test:coverage       # All + coverage
```

---

## Project structure

```
backend/
├── src/
│   ├── config/          # env, db, swagger
│   ├── middleware/      # auth, validate, error, rateLimit, rbac
│   ├── modules/         # auth, users, orders, checklists, answers, uploads
│   ├── types/           # shared TypeScript types
│   ├── utils/           # ApiError, ApiResponse, asyncHandler, logger, jwtBlacklist
│   ├── validators/      # Joi schemas (auth, user, order, etc.)
│   ├── app.ts           # Express app (no listen)
│   └── server.ts        # Listen + DB connect
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── helpers/         # e.g. authHelper for test JWTs
│   └── README.md        # Test docs
├── .env.example
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md            # This file
```

---

## Environment variables (reference)

| Variable        | Required | Default    | Description                    |
|-----------------|----------|------------|--------------------------------|
| `NODE_ENV`      | No       | development| Environment                   |
| `PORT`          | No       | 5000       | Server port                    |
| `MONGODB_URI`   | Yes      | —          | MongoDB connection string      |
| `JWT_SECRET`    | Yes      | —          | JWT signing secret             |
| `JWT_EXPIRES_IN`| No       | 7d         | Token expiry                   |
| `UPLOAD_DIR`    | No       | uploads    | Directory for file uploads     |
| `MAX_FILE_SIZE` | No       | 5242880    | Max upload size (bytes)       |
| `FRONTEND_URL`  | No       | —          | CORS origin (production)      |

---

## License

ISC
