# 🛡️ SentinelAI — Phishing & UPI Fraud Detection Platform

> AI-powered, explainable fraud detection. Built production-grade.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| ML | scikit-learn + SHAP |
| Container | Docker + Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL2 backend on Windows)
- Git

That's it. You do **not** need Python or Node installed locally.

---

## Quick Start (One Command)

**Step 1 — Clone and configure**
```bash
git clone <repo-url>
cd sentinelai

# Create your .env from the template
cp .env.example .env
# The default values in .env.example work for local development.
# No changes needed for Phase 1A.
```

**Step 2 — Start all services**
```bash
docker compose up --build
```

Wait for all 4 containers to report healthy. You'll see:
```
sentinelai_postgres  | database system is ready to accept connections
sentinelai_redis     | Ready to accept connections tcp
sentinelai_backend   | Application startup complete.
sentinelai_frontend  | Local:   http://localhost:5173/
```

**Step 3 — Verify**

| Service | URL | Expected |
|---|---|---|
| Frontend | http://localhost:5173 | SentinelAI boot page |
| API Docs | http://localhost:8000/docs | FastAPI Swagger UI |
| Health Check | http://localhost:8000/health | JSON with `"status": "healthy"` |

---

## Health Check Response

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "healthy",
  "app": "SentinelAI",
  "version": "0.1.0",
  "environment": "development",
  "services": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" }
  }
}
```

---

## Project Structure

```
sentinelai/
├── backend/            # FastAPI application
│   └── app/
│       ├── api/        # Route handlers
│       ├── core/       # Config, logging, security
│       └── db/         # SQLAlchemy engine + session
├── frontend/           # React + Vite
│   └── src/
│       ├── styles/     # CSS design system (tokens)
│       └── ...
├── training/           # ML training pipeline (Phase 3)
├── feature_extractor/  # Shared feature extraction (Phase 3)
├── explainability/     # SHAP service (Phase 3)
├── models/             # Trained model artifacts (gitignored)
├── docker-compose.yml
└── .env.example
```

---

## Development Commands

```bash
# Start all services with hot reload
docker compose up

# Rebuild after requirements.txt or package.json changes
docker compose up --build

# View backend logs only
docker compose logs -f backend

# Open a PostgreSQL shell
docker compose exec postgres psql -U sentinelai_user -d sentinelai_db

# Open a Redis shell
docker compose exec redis redis-cli

# Stop all services
docker compose down

# Stop and delete volumes (full reset)
docker compose down -v
```

---

## Build Phases

| Phase | Status | Description |
|---|---|---|
| 1A | ✅ **Current** | Infrastructure — Docker, FastAPI, React, Health Check |
| 1B | ⬜ Next | DB Models, Alembic, Frontend Shell, Landing Page |
| 2  | ⬜ | JWT Authentication |
| 3  | ⬜ | Phishing URL Detection + SHAP |
| 4  | ⬜ | UPI Fraud Detection + SHAP |
| 5  | ⬜ | Dashboard + Scan History |

---

## Environment Variables

See [`.env.example`](.env.example) for all available variables with descriptions.
