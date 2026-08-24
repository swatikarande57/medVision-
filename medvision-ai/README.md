# MedVision AI

Full-stack AI-powered medical image analysis platform for final-year project demonstration.

Doctors upload brain MRI images (JPG/PNG), submit them for AI-assisted analysis, view segmentation results in an interactive viewer, track history, compare scans, and generate reports.

## Monorepo Structure

```
medvision-ai/
├── frontend/      React + Vite + TypeScript
├── backend/       Spring Boot + Maven + Java 21
├── ai-service/    Python + FastAPI
├── database/      MySQL init scripts
├── docs/          Architecture & design documents
└── docker/        Docker Compose & Dockerfiles
```

## Technology Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite 8, TypeScript 6 |
| Backend | Spring Boot 4.1, Java 21, Maven, JWT (Phase 1), JPA, WebSocket (Phase 4) |
| Database | MySQL 8.x |
| AI Service | Python 3.11+, FastAPI, MONAI/PyTorch (Phase 3) |

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, AI_SERVICE_API_KEY (no hardcoded secrets)
```

### 2. MySQL (Docker)

```bash
cd docker
docker compose up mysql -d
```

### 3. Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Windows: .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

### 4. AI Service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# Unix: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Build & Test

```bash
# Frontend
cd frontend && npm install && npm run build

# Backend
cd backend && ./mvnw clean verify

# AI service (dependency check)
cd ai-service && pip install -r requirements.txt && python -c "from app.main import app"
```

## Docker (full stack)

```bash
cp .env.example .env   # configure secrets first
cd docker
docker compose up --build
```

## Documentation

- [Technical Design](docs/TECHNICAL_DESIGN.md)
- [Architecture Baseline](docs/ARCHITECTURE.md)
- [Development Setup](docs/DEVELOPMENT.md)

## Medical Disclaimer

MedVision AI provides decision support only. Derived DICOM files are secondary captures, not original MRI acquisitions. Not intended for clinical diagnosis.

## License

Academic / final-year project — all rights reserved by project team.
