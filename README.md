# Recruitment Automation

End-to-end recruitment platform composed of 3 apps:
- `TalentMatchAI` (resume ingestion + candidate matching)
- `InterviewAIx` (AI interview orchestration)
- `HireMatrixUI` (role-based web application)

## System Overview
1. Recruiter uploads resumes.
2. Talent search by JD, experience, and location.
3. Recruiter forwards selected candidates to interview.
4. Interview session + `interview_id` are created.
5. Candidate gets credentials, logs in, attends interview.
6. Director monitors outcomes and costs.

## High-Level Architecture
```text
                +----------------------+
                |     HireMatrixUI     |
                |  (Next.js Frontend)  |
                +----------+-----------+
                           |
           +---------------+----------------+
           |                                |
 +---------v----------+          +----------v---------+
 |    TalentMatchAI   |          |     InterviewAIx   |
 | Resume + RAG Match |          | Interview Q/A Loop |
 +---------+----------+          +----------+---------+
           |                                |
           +---------------+----------------+
                           |
                   +-------v--------+
                   |   PostgreSQL   |
                   | (UI + Interview)|
                   +----------------+
```

## Tech Stack
- Backend services: Python, FastAPI, OpenAI, SQLAlchemy, ChromaDB
- Frontend: Next.js 14, TypeScript, Tailwind, NextAuth, Prisma
- Database: PostgreSQL
- Optional integrations: Gmail intake, provider-based credential email service

## Repository Structure
```text
recruitment_automation/
  TalentMatchAI/
  InterviewAIx/
  HireMatrixUI/
```

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally
- OpenAI API key

## Docker Quick Start
Use this as the primary containerized workflow.

1. Configure root `.env` (copy from `.env.example` and update values).
2. Build and start all services:
```bash
docker compose up --build
```
3. Open:
- HireMatrixUI: `http://localhost:3000`
- TalentMatchAI docs: `http://localhost:8000/docs`
- InterviewAIx docs: `http://localhost:8001/docs`

Notes:
- This stack includes `postgres`, `talentmatchai`, `interviewaix`, `hirematrixui`.
- `hirematrixui` startup runs Prisma sync and bootstrap logic.

## Docker Standard Commands
Use these commands from the repository root for consistent local build/run.

1. Build all service images with current tag:
```bash
docker compose build --pull
```

2. Start the full stack in background:
```bash
docker compose up -d
```

3. Stream logs:
```bash
docker compose logs -f --tail=200
```

4. Stop and remove containers:
```bash
docker compose down
```

5. Stop and remove containers + volumes:
```bash
docker compose down -v
```

### Image Tagging and Versioning
- Compose now builds and tags service images as:
  - `${IMAGE_REGISTRY}/recruitment-talentmatchai:${IMAGE_TAG}`
  - `${IMAGE_REGISTRY}/recruitment-interviewaix:${IMAGE_TAG}`
  - `${IMAGE_REGISTRY}/recruitment-hirematrixui:${IMAGE_TAG}`
- Defaults are defined in `.env.example`:
  - `IMAGE_REGISTRY=local`
  - `IMAGE_TAG=v1.0.0`
- To build a specific version:
```bash
IMAGE_TAG=v1.1.0 docker compose build --pull
```

## Setup Order
Use this exact order to run all projects together.

### 1. Start PostgreSQL
Create database (example):
- `interviewdb`

### 2. Setup TalentMatchAI (Port 8000)
```bash
cd TalentMatchAI
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `TalentMatchAI/.env`:
```env
APP_NAME=TalentMatchAI
ENVIRONMENT=development
LOG_LEVEL=INFO
CHROMA_PERSIST_DIR=./chroma_db
COLLECTION_NAME=resumes
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=60
TOP_K=20
SIMILARITY_THRESHOLD=0.7
MAX_BATCH_SIZE=100
MAX_RESUME_LENGTH=20000
UPLOAD_DIR=./uploads
```

Run:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Setup InterviewAIx (Port 8001)
```bash
cd InterviewAIx
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `InterviewAIx/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/interviewdb
# For external managed Postgres, use:
# DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

Run:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 4. Setup HireMatrixUI (Port 3000)
```bash
cd HireMatrixUI
npm install
```

Create `HireMatrixUI/.env`:
```env
NEXTAUTH_SECRET=replace_with_secure_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_TALENT_API=http://127.0.0.1:8000
NEXT_PUBLIC_INTERVIEW_API=http://127.0.0.1:8001
DATABASE_URL=postgresql://postgres:password@localhost:5432/interviewdb
# For external managed Postgres, use:
# DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Optional
NEXT_PUBLIC_APP_VERSION=v1.0.0

# Email configuration (Nodemailer)
EMAIL_PROVIDER=gmail
EMAIL_FROM=your-email@gmail.com
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# SMTP provider (if EMAIL_PROVIDER=smtp)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

Initialize Prisma schema:
```bash
npx prisma generate
npx prisma db push
```

Run UI:
```bash
npm run dev
```

Open:
- `http://localhost:3000`

## Runtime Flow
1. Recruiter logs in to `HireMatrixUI`.
2. Resume upload is sent to `TalentMatchAI /upload-resume/`.
3. Candidate search calls `TalentMatchAI /search`.
4. Forward action calls UI API:
   - starts interview in `InterviewAIx /interview/start`
   - stores candidate, interview, and application data in DB
   - generates candidate login credentials
5. Candidate logs in and enters `interview_id`.
6. Q/A loop uses `InterviewAIx /interview/{interview_id}/answer` until complete.
7. Director views interview metrics/results in dashboard.

## Service URLs
- TalentMatchAI docs: `http://127.0.0.1:8000/docs`
- InterviewAIx docs: `http://127.0.0.1:8001/docs`
- HireMatrixUI: `http://localhost:3000`

## Additional Notes
- CORS is already set for local UI origins.
- Candidate credential email uses Nodemailer and can switch provider via `EMAIL_PROVIDER`.
- Project-specific docs:
  - `TalentMatchAI/README.md`
  - `InterviewAIx/README.md`
  - `HireMatrixUI/README.md`

## GitHub CI/CD
Workflows are configured in:
- `.github/workflows/ci.yml`
- `.github/workflows/docker-publish.yml`
- `.github/workflows/render-deploy.yml`

### Required GitHub Secrets
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `RENDER_DEPLOY_HOOK_TALENTMATCHAI`
- `RENDER_DEPLOY_HOOK_INTERVIEWAIX`

### Rollout Order
1. Enable CI (`ci.yml`) on PR/push to enforce lint + tests + image build checks.
2. Enable Docker publishing (`docker-publish.yml`) to push:
   - `latest` (default branch),
   - `vX.Y.Z` (tag pushes),
   - `sha-<commit>` (short commit SHA).
3. Deploy frontend (`HireMatrixUI`) on Vercel and point API env vars to backend URLs.

## Free Deployment Path
Use this order for a free-tier rollout:

1. Deploy backend on Render
- Blueprint file: `render.yaml` (repo root)
- Services: `recruitment-talentmatchai`, `recruitment-interviewaix`
- Database: `recruitment-postgres` (free plan)
- Set `OPENAI_API_KEY` in both Render services.
- Set CORS env vars in Render services:
  - `TALENT_CORS_ORIGINS=https://<your-vercel-app>.vercel.app,http://localhost:3000`
  - `INTERVIEW_CORS_ORIGINS=https://<your-vercel-app>.vercel.app,http://localhost:3000`

2. Deploy frontend on Vercel
- Framework: Next.js
- Root directory: `HireMatrixUI`
- Required env vars:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `DATABASE_URL` (Vercel Postgres/Neon/Supabase recommended; do not point to Render internal DB URL)
  - For external managed Postgres, append `?sslmode=require`
  - `NEXT_PUBLIC_TALENT_API` (Render public URL)
  - `NEXT_PUBLIC_INTERVIEW_API` (Render public URL)
  - Email provider vars (`EMAIL_PROVIDER`, `EMAIL_FROM`, provider credentials)



