# MedVision AI — Development Setup

## Prerequisites

| Tool | Version | Verify |
|------|---------|--------|
| Java JDK | 21+ | `java -version` |
| Maven | via wrapper | `backend/mvnw -v` |
| Node.js | 20 LTS+ | `node -v` |
| npm | 10+ | `npm -v` |
| Python | 3.11+ | `python --version` |
| MySQL | 8.0+ | optional if using Docker |
| Docker | 24+ | optional for containerized dev |

## Repository Layout

```
medvision-ai/
├── .env.example          Root environment template (copy to .env)
├── frontend/             React SPA (port 5173)
├── backend/              Spring Boot API (port 8080)
├── ai-service/           FastAPI inference service (port 8000)
├── database/init/        MySQL bootstrap SQL
├── docker/               docker-compose.yml + Dockerfiles
└── docs/                 Design documents
```

## First-Time Setup

### Step 1 — Clone and configure environment

```powershell
# From repository root
copy .env.example .env
```

Edit `.env` and set at minimum:

- `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD`
- `JWT_SECRET` (256-bit random string)
- `AI_SERVICE_API_KEY` (shared secret between backend and AI service)

**Never commit `.env` to git.**

### Step 2 — Start MySQL

**Option A — Docker (recommended)**

```powershell
cd docker
docker compose up mysql -d
```

**Option B — Local MySQL**

Create database and user:

```sql
CREATE DATABASE medvision CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'medvision_app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON medvision.* TO 'medvision_app'@'localhost';
FLUSH PRIVILEGES;
```

Set `DB_USERNAME` and `DB_PASSWORD` in `.env`.

### Step 3 — Backend

```powershell
cd backend
.\mvnw.cmd clean verify
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Profiles:

| Profile | Database | Use case |
|---------|----------|----------|
| `dev` | H2 in-memory | Local dev without MySQL |
| `default` | MySQL | Production-like local |
| `docker` | MySQL container | Docker Compose |

Verify: http://localhost:8080/actuator/health

### Step 4 — AI Service

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Verify: http://localhost:8000/health

### Step 5 — Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Verify: http://localhost:5173

## Running All Services (local)

Open three terminals:

```powershell
# Terminal 1 — Backend (dev profile, no MySQL required)
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"

# Terminal 2 — AI Service
cd ai-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev
```

## Build Verification Commands

```powershell
# Frontend production build
cd frontend
npm install
npm run build

# Backend tests + package
cd backend
.\mvnw.cmd clean verify

# AI service import check
cd ai-service
pip install -r requirements.txt
python -c "from app.main import app; print(app.title)"
```

## Docker Full Stack

```powershell
copy .env.example .env
# Edit .env with real secrets
cd docker
docker compose up --build
```

Services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| AI Service | http://localhost:8000 |
| MySQL | localhost:3306 |

## Troubleshooting

### Port 8080 already in use

```powershell
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Spring Boot 4 test dependencies

Backend tests require `spring-boot-starter-webmvc-test` and `spring-boot-starter-security-test` (already in `pom.xml`).

### Frontend build TypeScript errors

Run `npm run build` — fix any `tsc` errors before committing.

### AI service API key

Set `AI_SERVICE_API_KEY` in both root `.env` and `ai-service/.env`. Backend reads it via `AI_SERVICE_API_KEY` environment variable.

## Next Implementation Phase

Phase 1: JWT authentication, Flyway migrations, patient CRUD — see `docs/TECHNICAL_DESIGN.md`.
