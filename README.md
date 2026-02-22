# RECRUITMENT_AUTOMATION

End-to-end recruitment platform composed of three projects:
- `TalentMatchAI` (resume ingestion + candidate matching)
- `InterviewAIx` (AI interview orchestration)
- `HireMatrixUI` (role-based web application)

## System Overview
The platform automates the hiring pipeline:
1. Recruiter uploads resumes
2. Talent search by JD, experience, location
3. Recruiter forwards selected candidate to interview
4. Interview session and `interview_id` are created
5. Candidate receives credentials + logs in + attends interview
6. Director monitors interview outcomes and costs

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
- Optional integrations: Gmail intake, credential email webhook

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

## Setup Order (Important)
Use this exact order to run all projects together.

### 1) Start PostgreSQL
Create database (example):
- `interviewdb`

### 2) Setup and run TalentMatchAI (Port 8000)
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

### 3) Setup and run InterviewAIx (Port 8001)
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
```

Run:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 4) Setup and run HireMatrixUI (Port 3000)
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

# Optional
NEXT_PUBLIC_APP_VERSION=v1.0.0
CREDENTIAL_EMAIL_WEBHOOK_URL=
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
1. Recruiter logs in to `HireMatrixUI`
2. Resume upload is sent to `TalentMatchAI /upload-resume/`
3. Candidate search calls `TalentMatchAI /search`
4. Forward action calls UI API:
   - starts interview in `InterviewAIx /interview/start`
   - stores candidate, interview, and application data in DB
   - generates candidate login credentials
5. Candidate logs in and enters `interview_id`
6. Q/A loop uses `InterviewAIx /interview/{interview_id}/answer` until complete
7. Director views interview metrics/results in dashboard

## Service URLs
- TalentMatchAI docs: `http://127.0.0.1:8000/docs`
- InterviewAIx docs: `http://127.0.0.1:8001/docs`
- HireMatrixUI: `http://localhost:3000`

## Additional Notes
- CORS for services is already set for local UI origins.
- Candidate credential email depends on `CREDENTIAL_EMAIL_WEBHOOK_URL`.
- For project-specific details, see:
  - `TalentMatchAI/README.md`
  - `InterviewAIx/README.md`
  - `HireMatrixUI/README.md`
