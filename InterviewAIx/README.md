# InterviewAIx

AI-driven interview orchestration service for Recruitment Automation.

## About
InterviewAIx is a FastAPI microservice that:
- Starts interview sessions from recruiter-forwarded candidate profiles
- Generates interview questions
- Accepts candidate answers per `interview_id`
- Evaluates responses and computes risk
- Completes interview after `MAX_QUESTIONS`

## Architecture
1. Start interview (`POST /interview/start`)
2. Persist interview state in PostgreSQL via SQLAlchemy
3. For each answer (`POST /interview/{interview_id}/answer`):
   - Append Q/A to transcript
   - Run evaluator
   - Run risk classifier
   - Return next question until completion

## Tech Stack
- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy + PostgreSQL (`psycopg2-binary`)
- OpenAI API
- LangGraph

## Project Structure
```text
InterviewAIx/
  app/
    main.py
    api/interview_routes.py
    agents/
    models/interview.py
    schemas/interview_schema.py
    core/config.py
    core/database.py
  requirements.txt
```

## API Endpoints
- `GET /` health check
- `POST /interview/start`
- `POST /interview/{interview_id}/answer`

## Environment Variables
Create `InterviewAIx/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/interviewdb
```

## Setup and Installation
1. Create virtual environment
```bash
cd InterviewAIx
python -m venv .venv
.venv\Scripts\activate
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Configure `.env`

4. Run service
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

5. Open docs
- `http://127.0.0.1:8001/docs`

## Configuration Notes
- `MAX_QUESTIONS` is defined in `app/models/interview.py`.
- Tables are auto-created on service startup via `Base.metadata.create_all(bind=engine)`.
- CORS is enabled for `http://localhost:3000` and `http://127.0.0.1:3000`.
