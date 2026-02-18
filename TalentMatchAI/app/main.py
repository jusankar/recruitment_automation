from fastapi import FastAPI, BackgroundTasks, UploadFile, File
from .models import BulkResumeInput, JobQuery, ResumeFetchResponse
from .ingestion import ingest_bulk_resumes
from .retriever import retrieve_candidates
from .scorer import score_candidates
from app.intake.file_storage import save_file
from app.parser.resume_parser import parse_resume, structure_resume
from app.intake.gmail_fetcher import fetch_resume_emails

app = FastAPI(
    title="Commercial Recruitment RAG Service",
    version="1.1"
)
  
@app.post("/add-resumes")
def add_resumes(request: BulkResumeInput, background_tasks: BackgroundTasks):
    background_tasks.add_task(ingest_bulk_resumes, request.resumes)
    return {"status": "Bulk resume ingestion started"}

@app.post("/search")
def search(job_query: JobQuery):

    candidates = retrieve_candidates(job_query)

    if not candidates:
        return {
            "retrieved_count": 0,
            "scored_results": []
        }

    scored = score_candidates(
        job_query.job_description,
        candidates
    )

    return {
        "retrieved_count": len(candidates),
        "scored_results": scored
    }


@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    file_bytes = await file.read()
    file_path = save_file(file_bytes, file.filename)

    resume_text = parse_resume(file_path)
    structured_data = structure_resume(resume_text)

    metadata = {
        "file_path": file_path,
        "candidate_name": structured_data.get("name"),
        "skills": structured_data.get("skills"),
        "experience": structured_data.get("experience", 0),
        "location": structured_data.get("location", ""),
        "source": "upload"
    }

    background_tasks.add_task(
        ingest_bulk_resumes,
        [resume_text],
        [metadata]
    )

    return {
        "status": "Resume ingestion started",
        "file_path": file_path
    }

@app.get("/fetch-gmail-resumes")
def fetch_gmail(background_tasks: BackgroundTasks):

    file_paths = fetch_resume_emails()

    resume_texts = []
    metadatas = []

    for path in file_paths:
        resume_text = parse_resume(path)
        structured_data = structure_resume(resume_text)

        resume_texts.append(resume_text)

        metadatas.append({
            "file_path": path,
            "candidate_name": structured_data.get("name"),
            "skills": structured_data.get("skills"),
            "experience": structured_data.get("experience", 0),
            "location": structured_data.get("location", ""),
            "source": "gmail"
        })

    background_tasks.add_task(
        ingest_bulk_resumes,
        resume_texts,
        metadatas
    )

    return {
        "count": len(file_paths),
        "status": "Resume ingestion started"
    }

@app.get("/")
def root():
    return {"message": "Commercial Recruitment RAG Running"}

