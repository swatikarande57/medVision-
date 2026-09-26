# MedVision AI Monorepo

This repository contains the full stack for the MedVision AI platform, organized as a monorepo with the following components:

- **frontend** – React + Vite + TypeScript
- **backend** – Spring Boot (Java 21) + Maven
- **ai-service** – Python FastAPI
- **database** – MySQL (Dockerized)
- **docs** – Architecture and design documentation
- **docker** – Dockerfiles for each service

## Quick Start
```bash
# Clone the repo and cd into the monorepo
git clone <repo-url>
cd medvision-ai

# Copy example env file and edit as needed
cp .env.example .env

# Start all services via Docker Compose
docker compose up --build -d
```

Individual services can also be run locally:
- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && mvn spring-boot:run`
- AI Service: `cd ai-service && venv\Scripts\activate && uvicorn main:app --reload`

## Directory Structure
```
medvision-ai/
├─ frontend/
├─ backend/
├─ ai-service/
├─ database/
├─ docs/
├─ docker/
├─ .gitignore
├─ .env.example
├─ docker-compose.yml
└─ README.md
```
