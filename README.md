# InstaShare

Modern application to upload, manage, and share files securely. Nx monorepo that includes microservices and includes an Angular frontend, an Express/Prisma API, and an asynchronous processing worker with Redis.

---

Table of Contents

1. Requirements
2. Architecture and Structure
3. Installation and Initialization (Docker, Database, Prisma)
4. Environment Variables (PowerShell – Windows)
5. Running the Apps (frontend, backend, worker)
6. Testing (Unit and E2E)
7. API Usage (PowerShell)
8. Troubleshooting

---

Requirements

- Node.js 18.x (recommended) and npm 10+
- Docker and Docker Compose
- Windows PowerShell (examples are tailored for PowerShell)
- No need to install Nx globally; we will use npx

Architecture and Structure

- Nx monorepo + microservices
  - apps/frontend-web: Angular 20 + Angular Material
  - apps/backend-api: Express + Prisma + PostgreSQL (port 3333)
  - apps/file-processor: worker that listens to Redis events and compresses files
- Recommended local infra: PostgreSQL and Redis via Docker

Structure (overview)

- apps/
  - frontend-web/ (Angular SPA)
  - backend-api/
    - prisma/schema.prisma (models and migrations)
  - file-processor/ (background worker)

Installation and Initialization

1. Install dependencies

```bash
npm ci
```

1. Start infrastructure (PostgreSQL and Redis) with Docker

```bash
docker compose up -d
```

1. Initialize database with Prisma

```bash
npx prisma migrate dev --schema apps/backend-api/prisma/schema.prisma
npx prisma generate --schema apps/backend-api/prisma/schema.prisma
```

Environment Variables (PowerShell – Windows)

The backend and the worker read environment configuration from the process. Set these variables in the terminal session before starting the services.

- Database (matches docker-compose.yml):

```powershell
$env:DATABASE_URL = 'postgresql://user:password@localhost:5432/instashare?schema=public'
```

- Redis:

```powershell
$env:REDIS_URL = 'redis://localhost:6379'
```

- API port (optional, defaults to 3333):

```powershell
$env:PORT = '3333'
```

- JWT (note): the secret is currently hard-coded in code ('YOUR_JWT_SECRET') for development. Do not use in production.

Running the Apps

In separate terminals (set the environment variables in the same session of each terminal before running):

- Backend API (Express + Prisma)

```powershell
$env:DATABASE_URL = 'postgresql://user:password@localhost:5432/instashare?schema=public'
$env:REDIS_URL = 'redis://localhost:6379'
$env:PORT = '3333'
npx nx serve backend-api
```

The API will be available at <http://localhost:3333/api>  
CORS is allowed for <http://localhost:4201> by default.

- Processing worker (file-processor)

```powershell
$env:REDIS_URL = 'redis://localhost:6379'
npx nx serve file-processor
```

It listens for upload events and stores the ZIP in the database. Status flow: UPLOADED → PROCESSING → COMPLETED/FAILED.

- Angular frontend

  Option A (development with dev server):

```powershell
npx nx serve frontend-web --port=4201
```

  Option B (static server – same used by E2E):

```powershell
npx nx run frontend-web:serve-static --port=4300
```

Testing

- Unit (Jest)

```powershell
npx nx test frontend-web
npx nx test backend-api
npx nx test file-processor
```

Minimum coverage enforced: 85% (the repository currently exceeds these values).

- End-to-End (Cypress with Nx)

```powershell
npx nx e2e frontend-web-e2e --browser electron --config video=false
```

Notes:

- The preset starts a static server for the frontend at <http://localhost:4300>
- Port 4300 is used to avoid the Windows permissions issue on ::1:4200

API Usage (PowerShell)

- Register

```powershell
Invoke-WebRequest -Uri "http://localhost:3333/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com", "password":"password123"}'
```

- Login

```powershell
Invoke-WebRequest -Uri "http://localhost:3333/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com", "password":"password123"}'
```

Main Endpoints

- POST /api/auth/register – creates a user
- POST /api/auth/login – returns a JWT (Authorization: Bearer YOUR_TOKEN)
- GET /api/files – list user's files
- POST /api/files/upload – upload a file (multipart/form-data)
- PATCH /api/files/:id/rename – rename
- GET /api/files/:id – download (ZIP if processed)

Troubleshooting (Windows)

- Prisma cannot connect to PostgreSQL
  Make sure Docker is running (docker compose ps) and that DATABASE_URL points to the correct user/password/port.
- CORS blocked
  Run the frontend on port 4201 (matches the backend's current CORS config) or adjust the allowed origin in apps/backend-api/src/main.ts.
- E2E does not start or cannot reach the app
  Check that port 4300 is free and that the serve-static command starts correctly.
- Upload/compression does not switch to COMPLETED
  Verify that Redis is running and that the file-processor worker is running.

License
MIT
