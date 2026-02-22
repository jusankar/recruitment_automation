# TalentMatchAI

Resume ingestion and semantic candidate matching service for Recruitment Automation.

## About
TalentMatchAI is a FastAPI microservice that:
- Ingests resumes from recruiter upload, bulk payloads, or Gmail attachments
- Parses and structures resume text
- Stores embeddings in ChromaDB
- Retrieves and ranks candidates for a Job Description using OpenAI

## Architecture
1. Resume intake (`/upload-resume/`, `/add-resumes`, `/fetch-gmail-resumes`)
2. Resume parsing (`app/parser/resume_parser.py`)
3. Embedding + vector persistence (ChromaDB in `CHROMA_PERSIST_DIR`)
4. Search and retrieval (`/search`)
5. LLM scoring for strengths/gaps

## Tech Stack
- Python 3.11+
- FastAPI + Uvicorn
- ChromaDB
- OpenAI API
- PyPDF + python-docx
- Google Gmail API (optional intake path)

## Project Structure
```text
TalentMatchAI/
  app/
    main.py
    config.py
    ingestion.py
    retriever.py
    scorer.py
    parser/
    intake/
  requirements.txt
```

## API Endpoints
- `GET /` health message
- `POST /add-resumes` bulk resume ingestion
- `POST /upload-resume/` recruiter resume upload
- `GET /fetch-gmail-resumes` Gmail attachment ingestion
- `POST /search` candidate search by JD + filters

## Environment Variables
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

GMAIL_MAX_RESULTS=20
GMAIL_RESUME_LABEL=Resume Inbox
```

For Gmail ingestion, place OAuth files at:
- `TalentMatchAI/app/intake/credentials.json`
- `TalentMatchAI/app/intake/token.json` (generated after first auth)

## Setup and Installation
1. Create virtual environment
```bash
cd TalentMatchAI
python -m venv .venv
.venv\Scripts\activate
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Configure `.env` (see above)

4. Run service
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

5. Open docs
- `http://127.0.0.1:8000/docs`

## Notes
- CORS is configured for `http://localhost:3000` and `http://127.0.0.1:3000`.
- `/search` currently returns `scored_results`; downstream UI supports nested JSON formatting.
